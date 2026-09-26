'use server';

import { createClient } from '@supabase/supabase-js';
import { 
  ConfigAprovadorOS, 
  EtapaOS, 
  OSHistoricoEtapa, 
  OSNotificacaoLog,
  CriticidadeOS 
} from '@/lib/types/osWorkflow';
import { OrdemServicoFrota, Viatura } from '@/lib/types/frota';
import { OSWorkflowEngine } from '@/lib/services/OSWorkflowEngine';
import { OSNotificationDispatcher } from '@/lib/services/OSNotificationDispatcher';

const getSupabaseAdminClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase URL ou chave de serviço não configurada no servidor.');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
};

// Fallback inicial em memória caso a migration ainda esteja sendo executada
const DEFAULT_APROVADORES_MOCK: ConfigAprovadorOS[] = [
  {
    id: 'apr-01',
    contrato_id: 'GLOBAL',
    nome_aprovador: 'Eng. Carlos Mendes',
    cargo: 'Coord. de Frota e Emergência',
    email: 'carlos.mendes@siger.com.br',
    whatsapp: '+55 (94) 99123-4567',
    nivel_alcada: 1,
    valor_minimo: 0.00,
    valor_maximo: 5000.00,
    is_aprovador_imediato: true,
    receber_emergencia_24h: true,
    notificar_in_app: true,
    notificar_email: true,
    notificar_whatsapp: true,
    ativo: true
  },
  {
    id: 'apr-02',
    contrato_id: 'GLOBAL',
    nome_aprovador: 'Marcos Albuquerque',
    cargo: 'Gerente de Operações e Manutenção',
    email: 'marcos.albuquerque@siger.com.br',
    whatsapp: '+55 (94) 98111-2233',
    nivel_alcada: 2,
    valor_minimo: 5000.01,
    valor_maximo: 20000.00,
    is_aprovador_imediato: false,
    receber_emergencia_24h: true,
    notificar_in_app: true,
    notificar_email: true,
    notificar_whatsapp: true,
    ativo: true
  },
  {
    id: 'apr-03',
    contrato_id: 'GLOBAL',
    nome_aprovador: 'Jackson Leal',
    cargo: 'Diretoria de Operações & SPCI',
    email: 'jackson602@gmail.com',
    whatsapp: '+55 (94) 99200-8899',
    nivel_alcada: 3,
    valor_minimo: 20000.01,
    valor_maximo: 999999.00,
    is_aprovador_imediato: false,
    receber_emergencia_24h: true,
    notificar_in_app: true,
    notificar_email: true,
    notificar_whatsapp: true,
    ativo: true
  }
];

// ==============================================================================
// 1. GESTÃO DA MATRIZ DE APROVADORES & ALÇADAS
// ==============================================================================

export async function listAprovadoresAction(contratoId?: string): Promise<{
  success: boolean;
  data: ConfigAprovadorOS[];
  error?: string;
}> {
  try {
    const supabase = getSupabaseAdminClient();
    let query = supabase
      .from('config_aprovadores_os')
      .select('*')
      .order('nivel_alcada', { ascending: true })
      .order('valor_minimo', { ascending: true });

    if (contratoId && contratoId !== 'TODOS' && contratoId !== 'GLOBAL') {
      query = query.or(`contrato_id.eq.${contratoId},contrato_id.eq.GLOBAL`);
    }

    const { data, error } = await query;
    if (error) {
      console.warn('[listAprovadoresAction] Tabela não disponível, usando fallback inicial:', error.message);
      return { success: true, data: DEFAULT_APROVADORES_MOCK };
    }

    return { success: true, data: (data && data.length > 0 ? data : DEFAULT_APROVADORES_MOCK) as ConfigAprovadorOS[] };
  } catch (err: any) {
    console.warn('[listAprovadoresAction] Erro com fallback:', err.message);
    return { success: true, data: DEFAULT_APROVADORES_MOCK };
  }
}

