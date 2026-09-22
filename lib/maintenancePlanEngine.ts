import { TipoVeiculo } from './types/frota';

export interface MaintenanceItemRule {
  id: string;
  nome: string;
  intervaloKm: number;
  intervaloMeses: number;
  criticidade: 'ALTA' | 'MEDIA' | 'BAIXA';
}

export interface ManufacturerRevisionItem {
  componente: string;
  acao: 'SUBSTITUIR' | 'INSPECIONAR' | 'LUBRIFICAR';
  codigoReferencia?: string;
  categoria: 'FLUIDOS' | 'FILTROS' | 'FREIOS' | 'SUSPENSAO' | 'MOTOR' | 'TRANSMISSAO';
}

export interface ManufacturerCyclePlan {
  cicloKm: number;
  mesesEstimados: number;
  titulo: string;
  descricao: string;
  itens: ManufacturerRevisionItem[];
}

export interface ManufacturerModelSpec {
  chave: string;
  marca: string;
  modeloPadrao: string;
  motorizacao: string;
  padraoCrlvExemplos: string[];
  ciclos: ManufacturerCyclePlan[];
}

// Catálogo Oficial dos Planos de Preventiva dos Fabricantes
export const MANUFACTURER_PLANS: Record<string, ManufacturerModelSpec> = {
  TOYOTA_HILUX_2_8_DIESEL: {
    chave: 'TOYOTA_HILUX_2_8_DIESEL',
    marca: 'TOYOTA',
    modeloPadrao: 'HILUX CD 4X4 2.8 TURBO DIESEL',
    motorizacao: '2.8 1GD-FTV 16V DOHC D-4D',
    padraoCrlvExemplos: ['I/TOYOTA HILUX CD 4X4', 'TOYOTA/HILUX CD 4X4 SRX', 'TOYOTA/HILUX CHASSI 4X4'],
    ciclos: [
      {
        cicloKm: 10000,
        mesesEstimados: 12,
        titulo: 'Revisão 10.000 km (Ciclo Básico I)',
        descricao: 'Troca de lubrificantes primários e inspeções essenciais de suspensão e freios.',
        itens: [
          { componente: 'Óleo de Motor Toyota Genuine 5W-30 Premium Fuel Economy (7.5L)', acao: 'SUBSTITUIR', categoria: 'FLUIDOS', codigoReferencia: '08880-83389' },
          { componente: 'Filtro de Óleo do Motor (Elemento Refil com O-Ring)', acao: 'SUBSTITUIR', categoria: 'FILTROS', codigoReferencia: '04152-YZZA6' },
          { componente: 'Arruela de Vedação do Bujão do Carter', acao: 'SUBSTITUIR', categoria: 'MOTOR', codigoReferencia: '90430-12031' },
          { componente: 'Pastilhas e Discos de Freio Dianteiro', acao: 'INSPECIONAR', categoria: 'FREIOS' },
          { componente: 'Articulações e Cruzetas do Cardã 4x4 (Graxa NLGI-2)', acao: 'LUBRIFICAR', categoria: 'TRANSMISSAO' }
        ]
      },
      {
        cicloKm: 20000,
        mesesEstimados: 24,
        titulo: 'Revisão 20.000 km (Ciclo Intermediário II)',
        descricao: 'Substituição completa de filtros de aspiração e linha de combustível diesel.',
        itens: [
          { componente: 'Óleo de Motor Toyota Genuine 5W-30 Premium Fuel Economy (7.5L)', acao: 'SUBSTITUIR', categoria: 'FLUIDOS', codigoReferencia: '08880-83389' },
          { componente: 'Filtro de Óleo do Motor', acao: 'SUBSTITUIR', categoria: 'FILTROS', codigoReferencia: '04152-YZZA6' },
          { componente: 'Filtro de Combustível Principal / Sedimentador Diesel', acao: 'SUBSTITUIR', categoria: 'FILTROS', codigoReferencia: '23390-0L070' },
          { componente: 'Filtro de Ar da Cabine / Ar-Condicionado', acao: 'SUBSTITUIR', categoria: 'FILTROS', codigoReferencia: '87139-0K060' },
          { componente: 'Filtro de Ar do Motor (Aspiração Turbo)', acao: 'INSPECIONAR', categoria: 'FILTROS', codigoReferencia: '17801-0L040' },
          { componente: 'Geometria de Direção, Alinhamento e Balanceamento 4 Rodas', acao: 'INSPECIONAR', categoria: 'SUSPENSAO' }
        ]
      },
      {
        cicloKm: 40000,
        mesesEstimados: 48,
        titulo: 'Revisão 40.000 km (Ciclo Maior III)',
        descricao: 'Troca de todos os fluidos hidráulicos, diferencial e arrefecimento.',
        itens: [
          { componente: 'Óleo de Motor Toyota Genuine 5W-30 (7.5L)', acao: 'SUBSTITUIR', categoria: 'FLUIDOS' },
          { componente: 'Filtro de Óleo, Filtro de Combustível e Filtro de Ar do Motor', acao: 'SUBSTITUIR', categoria: 'FILTROS' },
          { componente: 'Fluido de Freio e Embreagem Hidráulica DOT 4', acao: 'SUBSTITUIR', categoria: 'FLUIDOS', codigoReferencia: '08823-80004' },
          { componente: 'Óleo do Diferencial Dianteiro e Traseiro (Hypoid Gear Oil 75W-85 GL-5)', acao: 'SUBSTITUIR', categoria: 'TRANSMISSAO' },
          { componente: 'Óleo da Caixa de Transferência 4x4 75W', acao: 'SUBSTITUIR', categoria: 'TRANSMISSAO' },
          { componente: 'Lonas e Tambores de Freio Traseiro (Desmontagem e Limpeza)', acao: 'INSPECIONAR', categoria: 'FREIOS' }
        ]
      },
      {
        cicloKm: 100000,
        mesesEstimados: 120,
        titulo: 'Revisão 100.000 km (Ciclo Máximo Master)',
        descricao: 'Substituição de correias de comando/acessórios, fluido de arrefecimento longo ciclo e tensores.',
        itens: [
          { componente: 'Kit Correia Auxiliar/Alternador com Tensores e Polias', acao: 'SUBSTITUIR', categoria: 'MOTOR' },
          { componente: 'Líquido de Arrefecimento Super Long Life Coolant (SLLC)', acao: 'SUBSTITUIR', categoria: 'FLUIDOS' },
          { componente: 'Todos os Filtros (Óleo, Ar, Combustível e Cabine)', acao: 'SUBSTITUIR', categoria: 'FILTROS' },
          { componente: 'Óleos de Câmbio, Diferenciais e Transferência 4x4', acao: 'SUBSTITUIR', categoria: 'TRANSMISSAO' },
          { componente: 'Amortecedores, Buchas e Bieletas de Suspensão', acao: 'INSPECIONAR', categoria: 'SUSPENSAO' }
        ]
      }
    ]
  },

  MB_SPRINTER_416_CDI: {
    chave: 'MB_SPRINTER_416_CDI',
    marca: 'MERCEDES-BENZ',
    modeloPadrao: 'SPRINTER 416 CDI AMBULÂNCIA / VAN',
    motorizacao: 'OM 651 DE 22 LA 2.2 Turbo Diesel',
    padraoCrlvExemplos: ['M.BENZ/SPRINTER 416CDI AMB', 'M.BENZ/SPRINTER 416CDI V', 'M.BENZ/SPRINTER 516CDI'],
    ciclos: [
      {
        cicloKm: 10000,
        mesesEstimados: 12,
        titulo: 'Revisão 10.000 km (Service A - Sprinter)',
        descricao: 'Troca de lubrificante sintético padrão MB 229.51 / 229.52.',
        itens: [
          { componente: 'Óleo Motor Sintético Homologado MB 229.51/229.52 5W-30 (11.5L)', acao: 'SUBSTITUIR', categoria: 'FLUIDOS' },
          { componente: 'Filtro de Óleo do Motor OM651 com Anéis de Vedação', acao: 'SUBSTITUIR', categoria: 'FILTROS', codigoReferencia: 'A6511800109' },
          { componente: 'Filtro de Poeira / Cabine do Climatizador', acao: 'SUBSTITUIR', categoria: 'FILTROS', codigoReferencia: 'A9068300318' },
          { componente: 'Desgaste das Pastilhas de Freio com Sensores Elétricos', acao: 'INSPECIONAR', categoria: 'FREIOS' }
        ]
      },
      {
        cicloKm: 20000,
        mesesEstimados: 24,
        titulo: 'Revisão 20.000 km (Service B - Sprinter)',
        descricao: 'Substituição completa de filtros de combustível com separador de água.',
        itens: [
          { componente: 'Óleo Motor Homologado MB 229.52 5W-30 (11.5L)', acao: 'SUBSTITUIR', categoria: 'FLUIDOS' },
          { componente: 'Filtro de Óleo e Filtro de Ar do Motor', acao: 'SUBSTITUIR', categoria: 'FILTROS' },
          { componente: 'Filtro de Combustível com Sensor de Água e Aquecedor Integrado', acao: 'SUBSTITUIR', categoria: 'FILTROS', codigoReferencia: 'A6510902952' },
          { componente: 'Fluido de Freio DOT 4 Plus de Alta Temperatura', acao: 'SUBSTITUIR', categoria: 'FLUIDOS' },
          { componente: 'Varredura Computadorizada de Módulos (Star Diagnosis / Xentry)', acao: 'INSPECIONAR', categoria: 'MOTOR' }
        ]
      }
    ]
  },

  FORD_RANGER_DIESEL: {
    chave: 'FORD_RANGER_DIESEL',
    marca: 'FORD',
    modeloPadrao: 'RANGER XLS/XLT 4X4 DIESEL',
    motorizacao: 'Duratorq 2.2 / 3.2 TDCi ou 2.0 Panther',
    padraoCrlvExemplos: ['FORD/RANGER XLSCD4 22C', 'FORD/RANGER XL 2.2 4X4', 'FORD/RANGER LIMITED 3.2'],
    ciclos: [
      {
        cicloKm: 10000,
        mesesEstimados: 12,
        titulo: 'Revisão 10.000 km (Plano Ford Protect)',
        descricao: 'Óleo sintético Motorcraft e filtro original.',
        itens: [
          { componente: 'Óleo Motorcraft 5W-30 100% Sintético WSS-M2C913-D (8.6L)', acao: 'SUBSTITUIR', categoria: 'FLUIDOS' },
          { componente: 'Filtro de Óleo do Motor Motorcraft', acao: 'SUBSTITUIR', categoria: 'FILTROS' },
          { componente: 'Drenagem de Água do Sedimentador de Combustível', acao: 'INSPECIONAR', categoria: 'FILTROS' }
        ]
      },
      {
        cicloKm: 20000,
        mesesEstimados: 24,
        titulo: 'Revisão 20.000 km (Filtro Duplo Ford)',
        descricao: 'Troca de elemento filtrante de combustível duplo.',
        itens: [
          { componente: 'Óleo Motorcraft 5W-30 100% Sintético (8.6L)', acao: 'SUBSTITUIR', categoria: 'FLUIDOS' },
          { componente: 'Filtro de Combustível Duplo (Elemento e Carcaça)', acao: 'SUBSTITUIR', categoria: 'FILTROS' },
          { componente: 'Filtro de Pólen / Ar Condicionado', acao: 'SUBSTITUIR', categoria: 'FILTROS' }
        ]
      }
    ]
  },

  GENERIC_HEAVY_TRUCK: {
    chave: 'GENERIC_HEAVY_TRUCK',
    marca: 'CAMINHÕES E PESADOS',
    modeloPadrao: 'CAMINHÃO COMBATE A INCÊNDIO / AUTO BOMBA TANQUE (ABT)',
    motorizacao: 'Diesel Pesado Euro 5 / Euro 6',
    padraoCrlvExemplos: ['VOLVO/VM 330', 'SCANIA/P360', 'M.BENZ/ATEGO 1729', 'VW/CONSTELLATION 24.280'],
    ciclos: [
      {
        cicloKm: 10000,
        mesesEstimados: 6,
        titulo: 'Revisão Operacional de Prontidão Tática (10.000 km / 250 Horas)',
        descricao: 'Manutenção rigorosa de bomba de incêndio, tomada de força (PTO) e lubrificação pesada.',
        itens: [
          { componente: 'Óleo de Motor Diesel Pesado 15W-40 CI-4 / CJ-4 (24L a 32L)', acao: 'SUBSTITUIR', categoria: 'FLUIDOS' },
          { componente: 'Filtro de Óleo do Motor (Duplo) e Filtro Separador Racor', acao: 'SUBSTITUIR', categoria: 'FILTROS' },
          { componente: 'Óleo da Tomada de Força (PTO) e Redutor da Bomba de Incêndio', acao: 'INSPECIONAR', categoria: 'TRANSMISSAO' },
          { componente: 'Engraxamento Geral de Pinos de Mola, Cruzetas e Manga de Eixo', acao: 'LUBRIFICAR', categoria: 'SUSPENSAO' },
          { componente: 'Secador de Ar do Sistema de Freio Pneumático (Válvula APU)', acao: 'INSPECIONAR', categoria: 'FREIOS' }
        ]
      }
    ]
  }
};

