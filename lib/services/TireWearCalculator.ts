import { 
  StatusTwi, 
  CalculoDesgasteMetrologico, 
  CatalogoPneuReferencia 
} from '@/lib/types/frota';

/**
 * Constantes Normativas e Metrológicas (Resolução CONTRAN nº 558/80)
 */
export const LIMITE_LEGAL_TWI_MM = 1.60;
export const LIMITE_ATENCAO_MM = 3.00;

/**
 * Catálogo padrão offline / fallback homologado
 */
export const CATALOGO_PNEUS_HOMOLOGADOS_PADRAO: CatalogoPneuReferencia[] = [
  {
    id: 'pneu-michelin-ltx',
    marca: 'MICHELIN',
    modelo: 'LTX FORCE',
    medida: '265/65 R17',
    profundidade_original_mm: 9.50,
    pressao_recomendada_psi: 32.0,
    tipo_terreno: 'AT'
  },
  {
    id: 'pneu-pirelli-scorpion',
    marca: 'PIRELLI',
    modelo: 'SCORPION ALL TERRAIN PLUS',
    medida: '265/65 R17',
    profundidade_original_mm: 10.00,
    pressao_recomendada_psi: 32.0,
    tipo_terreno: 'AT'
  },
  {
    id: 'pneu-bridgestone-dueler',
    marca: 'BRIDGESTONE',
    modelo: 'DUELER A/T 693',
    medida: '265/65 R17',
    profundidade_original_mm: 9.00,
    pressao_recomendada_psi: 30.0,
    tipo_terreno: 'AT'
  },
  {
    id: 'pneu-continental-vancontact',
    marca: 'CONTINENTAL',
    modelo: 'VANCONTACT AP',
    medida: '225/75 R16C',
    profundidade_original_mm: 10.50,
    pressao_recomendada_psi: 55.0,
    tipo_terreno: 'HT'
  },
  {
    id: 'pneu-goodyear-duratrac',
    marca: 'GOODYEAR',
    modelo: 'WRANGLER DURATRAC',
    medida: '265/70 R17',
    profundidade_original_mm: 12.00,
    pressao_recomendada_psi: 35.0,
    tipo_terreno: 'RT'
  },
  {
    id: 'pneu-bfgoodrich-km3',
    marca: 'BFGOODRICH',
    modelo: 'MUD-TERRAIN T/A KM3',
    medida: '265/70 R17',
    profundidade_original_mm: 13.50,
    pressao_recomendada_psi: 35.0,
    tipo_terreno: 'MT'
  },
  {
    id: 'pneu-chengshan-maspire-265-65-17',
    marca: 'CHENGSHAN',
    modelo: 'MASPIRE M/T',
    medida: 'LT265/65 R17',
    profundidade_original_mm: 15.20,
    pressao_recomendada_psi: 40.0,
    tipo_terreno: 'MT'
  },
  {
    id: 'pneu-chengshan-maspire-265-70-16',
    marca: 'CHENGSHAN',
    modelo: 'MASPIRE M/T',
    medida: 'LT265/70 R16',
    profundidade_original_mm: 15.20,
    pressao_recomendada_psi: 40.0,
    tipo_terreno: 'MT'
  },
  {
    id: 'pneu-chengshan-maspire-265-75-16',
    marca: 'CHENGSHAN',
    modelo: 'MASPIRE M/T',
    medida: 'LT265/75 R16',
    profundidade_original_mm: 16.30,
    pressao_recomendada_psi: 40.0,
    tipo_terreno: 'MT'
  },
  {
    id: 'pneu-chengshan-maspire-245-75-16',
    marca: 'CHENGSHAN',
    modelo: 'MASPIRE M/T',
    medida: 'LT245/75 R16',
    profundidade_original_mm: 14.80,
    pressao_recomendada_psi: 40.0,
    tipo_terreno: 'MT'
  },
  {
    id: 'pneu-chengshan-maspire-235-75-15',
    marca: 'CHENGSHAN',
    modelo: 'MASPIRE M/T',
    medida: 'LT235/75 R15',
    profundidade_original_mm: 14.50,
    pressao_recomendada_psi: 35.0,
    tipo_terreno: 'MT'
  },
  {
    id: 'pneu-chengshan-maspire-31x10-50-15',
    marca: 'CHENGSHAN',
    modelo: 'MASPIRE M/T',
    medida: '31X10.50 R15LT',
    profundidade_original_mm: 15.50,
    pressao_recomendada_psi: 35.0,
    tipo_terreno: 'MT'
  }
];

export class TireWearCalculator {
  /**
   * 1. Borracha Útil Total (B_util):
   * B_util = S_orig - 1,60 mm
   * Faixa operacional regulamentar até o TWI mandatório.
   */
  static calcularBorrachaUtil(sOrig: number): number {
    if (isNaN(sOrig) || sOrig <= LIMITE_LEGAL_TWI_MM) {
      return 0;
    }
    return Number((sOrig - LIMITE_LEGAL_TWI_MM).toFixed(2));
  }

  /**
   * 2. Desgaste Absoluto Consumido (Delta_desgaste):
   * Delta_desgaste = S_orig - S_aferido
   */
  static calcularDesgasteAbsoluto(sOrig: number, sAferido: number): number {
    if (isNaN(sOrig) || isNaN(sAferido)) return 0;
    const desgaste = sOrig - sAferido;
    return Number(Math.max(0, desgaste).toFixed(2));
  }