export async function saveAprovadorAction(aprovador: Partial<ConfigAprovadorOS>): Promise<{
  success: boolean;
  data?: ConfigAprovadorOS;
  error?: string;
}> {
  try {
    const supabase = getSupabaseAdminClient();

    // Validações básicas de negócio
    if (!aprovador.nome_aprovador || !aprovador.email || !aprovador.whatsapp) {
      return { success: false, error: 'Nome, e-mail e WhatsApp são obrigatórios.' };
    }

    const valMin = Number(aprovador.valor_minimo || 0);
    const valMax = Number(aprovador.valor_maximo || 5000);

    if (valMin >= valMax) {
      return { success: false, error: 'O Valor Mínimo deve ser estritamente menor que o Valor Máximo.' };
    }

    const payload = {
      ...aprovador,
      contrato_id: aprovador.contrato_id || 'GLOBAL',
      valor_minimo: valMin,
      valor_maximo: valMax,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('config_aprovadores_os')
      .upsert(payload)
      .select('*')
      .single();

    if (error) throw error;
    return { success: true, data: data as ConfigAprovadorOS };
  } catch (err: any) {
    console.error('[saveAprovadorAction] Erro ao salvar aprovador:', err);
    return { success: false, error: err?.message || 'Erro ao persistir aprovador.' };
  }
}

export async function deleteAprovadorAction(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseAdminClient();
    const { error } = await supabase.from('config_aprovadores_os').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error('[deleteAprovadorAction] Erro ao excluir aprovador:', err);
    return { success: false, error: err?.message || 'Falha ao remover aprovador.' };
  }
}

// ==============================================================================
// 2. TRANSIÇÃO DE WORKFLOW E ESTADOS DA ORDEM DE SERVIÇO
// ==============================================================================

export async function processOSWorkflowTransitionAction(
  osId: string,
  targetEtapa: EtapaOS,
  dados: {
    responsavelNome: string;
    observacao?: string;
    novoStatus?: string;
    valorEstimado?: number;
    aprovadorId?: string;
  }
): Promise<{ success: boolean; data?: OrdemServicoFrota; auditLog?: OSHistoricoEtapa; error?: string }> {
  try {
    const supabase = getSupabaseAdminClient();

    // 1. Carrega OS existente
    const { data: os, error: osErr } = await supabase
      .from('ordens_servico_frota')
      .select('*, viatura:viaturas(*)')
      .eq('id', osId)
      .single();

    if (osErr || !os) {
      throw new Error(`Ordem de serviço ${osId} não encontrada.`);
    }

    const etapaAtual = (os.etapa_atual || '1_ABERTURA_TRIAGEM') as EtapaOS;

    // 2. Valida transição
    const validacao = OSWorkflowEngine.canTransition(etapaAtual, targetEtapa);
    if (!validacao.allowed) {
      return { success: false, error: validacao.reason };
    }

    const targetNumero = OSWorkflowEngine.getEtapaNumero(targetEtapa);
    const novoStatus = dados.novoStatus || (
      targetEtapa === '4_APROVADA_EM_EXECUCAO' ? 'EM_EXECUCAO' :
      targetEtapa === '6_CONCLUIDA_LIBERADA' ? 'CONCLUIDA' :
      os.status_os || os.status || 'ABERTA'
    );

    const updatePayload: any = {
      etapa_atual: targetEtapa,
      numero_etapa: targetNumero,
      status: novoStatus,
      status_os: novoStatus,
      updated_at: new Date().toISOString()
    };

    if (dados.valorEstimado !== undefined) {
      updatePayload.valor_estimado = Number(dados.valorEstimado);
    }

    if (dados.aprovadorId) {
      updatePayload.aprovador_imediato_id = dados.aprovadorId;
    }

    if (targetEtapa === '4_APROVADA_EM_EXECUCAO') {
      updatePayload.status_aprovacao = 'APROVADA';
      updatePayload.data_aprovacao = new Date().toISOString();
      updatePayload.responsavel_aprovacao = dados.responsavelNome;
    } else if (targetEtapa === '6_CONCLUIDA_LIBERADA') {
      updatePayload.data_conclusao = new Date().toISOString();
    }

    // 3. Salva atualização da OS
    const { data: updatedOS, error: updateErr } = await supabase
      .from('ordens_servico_frota')
      .update(updatePayload)
      .eq('id', osId)
      .select('*, viatura:viaturas(*)')
      .single();

    if (updateErr) throw updateErr;

    // 4. Salva auditoria na tabela os_historico_etapas
    const auditRecord = OSWorkflowEngine.createAuditEntry(
      osId,
      etapaAtual,
      targetEtapa,
      os.status_os || os.status,
      novoStatus,
      'SEMI_AUTOMATICA',
      dados.responsavelNome,
      dados.observacao
    );

    try {
      await supabase.from('os_historico_etapas').insert(auditRecord);
    } catch (err: any) {
      console.warn('[Audit Log] Falha ao persistir histórico imutável:', err?.message);
    }

    // 5. Atualiza status operacional da viatura
    if (os.viatura_id) {
      if (targetEtapa === '4_APROVADA_EM_EXECUCAO') {
        const viaturaStatus = os.tipo_os === 'EXTERNA' ? 'EM_OFICINA_EXTERNA' : 'EM_MANUTENCAO_INTERNA';
        await supabase.from('viaturas').update({ status_operacional: viaturaStatus }).eq('id', os.viatura_id);
      } else if (targetEtapa === '6_CONCLUIDA_LIBERADA') {
        await supabase.from('viaturas').update({ status_operacional: 'DISPONIVEL' }).eq('id', os.viatura_id);
      }
    }

    return { success: true, data: updatedOS as OrdemServicoFrota, auditLog: auditRecord };
  } catch (err: any) {
    console.error('[processOSWorkflowTransitionAction] Erro:', err);
    return { success: false, error: err?.message || 'Falha ao processar transição de etapa.' };
  }
}