export const DEFAULT_MAINTENANCE_RULES: MaintenanceItemRule[] = [
  {
    id: 'oleo_filtros',
    nome: 'Troca de Óleo do Motor e Filtros (Óleo/Combustível)',
    intervaloKm: 10000,
    intervaloMeses: 6,
    criticidade: 'ALTA'
  },
  {
    id: 'sistema_freios',
    nome: 'Inspeção e Troca de Pastilhas / Fluido de Freio',
    intervaloKm: 15000,
    intervaloMeses: 12,
    criticidade: 'ALTA'
  },
  {
    id: 'arrefecimento_correias',
    nome: 'Correias Auxiliares e Fluido de Arrefecimento',
    intervaloKm: 40000,
    intervaloMeses: 24,
    criticidade: 'MEDIA'
  },
  {
    id: 'suspensao_geometria',
    nome: 'Alinhamento, Balanceamento e Suspensão Operacional',
    intervaloKm: 10000,
    intervaloMeses: 6,
    criticidade: 'MEDIA'
  }
];

export interface MaintenanceAlert {
  regraId: string;
  nome: string;
  criticidade: 'ALTA' | 'MEDIA' | 'BAIXA';
  status: 'CONFORME' | 'ALERTA_PROXIMO' | 'VENCIDO';
  restanteKm: number;
  restanteDias: number;
  mensagem: string;
}

