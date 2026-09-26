import { 
  CriticidadeOS, 
  EtapaOS, 
  ConfigAprovadorOS, 
  OSHistoricoEtapa, 
  ETAPAS_WORKFLOW_OS,
  OrigemAberturaOS 
} from '@/lib/types/osWorkflow';
import { OrdemServicoFrota, Viatura } from '@/lib/types/frota';

export class OSWorkflowEngine {
  /**
   * Retorna o número ordinal (1 a 6) da etapa atual
   */
  static getEtapaNumero(etapa: EtapaOS | string): number {
    switch (etapa) {
      case '1_ABERTURA_TRIAGEM': return 1;
      case '2_ORCAMENTACAO_DIAGNOSTICO': return 2;
      case '3_AGUARDANDO_APROVACAO': return 3;
      case '4_APROVADA_EM_EXECUCAO': return 4;
      case '5_CONFERENCIA_QUALIDADE': return 5;
      case '6_CONCLUIDA_LIBERADA': return 6;
      default: return 1;
    }
  }

  /**
   * Roteamento semi-automático para selecionar o aprovador ideal pela faixa de valor e contrato
   */
  static routeApprover(
    valorEstimado: number,
    contratoId: string,
    aprovadores: ConfigAprovadorOS[]
  ): ConfigAprovadorOS | null {
    if (!aprovadores || aprovadores.length === 0) return null;

    const valor = Number(valorEstimado || 0);

    // Filtra aprovadores ativos compatíveis com o contrato (ou de escopo GLOBAL)
    const candidatos = aprovadores.filter(ap => {
      if (!ap.ativo) return false;
      const contratoMatch = ap.contrato_id === 'GLOBAL' || 
        ap.contrato_id.toUpperCase() === contratoId.toUpperCase();
      const faixaMatch = valor >= ap.valor_minimo && valor <= ap.valor_maximo;
      return contratoMatch && faixaMatch;
    });

    if (candidatos.length === 0) {
      // Fallback: se nenhum estiver exatamente na faixa, busca o aprovador de nível mais alto (Diretoria)
      const diretoria = aprovadores
        .filter(ap => ap.ativo && (ap.contrato_id === 'GLOBAL' || ap.contrato_id.toUpperCase() === contratoId.toUpperCase()))
        .sort((a, b) => b.valor_maximo - a.valor_maximo)[0];
      return diretoria || null;
    }

    // Prioriza aquele com a flag is_aprovador_imediato ativa
    const imediato = candidatos.find(c => c.is_aprovador_imediato);
    if (imediato) return imediato;

    // Caso contrário, ordena pelo menor nível de alçada (mais próximo do operacional)
    candidatos.sort((a, b) => a.nivel_alcada - b.nivel_alcada);
    return candidatos[0];
  }

  /**
   * Valida se a transição entre etapas é permitida
   */
  static canTransition(
    etapaAtual: EtapaOS | string,
    etapaDestino: EtapaOS | string
  ): { allowed: boolean; reason?: string } {
    const numAtual = this.getEtapaNumero(etapaAtual);
    const numDestino = this.getEtapaNumero(etapaDestino);

    // Permite avançar 1 etapa, ou pular diretamente para Aguardando Aprovação em emergências
    if (numDestino === numAtual + 1) {
      return { allowed: true };
    }

    if (numDestino > numAtual) {
      // Avanço não sequencial: permitido se for para 3_AGUARDANDO_APROVACAO a partir da triagem
      if (etapaAtual === '1_ABERTURA_TRIAGEM' && etapaDestino === '3_AGUARDANDO_APROVACAO') {
        return { allowed: true };
      }
      return { 
        allowed: false, 
        reason: `Não é permitido pular da etapa ${numAtual} diretamente para a etapa ${numDestino}. Respeite o fluxo sequencial.` 
      };
    }

    // Retrocesso permitido para revisão de orçamento
    if (numDestino < numAtual) {
      if (etapaDestino === '2_ORCAMENTACAO_DIAGNOSTICO' && etapaAtual === '3_AGUARDANDO_APROVACAO') {
        return { allowed: true };
      }
      return { 
        allowed: false, 
        reason: 'Retrocesso de etapas só é permitido de "Aguardando Aprovação" para "Orçamentação" para revisão de custos.' 
      };
    }

    return { allowed: true };
  }