// ==============================================================================
// 3. APROVAÇÃO RÁPIDA EM 1 CLIQUE
// ==============================================================================

export async function quickApproveOSAction(
  osId: string,
  aprovadorNome: string,
  aprovadorId?: string,
  observacao?: string
): Promise<{ success: boolean; data?: OrdemServicoFrota; error?: string }> {
  try {
    const res = await processOSWorkflowTransitionAction(osId, '4_APROVADA_EM_EXECUCAO', {
      responsavelNome: aprovadorNome,
      observacao: observacao || 'Aprovada em 1 clique via Central de Notificações / Cockpit Executivo.',
      novoStatus: 'EM_EXECUCAO',
      aprovadorId
    });

    return res;
  } catch (err: any) {
    console.error('[quickApproveOSAction] Erro na aprovação rápida:', err);
    return { success: false, error: err?.message || 'Erro ao aprovar Ordem de Serviço.' };
  }
}

// ==============================================================================
// 4. CONSULTA DE ORDENS DE SERVIÇO PENDENTES DE APROVAÇÃO (SINO DO HEADER)
// ==============================================================================

export async function listPendingOSForApprovalAction(
  contratoId?: string
): Promise<{ success: boolean; data: OrdemServicoFrota[]; error?: string }> {
  try {
    const supabase = getSupabaseAdminClient();
    let query = supabase
      .from('ordens_servico_frota')
      .select('*, viatura:viaturas(*)')
      .or('etapa_atual.eq.3_AGUARDANDO_APROVACAO,status_aprovacao.eq.PENDENTE,prioridade.eq.EMERGENCIA')
      .neq('status_os', 'CONCLUIDA')
      .neq('status_os', 'CANCELADA')
      .order('prioridade', { ascending: false }) // EMERGENCIA primeiro
      .order('data_abertura', { ascending: false });

    if (contratoId && contratoId !== 'TODOS' && contratoId !== 'GLOBAL') {
      query = query.eq('contrato_id', contratoId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return { success: true, data: (data || []) as OrdemServicoFrota[] };
  } catch (err: any) {
    console.error('[listPendingOSForApprovalAction] Erro:', err);
    return { success: false, data: [], error: err?.message || 'Erro ao listar OS pendentes.' };
  }
}

// ==============================================================================
// 5. DISPARO E LOG DE ALERTAS OMNICHANNEL (WHATSAPP & E-MAIL)
// ==============================================================================

export async function dispatchOSAlertsAction(
  osId: string,
  canais: Array<'IN_APP' | 'EMAIL' | 'WHATSAPP'> = ['IN_APP', 'EMAIL', 'WHATSAPP']
): Promise<{
  success: boolean;
  whatsAppPayload?: { url: string; text: string; recipientNumber: string };
  emailPayload?: { subject: string; html: string };
  error?: string;
}> {
  try {
    const supabase = getSupabaseAdminClient();

    // 1. Carrega OS com viatura
    const { data: os, error: osErr } = await supabase
      .from('ordens_servico_frota')
      .select('*, viatura:viaturas(*)')
      .eq('id', osId)
      .single();

    if (osErr || !os) throw new Error('OS não encontrada para disparo de alertas.');

    // 2. Carrega todos os aprovadores
    const aprovadoresRes = await listAprovadoresAction(os.contrato_id);
    const aprovadores = aprovadoresRes.data;

    // 3. Localiza aprovador imediato ou roteia pela alçada
    let aprovador: ConfigAprovadorOS | null = null;
    if (os.aprovador_imediato_id) {
      aprovador = aprovadores.find(a => a.id === os.aprovador_imediato_id) || null;
    }
    if (!aprovador) {
      aprovador = OSWorkflowEngine.routeApprover(os.valor_estimado || os.custo_total || 0, os.contrato_id, aprovadores);
    }
    if (!aprovador) {
      aprovador = aprovadores[0] || null;
    }

    if (!aprovador) {
      throw new Error('Nenhum aprovador configurado para o contrato/alçada desta OS.');
    }

    const viatura: Viatura = os.viatura || {
      id: os.viatura_id,
      prefixo_frota: 'VTR-OPERACIONAL',
      placa: 'SEM-PLACA',
      marca: 'Toyota',
      modelo: 'Hilux 4x4',
      tipo_veiculo: 'CAMINHONETE',
      tipo_combustivel: 'DIESEL_S10',
      odometro_atual_km: os.odometro_km || 0,
      status_operacional: 'EM_MANUTENCAO_INTERNA',
      contrato_id: os.contrato_id
    };

    // 4. Gera Payloads
    const whatsAppPayload = OSNotificationDispatcher.generateWhatsAppMessage(os, viatura, aprovador);
    const emailPayload = OSNotificationDispatcher.generateEmailHtml(os, viatura, aprovador);

    // 5. Registra logs no banco de dados
    for (const canal of canais) {
      const logEntry = OSNotificationDispatcher.createNotificationLog(
        os,
        viatura,
        aprovador,
        canal,
        `[${(os.prioridade || 'NORMAL').toUpperCase()}] OS #${os.numero_os} - ${viatura.prefixo_frota}`,
        canal === 'WHATSAPP' ? whatsAppPayload.text : `Notificação enviada para ${aprovador.email}`
      );

      try {
        await supabase.from('os_notificacoes_log').insert(logEntry);
      } catch (e: any) {
        console.warn(`[Log Notificação] Erro ao gravar log para canal ${canal}:`, e?.message);
      }
    }

    return {
      success: true,
      whatsAppPayload,
      emailPayload
    };
  } catch (err: any) {
    console.error('[dispatchOSAlertsAction] Erro no disparo:', err);
    return { success: false, error: err?.message || 'Falha ao despachar alertas omnichannel.' };
  }
}

// ==============================================================================
// 6. HISTÓRICO DE AUDITORIA DE UMA OS
// ==============================================================================

export async function listOSAuditHistoryAction(osId: string): Promise<{
  success: boolean;
  data: OSHistoricoEtapa[];
  error?: string;
}> {
  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from('os_historico_etapas')
      .select('*')
      .eq('os_id', osId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return { success: true, data: (data || []) as OSHistoricoEtapa[] };
  } catch (err: any) {
    console.warn('[listOSAuditHistoryAction] Erro ao buscar auditoria:', err);
    return { success: true, data: [] };
  }
}