export class MaintenancePlanEngine {
  private static ANTECEDENCIA_KM = 1000; // Alerta 1.000 km antes
  private static ANTECEDENCIA_DIAS = 15; // Alerta 15 dias antes

  /**
   * Normaliza e correlaciona a descrição oficial do CRLV com o catálogo de motores e planos do fabricante.
   */
  public static normalizeCrlvModel(crlvText: string): {
    modeloChave: string;
    marca: string;
    modeloPadrao: string;
    motorizacao: string;
    planoEncontrado: boolean;
    spec?: ManufacturerModelSpec;
  } {
    if (!crlvText || !crlvText.trim()) {
      return {
        modeloChave: 'GENERIC_VEHICLE',
        marca: 'DIVERSOS',
        modeloPadrao: 'VEÍCULO PADRÃO DA FROTA',
        motorizacao: 'Padrão',
        planoEncontrado: false
      };
    }

    const clean = crlvText.toUpperCase().trim();

    if (clean.includes('HILUX')) {
      const spec = MANUFACTURER_PLANS.TOYOTA_HILUX_2_8_DIESEL;
      return {
        modeloChave: spec.chave,
        marca: spec.marca,
        modeloPadrao: spec.modeloPadrao,
        motorizacao: spec.motorizacao,
        planoEncontrado: true,
        spec
      };
    }

    if (clean.includes('SPRINTER')) {
      const spec = MANUFACTURER_PLANS.MB_SPRINTER_416_CDI;
      return {
        modeloChave: spec.chave,
        marca: spec.marca,
        modeloPadrao: spec.modeloPadrao,
        motorizacao: spec.motorizacao,
        planoEncontrado: true,
        spec
      };
    }

    if (clean.includes('RANGER')) {
      const spec = MANUFACTURER_PLANS.FORD_RANGER_DIESEL;
      return {
        modeloChave: spec.chave,
        marca: spec.marca,
        modeloPadrao: spec.modeloPadrao,
        motorizacao: spec.motorizacao,
        planoEncontrado: true,
        spec
      };
    }

    if (
      clean.includes('CAMINHAO') ||
      clean.includes('CAMINHÃO') ||
      clean.includes('VOLVO') ||
      clean.includes('SCANIA') ||
      clean.includes('ATEGO') ||
      clean.includes('CONSTELLATION') ||
      clean.includes('ABT')
    ) {
      const spec = MANUFACTURER_PLANS.GENERIC_HEAVY_TRUCK;
      return {
        modeloChave: spec.chave,
        marca: spec.marca,
        modeloPadrao: spec.modeloPadrao,
        motorizacao: spec.motorizacao,
        planoEncontrado: true,
        spec
      };
    }

    return {
      modeloChave: 'GENERIC_VEHICLE',
      marca: clean.split('/')[0] || 'GERAL',
      modeloPadrao: clean.split('/')[1] || clean,
      motorizacao: 'Sob Consulta',
      planoEncontrado: false
    };
  }