  /**
   * Disparo automático decorrente de reprovação grave em Checklist veicular ou TWI crítico
   */
  static handleEmergencyTrigger(
    viatura: Viatura,
    motivo: string,
    origem: OrigemAberturaOS,
    aprovadores: ConfigAprovadorOS[]
  ): { osData: Partial<OrdemServicoFrota>; auditLog: OSHistoricoEtapa } {
    const contrato = viatura.contrato_id || 'ONÇA PUMA';
    const valorEstimadoInicial = 2500.00; // Cotação emergencial balizada
    const aprovador = this.routeApprover(valorEstimadoInicial, contrato, aprovadores);

    const osData: Partial<OrdemServicoFrota> = {
      contrato_id: contrato,
      viatura_id: viatura.id,
      numero_os: `OS-EMERG-${Date.now().toString().slice(-6)}`,
      natureza_manutencao: 'EMERGENCIAL',
      tipo_manutencao: 'CORRETIVA',
      tipo_os: 'INTERNA',
      prioridade: 'EMERGENCIA',
      etapa_atual: '3_AGUARDANDO_APROVACAO',
      numero_etapa: 3,
      status: 'ABERTA',
      status_os: 'ABERTA',
      status_aprovacao: 'PENDENTE',
      origem_abertura: origem,
      descricao_servico: `[INTERDIÇÃO AUTOMÁTICA] ${motivo}. Viatura baixada imediatamente por risco operacional.`,
      descricao_motivo: motivo,
      valor_estimado: valorEstimadoInicial,
      aprovador_imediato_id: aprovador?.id || null,
      data_abertura: new Date().toISOString()
    };

    const auditLog: OSHistoricoEtapa = {
      id: crypto.randomUUID(),
      os_id: '', // preenchido ao salvar
      etapa_anterior: null,
      etapa_nova: '3_AGUARDANDO_APROVACAO',
      status_anterior: null,
      status_novo: 'ABERTA',
      tipo_transicao: 'AUTOMATICA',
      responsavel_nome: 'Sistema SIGER (Gatilho Crítico Telemetria)',
      observacao: `Abertura automática de OS emergencial originada por ${origem}: ${motivo}`,
      created_at: new Date().toISOString()
    };

    return { osData, auditLog };
  }

  /**
   * Processa a aprovação em 1 clique da Ordem de Serviço
   */
  static handleApproval(
    os: OrdemServicoFrota,
    aprovadorNome: string,
    aprovadorId?: string,
    observacao?: string
  ): { updatedOS: Partial<OrdemServicoFrota>; auditLog: OSHistoricoEtapa } {
    const updatedOS: Partial<OrdemServicoFrota> = {
      ...os,
      etapa_atual: '4_APROVADA_EM_EXECUCAO',
      numero_etapa: 4,
      status: 'EM_EXECUCAO',
      status_os: 'EM_EXECUCAO',
      status_aprovacao: 'APROVADA',
      data_aprovacao: new Date().toISOString(),
      responsavel_aprovacao: aprovadorNome,
      aprovador_imediato_id: aprovadorId || os.aprovador_imediato_id
    };

    const auditLog: OSHistoricoEtapa = {
      id: crypto.randomUUID(),
      os_id: os.id,
      etapa_anterior: os.etapa_atual || '3_AGUARDANDO_APROVACAO',
      etapa_nova: '4_APROVADA_EM_EXECUCAO',
      status_anterior: os.status_os || os.status || 'ABERTA',
      status_novo: 'EM_EXECUCAO',
      tipo_transicao: 'SEMI_AUTOMATICA',
      responsavel_nome: aprovadorNome,
      observacao: observacao || 'OS aprovada via aprovação rápida (1 clique). Viatura em execução na oficina.',
      created_at: new Date().toISOString()
    };

    return { updatedOS, auditLog };
  }

  /**
   * Encerra e conclui a OS, liberando a viatura de volta para operação
   */
  static handleConclusion(
    os: OrdemServicoFrota,
    responsavelNome: string,
    observacao?: string
  ): { updatedOS: Partial<OrdemServicoFrota>; auditLog: OSHistoricoEtapa } {
    const updatedOS: Partial<OrdemServicoFrota> = {
      ...os,
      etapa_atual: '6_CONCLUIDA_LIBERADA',
      numero_etapa: 6,
      status: 'CONCLUIDA',
      status_os: 'CONCLUIDA',
      data_conclusao: new Date().toISOString()
    };

    const auditLog: OSHistoricoEtapa = {
      id: crypto.randomUUID(),
      os_id: os.id,
      etapa_anterior: os.etapa_atual || '5_CONFERENCIA_QUALIDADE',
      etapa_nova: '6_CONCLUIDA_LIBERADA',
      status_anterior: os.status_os || os.status || 'EM_EXECUCAO',
      status_novo: 'CONCLUIDA',
      tipo_transicao: 'MANUAL',
      responsavel_nome: responsavelNome,
      observacao: observacao || 'OS concluída com sucesso. Teste de rodagem e pós-serviço homologados. Viatura liberada.',
      created_at: new Date().toISOString()
    };

    return { updatedOS, auditLog };
  }

  /**
   * Gera registro de trilha de auditoria para qualquer transição
   */
  static createAuditEntry(
    osId: string,
    etapaAnterior: string | null | undefined,
    etapaNova: EtapaOS,
    statusAnterior: string | null | undefined,
    statusNovo: string,
    tipoTransicao: 'AUTOMATICA' | 'SEMI_AUTOMATICA' | 'MANUAL',
    responsavelNome: string,
    observacao?: string
  ): OSHistoricoEtapa {
    return {
      id: crypto.randomUUID(),
      os_id: osId,
      etapa_anterior: etapaAnterior || null,
      etapa_nova: etapaNova,
      status_anterior: statusAnterior || null,
      status_novo: statusNovo,
      tipo_transicao: tipoTransicao,
      responsavel_nome: responsavelNome,
      observacao: observacao || null,
      created_at: new Date().toISOString()
    };
  }
}
