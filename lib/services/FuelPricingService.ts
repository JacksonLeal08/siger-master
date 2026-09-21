import { Abastecimento, RankingPostoInfo } from '../types/frota';

export interface VariacaoPrecoResult {
  valorAtual: number;
  valorAnterior: number | null;
  deltaValor: number;
  percentualVariacao: number;
  tendencia: 'ALTA' | 'BAIXA' | 'ESTAVEL';
}

export interface StatusCalibracaoResult {
  bloqueioObrigatorio: boolean;
  diasDesdeCalibracao: number;
  dataUltimaCalibracao: string | null;
  mensagem: string;
}

export class FuelPricingService {
  /**
   * Calcula o Delta de Preço (R$) e Percentual (%) em relação ao último abastecimento
   */
  static calcularVariacaoPreco(
    valorAtual: number,
    valorAnterior: number | null | undefined
  ): VariacaoPrecoResult {
    const atual = Number(valorAtual) || 0;

    if (!valorAnterior || valorAnterior <= 0) {
      return {
        valorAtual: atual,
        valorAnterior: null,
        deltaValor: 0,
        percentualVariacao: 0,
        tendencia: 'ESTAVEL'
      };
    }

    const anterior = Number(valorAnterior);
    const delta = Number((atual - anterior).toFixed(3));
    const percentual = Number((((atual - anterior) / anterior) * 100).toFixed(2));

    let tendencia: 'ALTA' | 'BAIXA' | 'ESTAVEL' = 'ESTAVEL';
    if (delta > 0.005) {
      tendencia = 'ALTA';
    } else if (delta < -0.005) {
      tendencia = 'BAIXA';
    }

    return {
      valorAtual: atual,
      valorAnterior: anterior,
      deltaValor: delta,
      percentualVariacao: percentual,
      tendencia
    };
  }

  /**
   * Identifica e classifica o ranking dos postos mais econômicos dos últimos 30 dias
   */
  static getPostoMaisEconomico(
    abastecimentos: Abastecimento[],
    tipoCombustivel?: string,
    diasHistorico: number = 30
  ): { ranking: RankingPostoInfo[]; postoMaisEconomico: RankingPostoInfo | null } {
    if (!abastecimentos || abastecimentos.length === 0) {
      return { ranking: [], postoMaisEconomico: null };
    }

    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - diasHistorico);

    // Filtra pelo combustível e janela de dias
    let filtrados = abastecimentos.filter((a) => {
      const dataAbast = new Date(a.data_hora);
      const dataValida = !isNaN(dataAbast.getTime()) ? dataAbast >= dataLimite : true;
      const combValido = !tipoCombustivel || a.tipo_combustivel === tipoCombustivel;
      return dataValida && combValido && Number(a.valor_litro) > 0;
    });

    // Se não houver dados nos últimos 30 dias, usa o histórico total disponível do mesmo combustível
    if (filtrados.length === 0 && tipoCombustivel) {
      filtrados = abastecimentos.filter(
        (a) => a.tipo_combustivel === tipoCombustivel && Number(a.valor_litro) > 0
      );
    }

    if (filtrados.length === 0) {
      return { ranking: [], postoMaisEconomico: null };
    }

    // Agrupa por Posto
    const mapPostos: Record<
      string,
      {
        nome: string;
        tipoCombustivel: string;
        precos: number[];
        latitude?: number;
        longitude?: number;
      }
    > = {};

    filtrados.forEach((a) => {
      const nome = (a.nome_posto || a.posto || 'Posto Não Identificado').trim();
      if (!mapPostos[nome]) {
        mapPostos[nome] = {
          nome,
          tipoCombustivel: String(a.tipo_combustivel || 'DIESEL_S10'),
          precos: [],
          latitude: a.latitude_posto,
          longitude: a.longitude_posto
        };
      }
      mapPostos[nome].precos.push(Number(a.valor_litro));
      if (a.latitude_posto && a.longitude_posto) {
        mapPostos[nome].latitude = a.latitude_posto;
        mapPostos[nome].longitude = a.longitude_posto;
      }
    });

    // Encontra maior preço global para cálculo de economia
    let maiorPrecoGlobal = 0;
    Object.values(mapPostos).forEach((p) => {
      const maxP = Math.max(...p.precos);
      if (maxP > maiorPrecoGlobal) maiorPrecoGlobal = maxP;
    });

    const ranking: RankingPostoInfo[] = Object.values(mapPostos).map((p) => {
      const menor = Math.min(...p.precos);
      const maior = Math.max(...p.precos);
      const soma = p.precos.reduce((acc, v) => acc + v, 0);
      const precoMedio = Number((soma / p.precos.length).toFixed(3));

      let percentualEconomia = 0;
      if (maiorPrecoGlobal > 0 && precoMedio < maiorPrecoGlobal) {
        percentualEconomia = Number(
          (((maiorPrecoGlobal - precoMedio) / maiorPrecoGlobal) * 100).toFixed(1)
        );
      }

      return {
        nome_posto: p.nome,
        tipo_combustivel: p.tipoCombustivel,
        preco_medio: precoMedio,
        menor_preco: menor,
        maior_preco: maior,
        total_abastecimentos: p.precos.length,
        percentual_economia: percentualEconomia,
        latitude: p.latitude,
        longitude: p.longitude
      };
    });

    // Ordena do menor preço médio para o maior
    ranking.sort((a, b) => a.preco_medio - b.preco_medio);

    return {
      ranking,
      postoMaisEconomico: ranking.length > 0 ? ranking[0] : null
    };
  }

  /**
   * Valida a trava de 15 dias sem calibração de pneus
   */
  static validarCalibracaoPneus(
    dataUltimaCalibracao: string | null | undefined,
    diasLimite: number = 15
  ): StatusCalibracaoResult {
    if (!dataUltimaCalibracao) {
      return {
        bloqueioObrigatorio: true,
        diasDesdeCalibracao: 999,
        dataUltimaCalibracao: null,
        mensagem:
          'ALERTA CRÍTICO: Nenhum registro prévio de calibração encontrado para este veículo. É obrigatório calibrar e anexar a foto do manômetro.'
      };
    }

    const dataCalib = new Date(dataUltimaCalibracao);
    if (isNaN(dataCalib.getTime())) {
      return {
        bloqueioObrigatorio: true,
        diasDesdeCalibracao: 999,
        dataUltimaCalibracao: null,
        mensagem: 'ALERTA CRÍTICO: Data de calibração inválida no sistema. É obrigatório calibrar agora.'
      };
    }

    const hoje = new Date();
    const diffMs = hoje.getTime() - dataCalib.getTime();
    const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDias > diasLimite) {
      return {
        bloqueioObrigatorio: true,
        diasDesdeCalibracao: diffDias,
        dataUltimaCalibracao,
        mensagem: `BLOQUEIO DE SEGURANÇA: Viatura está há ${diffDias} dias sem calibragem (limite: ${diasLimite} dias). Calibre os pneus e envie a foto do calibrador para liberar o abastecimento.`
      };
    }

    return {
      bloqueioObrigatorio: false,
      diasDesdeCalibracao: Math.max(0, diffDias),
      dataUltimaCalibracao,
      mensagem: `Pneus em conformidade. Última calibragem realizada há ${diffDias} dias.`
    };
  }
}
