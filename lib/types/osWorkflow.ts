export type CriticidadeOS = 'NORMAL' | 'URGENTE' | 'EMERGENCIA';

export type EtapaOS = 
  | '1_ABERTURA_TRIAGEM'
  | '2_ORCAMENTACAO_DIAGNOSTICO'
  | '3_AGUARDANDO_APROVACAO'
  | '4_APROVADA_EM_EXECUCAO'
  | '5_CONFERENCIA_QUALIDADE'
  | '6_CONCLUIDA_LIBERADA';

export type StatusAprovacaoOS = 'PENDENTE' | 'APROVADA' | 'REJEITADA' | 'EM_REVISAO';

export type OrigemAberturaOS = 'MANUAL' | 'CHECKLIST_8_SISTEMAS' | 'LAUDO_TWI_PNEUS';

export interface ConfigAprovadorOS {
  id: string;
  contrato_id: string;
  usuario_id?: string | null;
  nome_aprovador: string;
  cargo: string;
  email: string;
  whatsapp: string;
  nivel_alcada: 1 | 2 | 3; // 1: Operacional (até R$ 5k), 2: Gerencial (até R$ 20k), 3: Diretoria (acima de R$ 20k)
  valor_minimo: number;
  valor_maximo: number;
  is_aprovador_imediato: boolean;
  receber_emergencia_24h: boolean;
  notificar_in_app: boolean;
  notificar_email: boolean;
  notificar_whatsapp: boolean;
  ativo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface OSHistoricoEtapa {
  id: string;
  os_id: string;
  etapa_anterior?: string | null;
  etapa_nova: EtapaOS;
  status_anterior?: string | null;
  status_novo: string;
  tipo_transicao: 'AUTOMATICA' | 'SEMI_AUTOMATICA' | 'MANUAL';
  responsavel_nome: string;
  observacao?: string | null;
  created_at: string;
}

export interface OSNotificacaoLog {
  id: string;
  contrato_id: string;
  os_id: string;
  aprovador_id?: string | null;
  viatura_prefixo: string;
  viatura_placa: string;
  prioridade_os: CriticidadeOS;
  status_os: string;
  etapa_os: EtapaOS;
  canal: 'IN_APP' | 'EMAIL' | 'WHATSAPP';
  titulo: string;
  mensagem: string;
  lida: boolean;
  data_leitura?: string | null;
  status_envio: 'FILA' | 'ENVIADO' | 'FALHA';
  created_at: string;
}

export interface EtapaDefinicao {
  etapa: EtapaOS;
  numero: number;
  titulo: string;
  subtitulo: string;
  descricao: string;
  cor: string;
}

export const ETAPAS_WORKFLOW_OS: EtapaDefinicao[] = [
  {
    etapa: '1_ABERTURA_TRIAGEM',
    numero: 1,
    titulo: 'Abertura & Triagem',
    subtitulo: 'Registro inicial e classificação',
    descricao: 'Registro do defeito ou chamado gerado automaticamente pelo checklist/laudo.',
    cor: '#38bdf8' // Sky
  },
  {
    etapa: '2_ORCAMENTACAO_DIAGNOSTICO',
    numero: 2,
    titulo: 'Orçamentação & Diagnóstico',
    subtitulo: 'Levantamento de peças e custos',
    descricao: 'Laudo mecânico, cotação de peças, mão de obra e pneus credenciados.',
    cor: '#f59e0b' // Amber
  },
  {
    etapa: '3_AGUARDANDO_APROVACAO',
    numero: 3,
    titulo: 'Aguardando Aprovação',
    subtitulo: 'Roteamento por alçada financeira',
    descricao: 'Disponibilizada ao aprovador imediato conforme valor e criticidade.',
    cor: '#ec4899' // Rose/Pink
  },
  {
    etapa: '4_APROVADA_EM_EXECUCAO',
    numero: 4,
    titulo: 'Em Execução na Oficina',
    subtitulo: 'Serviço autorizado e em curso',
    descricao: 'Viatura em manutenção na oficina interna ou rede credenciada.',
    cor: '#68D346' // Neon Green
  },
  {
    etapa: '5_CONFERENCIA_QUALIDADE',
    numero: 5,
    titulo: 'Conferência de Qualidade',
    subtitulo: 'Teste de rodagem e pós-serviço',
    descricao: 'Inspeção técnica dos serviços executados e validação das notas fiscais.',
    cor: '#818cf8' // Indigo
  },
  {
    etapa: '6_CONCLUIDA_LIBERADA',
    numero: 6,
    titulo: 'Concluída & Liberada',
    subtitulo: 'Viatura operacional em campo',
    descricao: 'Encerramento formal da OS. Viatura retorna ao status DISPONÍVEL.',
    cor: '#10b981' // Emerald
  }
];

export const CRITICIDADE_INFO = {
  NORMAL: {
    label: 'Normal',
    badge: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10',
    dot: 'bg-emerald-400',
    slaHoras: 48,
    descricao: 'Manutenção programada / Preventiva / Estética'
  },
  URGENTE: {
    label: 'Urgente',
    badge: 'border-amber-500 text-amber-400 bg-amber-500/10 animate-pulse',
    dot: 'bg-amber-400 shadow-[0_0_8px_#f59e0b]',
    slaHoras: 2,
    descricao: 'Falha funcional parcial / Risco iminente de parada'
  },
  EMERGENCIA: {
    label: 'Emergência',
    badge: 'bg-red-600/20 border-red-500 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.4)]',
    dot: 'bg-red-500 animate-ping shadow-[0_0_12px_#ef4444]',
    slaHoras: 0.5,
    descricao: 'Viatura de resgate/APH interditada ou TWI <= 1,60mm'
  }
};
