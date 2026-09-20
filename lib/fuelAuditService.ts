import { TipoVeiculo, TipoCombustivel } from './types/frota';

export interface FuelBenchmark {
  mediaKmLitro: number;
  toleranciaPercentual: number; // Ex: 0.20 para 20%
}

export const FUEL_BENCHMARKS: Record<TipoVeiculo, FuelBenchmark> = {
  CAMINHONETE: { mediaKmLitro: 9.5, toleranciaPercentual: 0.20 },
  AMBULANCIA: { mediaKmLitro: 8.0, toleranciaPercentual: 0.20 },
  CAMINHAO_INCENDIO: { mediaKmLitro: 3.2, toleranciaPercentual: 0.25 },
  UTILITARIO: { mediaKmLitro: 11.0, toleranciaPercentual: 0.20 },
  OUTRO: { mediaKmLitro: 8.5, toleranciaPercentual: 0.20 }
};

export interface FuelAuditInput {
  odometroAtualKm: number;
  odometroAnteriorKm?: number | null;
  litros: number;
  tipoVeiculo: TipoVeiculo;
  tipoCombustivel?: TipoCombustivel | string;
}

export interface FuelAuditResult {
  kmRodados: number | null;
  kmPorLitro: number | null;
  isDiscrepante: boolean;
  motivoDiscrepancia: string | null;
  variacaoPercentual: number | null;
  benchmarkKmLitro: number;
}

export class FuelAuditService {
  /**
   * Avalia o consumo de combustível e identifica possíveis anomalias/fraudes.
   */
  public static analyze(input: FuelAuditInput): FuelAuditResult {
    const { odometroAtualKm, odometroAnteriorKm, litros, tipoVeiculo } = input;
    const benchmark = FUEL_BENCHMARKS[tipoVeiculo] || FUEL_BENCHMARKS.OUTRO;

    // 1. Validação de dados de entrada nulos ou inválidos
    if (litros === null || litros === undefined || isNaN(litros) || litros <= 0) {
      return {
        kmRodados: null,
        kmPorLitro: null,
        isDiscrepante: true,
        motivoDiscrepancia: 'Volume de combustível inválido ou zerado.',
        variacaoPercentual: null,
        benchmarkKmLitro: benchmark.mediaKmLitro
      };
    }

    if (odometroAtualKm === null || odometroAtualKm === undefined || isNaN(odometroAtualKm) || odometroAtualKm < 0) {
      return {
        kmRodados: null,
        kmPorLitro: null,
        isDiscrepante: true,
        motivoDiscrepancia: 'Quilometragem informada inválida ou negativa.',
        variacaoPercentual: null,
        benchmarkKmLitro: benchmark.mediaKmLitro
      };
    }

    // 2. Primeiro abastecimento registrado (sem histórico anterior)
    if (odometroAnteriorKm === null || odometroAnteriorKm === undefined || isNaN(odometroAnteriorKm)) {
      return {
        kmRodados: null,
        kmPorLitro: null,
        isDiscrepante: false,
        motivoDiscrepancia: null,
        variacaoPercentual: null,
        benchmarkKmLitro: benchmark.mediaKmLitro
      };
    }

    // 3. Verificação de retrocesso ou estagnação no odômetro
    if (odometroAtualKm <= odometroAnteriorKm) {
      const diferenca = odometroAtualKm - odometroAnteriorKm;
      return {
        kmRodados: diferenca,
        kmPorLitro: null,
        isDiscrepante: true,
        motivoDiscrepancia: `Inconsistência de odômetro: valor atual (${odometroAtualKm} km) menor ou igual ao anterior (${odometroAnteriorKm} km).`,
        variacaoPercentual: null,
        benchmarkKmLitro: benchmark.mediaKmLitro
      };
    }

    // 4. Cálculo regular de autonomia
    const kmRodados = Number((odometroAtualKm - odometroAnteriorKm).toFixed(2));
    const kmPorLitro = Number((kmRodados / litros).toFixed(2));

    // 5. Verificação de limites físicos extremos
    if (kmPorLitro < 1.0) {
      return {
        kmRodados,
        kmPorLitro,
        isDiscrepante: true,
        motivoDiscrepancia: `Consumo crítico anormal: ${kmPorLitro} km/L (abaixo do limiar mínimo físico operacional de 1.0 km/L).`,
        variacaoPercentual: Number((((kmPorLitro - benchmark.mediaKmLitro) / benchmark.mediaKmLitro) * 100).toFixed(1)),
        benchmarkKmLitro: benchmark.mediaKmLitro
      };
    }

    if (kmPorLitro > 30.0) {
      return {
        kmRodados,
        kmPorLitro,
        isDiscrepante: true,
        motivoDiscrepancia: `Consumo irreal de combustível: ${kmPorLitro} km/L (suspeita de salto no odômetro ou abastecimento incompleto).`,
        variacaoPercentual: Number((((kmPorLitro - benchmark.mediaKmLitro) / benchmark.mediaKmLitro) * 100).toFixed(1)),
        benchmarkKmLitro: benchmark.mediaKmLitro
      };
    }

    // 6. Comparativo com Benchmark homologado da categoria
    const variacaoDecimal = (kmPorLitro - benchmark.mediaKmLitro) / benchmark.mediaKmLitro;
    const variacaoPercentual = Number((variacaoDecimal * 100).toFixed(1));

    if (Math.abs(variacaoDecimal) > benchmark.toleranciaPercentual) {
      const direcao = variacaoDecimal > 0 ? 'superior' : 'inferior';
      return {
        kmRodados,
        kmPorLitro,
        isDiscrepante: true,
        motivoDiscrepancia: `Desvio de consumo detectado: variação de ${variacaoPercentual}% (${direcao} à tolerância homologada de ±${benchmark.toleranciaPercentual * 100}% para ${tipoVeiculo}).`,
        variacaoPercentual,
        benchmarkKmLitro: benchmark.mediaKmLitro
      };
    }

    // 7. Abastecimento regular e aprovado
    return {
      kmRodados,
      kmPorLitro,
      isDiscrepante: false,
      motivoDiscrepancia: null,
      variacaoPercentual,
      benchmarkKmLitro: benchmark.mediaKmLitro
    };
  }
}
