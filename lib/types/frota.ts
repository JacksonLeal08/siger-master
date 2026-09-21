export type TipoVeiculo = 
  | 'CAMINHONETE' 
  | 'AMBULANCIA' 
  | 'CAMINHAO_INCENDIO' 
  | 'UTILITARIO' 
  | 'OUTRO';

export type TipoCombustivel = 
  | 'DIESEL_S10' 
  | 'GASOLINA' 
  | 'ETANOL' 
  | 'FLEX' 
  | 'ELETRICO' 
  | 'HIBRIDO';

export type StatusOperacionalViatura = 
  | 'DISPONIVEL' 
  | 'EM_DESLOCAMENTO' 
  | 'EM_MANUTENCAO_INTERNA' 
  | 'EM_OFICINA_EXTERNA' 
  | 'BAIXADO';

export type PosicaoPneu = 
  | 'DIANTEIRO_ESQUERDO' 
  | 'DIANTEIRO_DIREITO' 
  | 'TRASEIRO_ESQUERDO' 
  | 'TRASEIRO_DIREITO' 
  | 'ESTEPE' 
  | 'TRASEIRO_DUPLO_ESQ_EXT' 
  | 'TRASEIRO_DUPLO_ESQ_INT' 
  | 'TRASEIRO_DUPLO_DIR_EXT' 
  | 'TRASEIRO_DUPLO_DIR_INT';

export type StatusTwi = 
  | 'CONFORME'          // >= 3.0 mm
  | 'ATENCAO'           // 1.7 a 2.9 mm
  | 'CRITICO_PROIBIDO'; // <= 1.6 mm (CONTRAN 558/80)

export type StatusOrdemServico = 
  | 'ABERTA' 
  | 'EM_ANDAMENTO' 
  | 'AGUARDANDO_PECAS' 
  | 'CONCLUIDA' 
  | 'CANCELADA';

export type NaturezaManutencao = 
  | 'PREVENTIVA' 
  | 'CORRETIVA' 
  | 'EMERGENCIAL';

export type TipoOrdemServico = 
  | 'INTERNA' 
  | 'EXTERNA';

export interface Viatura {
  id: string;
  contrato_id: string;
  prefixo_frota: string;
  placa: string;
  chassi?: string | null;
  renavam?: string | null;
  tipo_veiculo: TipoVeiculo;
  marca: string;
  modelo: string;
  ano_fabricacao?: number | null;
  tipo_combustivel: TipoCombustivel;
  odometro_atual_km: number;
  status_operacional: StatusOperacionalViatura;
  vencimento_crlv?: string | null;
  seguradora?: string | null;
  apolice_seguro?: string | null;
  vencimento_seguro?: string | null;
  validade_garantia_data?: string | null;
  limite_garantia_km?: number | null;
  foto_veiculo_url?: string | null;
  foto_documento_url?: string | null;
  data_ultima_calibracao?: string | null;
  data_ultima_preventiva?: string | null;
  odometro_ultima_preventiva_km?: number | null;
  km_ultima_preventiva?: number | null;
  intervalo_revisao_km?: number | null;
  observacoes?: string | null;
  created_at?: string;
  updated_at?: string;

  // Campos calculados / agregados
  qtd_pneus_criticos_twi?: number;
  status_crlv?: 'CRLV_REGULAR' | 'CRLV_A_VENCER' | 'CRLV_VENCIDO';
  status_seguro?: 'SEGURO_REGULAR' | 'SEGURO_A_VENCER' | 'SEGURO_VENCIDO';
  ultimo_km_litro?: number | null;
  ultimo_abastecimento_discrepante?: boolean;
  dias_desde_calibracao?: number;
  calibracao_vencida?: boolean;
}