  /**
   * Identifica o próximo marco de revisão do fabricante para a viatura com base no odômetro atual.
   */
  public static getProximoCicloFabricante(
    modeloChave: string,
    odometroAtualKm: number
  ): {
    cicloAlvoKm: number;
    restanteKm: number;
    titulo: string;
    descricao: string;
    itens: ManufacturerRevisionItem[];
  } | null {
    const spec = MANUFACTURER_PLANS[modeloChave];
    if (!spec || spec.ciclos.length === 0) return null;

    // Localiza o próximo marco
    const cicloAlvo = spec.ciclos.find((c) => c.cicloKm > odometroAtualKm) || spec.ciclos[spec.ciclos.length - 1];
    const restanteKm = Math.max(0, cicloAlvo.cicloKm - odometroAtualKm);

    return {
      cicloAlvoKm: cicloAlvo.cicloKm,
      restanteKm,
      titulo: cicloAlvo.titulo,
      descricao: cicloAlvo.descricao,
      itens: cicloAlvo.itens
    };
  }

  public static evaluateVehicle(
    odometroAtualKm: number,
    historicoServicos: Array<{ regraId: string; dataServico: string; odometroKm: number }> = [],
    rules: MaintenanceItemRule[] = DEFAULT_MAINTENANCE_RULES,
    baseKmManual?: number | null,
    baseDataManual?: string | null
  ): MaintenanceAlert[] {
    const hoje = new Date();

    return rules.map((regra) => {
      const servicosRegra = historicoServicos
        .filter((s) => s.regraId === regra.id)
        .sort((a, b) => new Date(b.dataServico).getTime() - new Date(a.dataServico).getTime());

      const ultimoServico = servicosRegra[0];
      const baseKm = ultimoServico 
        ? Number(ultimoServico.odometroKm) 
        : (baseKmManual !== undefined && baseKmManual !== null && !isNaN(Number(baseKmManual)) 
            ? Number(baseKmManual) 
            : 0);

      const baseData = ultimoServico 
        ? new Date(ultimoServico.dataServico) 
        : (baseDataManual && !isNaN(new Date(baseDataManual).getTime()) 
            ? new Date(baseDataManual) 
            : new Date(hoje.getFullYear() - 1, hoje.getMonth(), hoje.getDate()));

      const proximoKm = baseKm + regra.intervaloKm;
      const restanteKm = Math.round(proximoKm - odometroAtualKm);

      const proximaData = new Date(baseData);
      proximaData.setMonth(proximaData.getMonth() + regra.intervaloMeses);
      const diffMs = proximaData.getTime() - hoje.getTime();
      const restanteDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      let status: 'CONFORME' | 'ALERTA_PROXIMO' | 'VENCIDO' = 'CONFORME';
      let mensagem = `Próxima revisão em ${restanteKm} km ou ${restanteDias} dias.`;

      if (restanteKm <= 0 || restanteDias <= 0) {
        status = 'VENCIDO';
        mensagem = `Revisão vencida! Excedeu por ${Math.abs(restanteKm)} km ou ${Math.abs(restanteDias)} dias.`;
      } else if (restanteKm <= this.ANTECEDENCIA_KM || restanteDias <= this.ANTECEDENCIA_DIAS) {
        status = 'ALERTA_PROXIMO';
        mensagem = `Agendamento preventivo recomendado: restam apenas ${restanteKm} km ou ${restanteDias} dias.`;
      }

      return {
        regraId: regra.id,
        nome: regra.nome,
        criticidade: regra.criticidade,
        status,
        restanteKm,
        restanteDias,
        mensagem
      };
    });
  }
}