  /**
   * 3. Percentual de Vida Útil Restante (% V_util):
   * % V_util = ((S_aferido - 1,60) / (S_orig - 1,60)) * 100
   */
  static calcularPercentualVidaUtil(sOrig: number, sAferido: number): number {
    const bUtil = this.calcularBorrachaUtil(sOrig);
    if (bUtil <= 0) return 0;

    const saldoRestante = sAferido - LIMITE_LEGAL_TWI_MM;
    if (saldoRestante <= 0) return 0;

    const percentual = (saldoRestante / bUtil) * 100;
    return Number(Math.min(100, Math.max(0, percentual)).toFixed(2));
  }

  /**
   * Percentual de Desgaste Consumido
   */
  static calcularPercentualDesgasteConsumido(sOrig: number, sAferido: number): number {
    const vidaUtil = this.calcularPercentualVidaUtil(sOrig, sAferido);
    return Number((100 - vidaUtil).toFixed(2));
  }

  /**
   * Classificação legal CONTRAN 558/80
   */
  static classificarStatusTwi(sAferido: number): StatusTwi {
    if (isNaN(sAferido) || sAferido <= LIMITE_LEGAL_TWI_MM) {
      return 'CRITICO_PROIBIDO';
    }
    if (sAferido < LIMITE_ATENCAO_MM) {
      return 'ATENCAO';
    }
    return 'CONFORME';
  }

  /**
   * 4. Taxa de Desgaste e Projeção de Atingimento do Limite TWI
   */
  static calcularProjecaoTwi(
    sOrig: number,
    sAferido: number,
    kmAtual: number = 0,
    kmRodadosEstimados?: number | null
  ): { taxaDesgasteMmPorKm: number | null; kmProjetadoTwi: number | null } {
    const deltaDesgaste = this.calcularDesgasteAbsoluto(sOrig, sAferido);
    const saldoRestante = Math.max(0, sAferido - LIMITE_LEGAL_TWI_MM);

    // Se já atingiu o TWI, projeção é o odômetro atual
    if (saldoRestante <= 0) {
      return {
        taxaDesgasteMmPorKm: null,
        kmProjetadoTwi: kmAtual
      };
    }

    // Se informou km rodados válidos e houve desgaste real
    if (kmRodadosEstimados && kmRodadosEstimados > 0 && deltaDesgaste > 0) {
      const taxa = deltaDesgaste / kmRodadosEstimados;
      const kmRestantes = saldoRestante / taxa;
      return {
        taxaDesgasteMmPorKm: Number(taxa.toFixed(6)),
        kmProjetadoTwi: Math.round(kmAtual + kmRestantes)
      };
    }

    // Projeção baseada em taxa média empírica do setor (0.15 mm por 1.000 km)
    const taxaPadrao = 0.00015; // 0.15 mm a cada 1.000 km
    const kmRestantesPadrao = saldoRestante / taxaPadrao;
    return {
      taxaDesgasteMmPorKm: taxaPadrao,
      kmProjetadoTwi: Math.round(kmAtual + kmRestantesPadrao)
    };
  }

  /**
   * Demonstrativo Formal da Equação para Auditoria Técnica
   */
  static gerarDemonstrativoEquacao(sOrig: number, sAferido: number, vidaUtil: number): string {
    const sAferidoFmt = Number(sAferido).toFixed(2);
    const sOrigFmt = Number(sOrig).toFixed(2);
    const vidaUtilFmt = Number(vidaUtil).toFixed(2);

    return `Vida Útil = ((S_aferido - 1.60) / (S_orig - 1.60)) × 100 ⟹ (([${sAferidoFmt}] - 1.60) / ([${sOrigFmt}] - 1.60)) × 100 = ${vidaUtilFmt}%`;
  }

  /**
   * Cálculo Metrológico Completo Unificado
   */
  static calcularMetrologiaCompleta(
    sOrig: number,
    sAferido: number,
    kmAtual: number = 0,
    kmRodados?: number | null
  ): CalculoDesgasteMetrologico {
    const bUtilTotal = this.calcularBorrachaUtil(sOrig);
    const deltaDesgaste = this.calcularDesgasteAbsoluto(sOrig, sAferido);
    const percentualVidaUtil = this.calcularPercentualVidaUtil(sOrig, sAferido);
    const percentualDesgasteConsumido = this.calcularPercentualDesgasteConsumido(sOrig, sAferido);
    const saldoBorrachaRestante = Number(Math.max(0, sAferido - LIMITE_LEGAL_TWI_MM).toFixed(2));
    const statusTwi = this.classificarStatusTwi(sAferido);
    const demonstrativoEquacao = this.gerarDemonstrativoEquacao(sOrig, sAferido, percentualVidaUtil);
    const projecao = this.calcularProjecaoTwi(sOrig, sAferido, kmAtual, kmRodados);

    return {
      sOrig: Number(sOrig.toFixed(2)),
      sAferido: Number(sAferido.toFixed(2)),
      bUtilTotal,
      deltaDesgaste,
      percentualDesgasteConsumido,
      saldoBorrachaRestante,
      percentualVidaUtil,
      statusTwi,
      demonstrativoEquacao,
      taxaDesgasteMmPorKm: projecao.taxaDesgasteMmPorKm,
      kmProjetadoTwi: projecao.kmProjetadoTwi
    };
  }
}