export interface OficinaPrestador {
  id: string;
  contrato_id: string;
  razao_social: string;
  nome_fantasia?: string | null;
  cnpj?: string | null;
  especialidades: string[];
  responsavel?: string | null;
  contato_responsavel?: string | null;
  telefone?: string | null;
  telefone_plantao?: string | null;
  contato_emergencia?: string | null;
  email?: string | null;
  endereco?: string | null;
  ativo?: boolean;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ItemChecklistOs {
  id: string;
  descricao: string;
  concluido: boolean;
  observacao?: string;
}

export interface OrdemServicoFrota {
  id: string;
  contrato_id: string;
  numero_os: string;
  viatura_id: string;
  oficina_id?: string | null;
  tipo_os: TipoOrdemServico;
  natureza_manutencao: NaturezaManutencao;
  odometro_km: number;
  descricao_servico: string;
  custo_pecas: number;
  custo_mao_de_obra: number;
  custo_total?: number;
  status: StatusOrdemServico;
  itens_checklist: ItemChecklistOs[];
  romaneio_pdf_url?: string | null;
  responsavel_abertura?: string | null;
  data_abertura: string;
  data_conclusao?: string | null;
  created_at?: string;
  updated_at?: string;

  // Relações em tempo de execução
  viatura?: Viatura;
  oficina?: OficinaPrestador;
}

export interface Abastecimento {
  id: string;
  contrato_id: string;
  viatura_id: string;
  data_hora: string;
  posto: string;
  nome_posto?: string;
  tipo_combustivel: TipoCombustivel | string;
  litros: number;
  valor_litro: number;
  valor_total: number;
  odometro_km: number;
  km_registro?: number;
  condutor_nome: string;
  motorista_nome?: string;
  km_rodados?: number | null;
  km_por_litro?: number | null;
  is_discrepante?: boolean;
  motivo_discrepancia?: string | null;
  comprovante_foto_url?: string | null;
  foto_cupom_url?: string | null;
  
  // Georreferenciamento e Telemetria
  latitude_posto?: number;
  longitude_posto?: number;
  variacao_preco_litro?: number | null;
  percentual_variacao?: number | null;
  houve_calibracao_pneus?: boolean;
  foto_calibracao_url?: string | null;
  created_at?: string;

  // Relação opcional
  viatura?: Viatura;
}

export interface ViaturaTrackingTelemetry {
  id: string;
  viatura_id: string;
  placa: string;
  prefixo: string;
  tipo_veiculo: TipoVeiculo;
  empresa: string;
  velocidade_kmh: number;
  status_movimento: 'ralenti' | 'em_transito' | 'desligado';
  heading_graus: number; // 0 - 360 graus
  latitude: number;
  longitude: number;
  odometro_km: number;
  foto_veiculo_url?: string | null;
  ultima_atualizacao: string;
}

export interface RankingPostoInfo {
  nome_posto: string;
  tipo_combustivel: string;
  preco_medio: number;
  menor_preco: number;
  maior_preco: number;
  total_abastecimentos: number;
  percentual_economia?: number;
  latitude?: number;
  longitude?: number;
}

export interface InspecaoPneu {
  id: string;
  contrato_id: string;
  viatura_id: string;
  data_hora: string;
  posicao_pneu: PosicaoPneu;
  sulco_mm: number;
  pressao_psi: number;
  status_twi: StatusTwi;
  precisa_rodizio: boolean;
  marca_pneu?: string | null;
  dot_pneu?: string | null;
  observacoes?: string | null;
  inspetor_nome: string;
  created_at?: string;
}

export interface FrotaKpisSummary {
  totalViaturas: number;
  disponiveis: number;
  emDeslocamento: number;
  emManutencao: number; // Interna + Externa
  pneusCriticosTwi: number;
  abastecimentosSuspeitos: number;
  crlvAVencerOuVencido: number;
  segurosAVencerOuVencido: number;
}

/**
 * Classifica a medição do pneu segundo a Resolução CONTRAN nº 558/80
 */
export function classificarSulcoTwi(sulcoMm: number): StatusTwi {
  if (sulcoMm <= 1.6) {
    return 'CRITICO_PROIBIDO';
  }
  if (sulcoMm < 3.0) {
    return 'ATENCAO';
  }
  return 'CONFORME';
}
