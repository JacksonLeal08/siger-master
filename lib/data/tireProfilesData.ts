import { TipoTerrenoPneu } from '@/lib/types/frota';

export interface TireProfileDetail {
  tipo: TipoTerrenoPneu;
  sigla: string;
  nomeCompleto: string;
  subtitulo: string;
  destaqueBadge?: string;
  corTema: 'blue' | 'emerald' | 'amber' | 'red';
  porcentagemAsfalto: number;
  porcentagemOffroad: number;
  labelOffroad: string;
  resumoTecnico: string;
  advertencia?: string;
  aplicacaoSiger: string;
  dadosMecanicos: {
    ruidoCabineDb: number;
    classificacaoRuido: string;
    resistenciaRolamento: string;
    impactoConsumoDiesel: string;
    aderenciaAsfaltoSeco: string;
    aderenciaPisoMolhado: string;
    tracaoTerrenoSevero: string;
  };
  diretrizesCalibragemPsi: {
    rodoviariaPadrao: number;
    cargaMaxima: number;
    emergencialOffroad: number;
    notaCalibragem: string;
  };
  viaturasRecomendadas: string[];
  frentesTrabalho: string[];
}

export const TIRE_PROFILES_DATA: Record<TipoTerrenoPneu, TireProfileDetail> = {
  HT: {
    tipo: 'HT',
    sigla: 'H/T',
    nomeCompleto: 'HIGHWAY TERRAIN',
    subtitulo: 'Foco em Asfalto, Silêncio & Baixo Consumo',
    destaqueBadge: 'MÁXIMA EFICIÊNCIA ENERGÉTICA',
    corTema: 'blue',
    porcentagemAsfalto: 80,
    porcentagemOffroad: 20,
    labelOffroad: 'Terra Leve',
    resumoTecnico:
      'Projetados prioritariamente para rodovias pavimentadas e malha urbana. Oferecem menor resistência ao rolamento, maior economia de combustível, excelente frenagem em piso molhado e conforto de marcha sem zumbidos na cabine.',
    aplicacaoSiger:
      'Viaturas administrativas, transporte de pessoal e ambulâncias de rodovia.',
    dadosMecanicos: {
      ruidoCabineDb: 68,
      classificacaoRuido: 'Silencioso (Alta Atenuação Acústica)',
      resistenciaRolamento: 'Classe B (Baixa Resistência / Alta Eficiência)',
      impactoConsumoDiesel: 'Base Referencial de Consumo (Menor Custo/km)',
      aderenciaAsfaltoSeco: 'Excelente (Nota A - Tração Contínua)',
      aderenciaPisoMolhado: 'Máxima Ejeção de Água (Risco Mínimo de Aquaplanagem)',
      tracaoTerrenoSevero: 'Limitada a terra batida seca. Risco de patinagem em barro úmido.'
    },
    diretrizesCalibragemPsi: {
      rodoviariaPadrao: 32,
      cargaMaxima: 36,
      emergencialOffroad: 28,
      notaCalibragem:
        'Não descalibrar abaixo de 28 PSI. Desenho sem sulcos autolimpantes para lama profunda.'
    },
    viaturasRecomendadas: [
      'Ambulâncias de Rodovia (Suporte Básico e Avançado)',
      'Veículos Administrativos de Transporte de Diretoria',
      'Vans e Micro-ônibus de Transporte de Brigadistas'
    ],
    frentesTrabalho: [
      'Rodovias Pavimentadas e Anéis Viários',
      'Áreas Industriais com Pavimento Asfáltico ou Concreto',
      'Deslocamentos Intermunicipais Contínuos'
    ]
  },

  AT: {
    tipo: 'AT',
    sigla: 'A/T',
    nomeCompleto: 'ALL-TERRAIN',
    subtitulo: 'O Modelo Coringa para Uso Misto Operacional',
    destaqueBadge: 'PADRÃO RECOMENDADO DA FROTA',
    corTema: 'emerald',
    porcentagemAsfalto: 50,
    porcentagemOffroad: 50,
    labelOffroad: 'Terra / Misto',
    resumoTecnico:
      'Banda reforçada com blocos espaçados e sulcos profundos. Resistente a lacerações, cortes por pedras e furos. Mantém dirigibilidade segura no asfalto com tração eficiente em terra batida, cascalho e lama leve.',
    aplicacaoSiger:
      'Caminhonetes 4x4 de ronda perimetral, patrulha de mina e ambulâncias industriais.',
    dadosMecanicos: {
      ruidoCabineDb: 72,
      classificacaoRuido: 'Moderado (Conforto Adequado em Velocidade de Cruzeiro)',
      resistenciaRolamento: 'Classe C (Impacto Equilibrado no Consumo)',
      impactoConsumoDiesel: '+3% a +5% comparado ao H/T',
      aderenciaAsfaltoSeco: 'Muito Boa (Frenagem Estável)',
      aderenciaPisoMolhado: 'Boa (Sulcos Longitudinais com Dispersores de Água)',
      tracaoTerrenoSevero: 'Alta Eficiência em Cascalho, Saibro e Terra Molhada.'
    },
    diretrizesCalibragemPsi: {
      rodoviariaPadrao: 35,
      cargaMaxima: 40,
      emergencialOffroad: 24,
      notaCalibragem:
        'Em trechos de areia ou lama escorregadia, o alívio para 24 PSI aumenta a área de contato em 35%.'
    },
    viaturasRecomendadas: [
      'Caminhonetes 4x4 de Ronda Perimetral e Fiscalização',
      'Viaturas de Apoio Rápido e Supervisão de Mina',
      'Ambulâncias Industriais de Plantão em Planta Química/Mineração'
    ],
    frentesTrabalho: [
      'Acessos Vicinais Não Pavimentados',
      'Canteiros de Obras e Vias de Terra Compactada',
      'Transição Contínua entre Rodovia e Frentes de Campo'
    ]
  },

  RT: {
    tipo: 'RT',
    sigla: 'R/T',
    nomeCompleto: 'RUGGED TERRAIN',
    subtitulo: 'Robustez de M/T com Dirigibilidade de A/T',
    destaqueBadge: 'TERRENO SEVERO & ROCHA',
    corTema: 'amber',
    porcentagemAsfalto: 35,
    porcentagemOffroad: 65,
    labelOffroad: 'Terreno Severo / Pedregoso',
    resumoTecnico:
      'Combina a carcaça de 3 lonas reforçadas dos pneus de lama com sulcos angulados que minimizam a ressonância no pavimento. Desenho agressivo nas laterais para autolimpeza de pedras e prevenção de rasgos.',
    aplicacaoSiger:
      'Viaturas de intervenção rápida que operam em frentes de lavra e acessos rochosos.',
    dadosMecanicos: {
      ruidoCabineDb: 76,
      classificacaoRuido: 'Perceptível (Zumbido Acústico em Pavimento Rápido)',
      resistenciaRolamento: 'Classe E (Maior Atrito de Banda)',
      impactoConsumoDiesel: '+6% a +9% comparado ao H/T',
      aderenciaAsfaltoSeco: 'Boa (Exige Maior Distância de Frenagem)',
      aderenciaPisoMolhado: 'Moderada (Atenção redobrada em curvas de alta velocidade)',
      tracaoTerrenoSevero: 'Excelente em Pedreiras, Matacões e Acessos com Cascalho Pontiagudo.'
    },
    diretrizesCalibragemPsi: {
      rodoviariaPadrao: 38,
      cargaMaxima: 45,
      emergencialOffroad: 20,
      notaCalibragem:
        'A carcaça tripla suporta 20 PSI em terrenos rochosos pontiagudos sem destalonar.'
    },
    viaturasRecomendadas: [
      'Caminhonetes de Intervenção Rápida em Cavas de Mineração',
      'Viaturas de Resgate Técnico em Terrenos Escarpados',
      'Veículos de Engenharia Geotécnica e Sondagem de Campo'
    ],
    frentesTrabalho: [
      'Pistas de Rolamento em Frentes de Lavra e Britagem',
      'Estradas de Serviço com Rocha Viva Exposta',
      'Áreas Florestais com Presença de Tocos e Raízes'
    ]
  },

  MT: {
    tipo: 'MT',
    sigla: 'M/T',
    nomeCompleto: 'MUD-TERRAIN',
    subtitulo: 'Tração Máxima em Lama, Areia & Pântano',
    destaqueBadge: 'OFF-ROAD EXTREMO',
    corTema: 'red',
    porcentagemAsfalto: 20,
    porcentagemOffroad: 80,
    labelOffroad: 'Lama Pesada / Solo Fofo',
    resumoTecnico:
      'Blocos massivos e espaçados para ejeção instantânea de barro espesso. Carcaça superblindada com travas de ombro salientes para cravação lateral em atoleiros.',
    advertencia:
      'Gera alto ruído em asfalto, vibração e desgaste rápido se rodar contínuo no pavimento. Distância de frenagem em piso molhado é ampliada em até 40%.',
    aplicacaoSiger:
      'Viaturas de combate florestal, resgate em mata fechada e atoleiros sazonais.',
    dadosMecanicos: {
      ruidoCabineDb: 81,
      classificacaoRuido: 'Alto (Ressonância Típica de Garras em Alta Velocidade)',
      resistenciaRolamento: 'Classe F (Alta Resistência / Demanda Potência do Motor)',
      impactoConsumoDiesel: '+10% a +15% no Consumo de Combustível',
      aderenciaAsfaltoSeco: 'Moderada (Blocos Maciços com Menor Área de Contato no Asfalto)',
      aderenciaPisoMolhado: 'Atenção Crítica (Menor Drenagem em Lâmina de Água Lisa)',
      tracaoTerrenoSevero: 'Absoluta em Lamaçal Profundo, Argila Encharcada e Terrenos Pantanosos.'
    },
    diretrizesCalibragemPsi: {
      rodoviariaPadrao: 40,
      cargaMaxima: 45,
      emergencialOffroad: 18,
      notaCalibragem:
        'Alívio para 18 PSI em caso de atoleiro iminente. Limitar velocidade a 40 km/h até recalibrar.'
    },
    viaturasRecomendadas: [
      'Viaturas de Combate a Incêndios Florestais (Caminhões e Picapes 4x4)',
      'Unidades de Busca e Salvamento em Áreas Remotas e Alagadiças',
      'Veículos de Patrulha em Linhas de Transmissão e Dutos Rurais'
    ],
    frentesTrabalho: [
      'Trilhas Sazonais com Lamaçal Profundo e Argila Vermelha',
      'Travessias de Várzeas, Areais Fofos e Pântanos',
      'Rotas de Difícil Acesso sem Manutenção Viária'
    ]
  }
};
