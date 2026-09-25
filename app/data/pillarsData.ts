export interface PillarFeature {
  title: string;
  desc: string;
  tag: string;
}

export interface PillarData {
  id: string;
  pillarNumber: string;
  title: string;
  badgeTitle: string;
  subtitle: string;
  highlight: string;
  tooltipText: string;
  accentColor: string;
  badges: string[];
  cockpitUrl: string;
  iconName: 'flame' | 'truck' | 'radio' | 'HeartPulse' | 'swap' | 'clipboard';
  
  // Detalhes da Ficha Técnica Expandida
  missaoEscopo: {
    resumo: string;
    desafiosIndustriais: string[];
  };
  funcionalidadesNativas: PillarFeature[];
  marcoRegulatorio: {
    normas: string[];
    orgaos: string[];
    impactoJuridico: string;
  };
  arquiteturaDados: {
    tipoSync: string;
    tecnologias: string[];
    resiliencia: string;
  };
}

export const PILLARS_DATA: Record<string, PillarData> = {
  spci: {
    id: 'spci',
    pillarNumber: 'PILAR 01 // SPCI',
    title: '🧯 ENGENHARIA DE ATIVOS & PREVENÇÃO (SPCI MASTER)',
    badgeTitle: 'Engenharia de Ativos & Prevenção (SPCI)',
    subtitle: 'Gestão e Rastreabilidade Normativa NBR',
    highlight: 'Extintores, hidrantes, bombas de incêndio e plantas periciais.',
    tooltipText: 'Auditoria NBR 12962 • Rastreabilidade QR Híbrido • Tolerância Zero a Vencimentos',
    accentColor: '#68D346',
    iconName: 'flame',
    badges: [
      '✓ ABNT NBR 12962 / 13714',
      '• Rastreio 100% Inmetro',
      '• Laudo Fotográfico Duplo'
    ],
    cockpitUrl: '/dashboard',
    missaoEscopo: {
      resumo: 'Garantir a disponibilidade operacional ininterrupta e a integridade pericial de todos os sistemas passivos e ativos de proteção e combate a incêndio em plantas industriais complexas (mineração, óleo & gás, química e siderurgia).',
      desafiosIndustriais: [
        'Inspeções em plantas com mais de 5.000 extintores dispersos geograficamente.',
        'Eliminação de relatórios em papel sujeitos a fraudes ou adulterações em campo.',
        'Manutenção preventiva programada de motobombas, manifolds e pressões dinâmicas.',
        'Auditoria rigorosa de selos do Inmetro, anéis de identificação e testes hidrostáticos.'
      ]
    },
    funcionalidadesNativas: [
      {
        title: 'Mapeamento por QR Code Híbrido',
        desc: 'Identificação criptográfica de cilindros e abrigos com leitura ultrarrápida mesmo em condições severas de baixa luminosidade.',
        tag: 'Rastreabilidade'
      },
      {
        title: 'Checklists Normativos Automatizados',
        desc: 'Inspeções de Nível 1 (mensal) e Nível 2 (anual) com validação de parâmetros de manômetro, lacres, travas e mangueiras.',
        tag: 'Conformidade'
      },
      {
        title: 'Laudos Fotográficos com Carimbo de Tempo',
        desc: 'Captura obrigatória de fotos antes e depois com georreferenciamento e hash imutável pericial.',
        tag: 'Auditoria'
      },
      {
        title: 'Gestão de Oficinas Credenciadas',
        desc: 'Controle de envio, recebimento, lotes de recarga e emissão automática de ordens de serviço periciais.',
        tag: 'Metrologia'
      }
    ],
    marcoRegulatorio: {
      normas: [
        'ABNT NBR 12962 — Inspeção, manutenção e recarga em extintores de incêndio',
        'ABNT NBR 13714 — Sistemas de hidrantes e de mangotinhos para combate a incêndio',
        'ABNT NBR 14276 — Brigada de incêndio e emergência industrial',
        'Instruções Técnicas (IT) do Corpo de Bombeiros Militar'
      ],
      orgaos: ['Inmetro', 'Corpo de Bombeiros Militar (CBM)', 'Ministério do Trabalho (NR-23)'],
      impactoJuridico: 'Conformidade irrefutável com responsabilidade civil e criminal respaldada por laudos periciais com assinatura digital e carimbo de tempo.'
    },
    arquiteturaDados: {
      tipoSync: 'PWA Offline-First com Sincronização Atômica Bidirecional',
      tecnologias: ['IndexedDB Local Criptografado', 'WebSockets em Tempo Real', 'PostgreSQL RLS'],
      resiliencia: 'O operador inspeciona subsolos e áreas de sombra sem internet; os dados são persistidos localmente e sincronizados de forma atômica ao restabelecer conectividade.'
    }
  },

  frota: {
    id: 'frota',
    pillarNumber: 'PILAR 02 // FLEET OS',
    title: '🚑 GESTÃO DE FROTAS & METROLOGIA (FLEET OS)',
    badgeTitle: 'Gestão de Frotas & Metrologia (Fleet OS)',
    subtitle: 'Prontidão Operacional & Controle de TWI de Pneus',
    highlight: 'Ambulâncias e viaturas 4x4, telemetria de abastecimento e catálogo de pneus com cálculo de borracha útil.',
    tooltipText: 'Resolução CONTRAN 558/80 • Metrologia TWI em mm • Validação Antifraude',
    accentColor: '#38BDF8',
    iconName: 'truck',
    badges: [
      '✓ Resolução CONTRAN 558/80',
      '• Auditoria TWI em mm',
      '• Validação Antifraude'
    ],
    cockpitUrl: '/dashboard',
    missaoEscopo: {
      resumo: 'Assegurar 100% de prontidão mecânica e segurança de tráfego para viaturas de resgate, veículos de intervenção rápida (VIR) e caminhonetes táticas 4x4 operando em ambientes agressivos e rotas fora de estrada.',
      desafiosIndustriais: [
        'Desgaste acelerado de bandas de rodagem em pistas de terra, brita e minério.',
        'Controle antifraude de consumo de combustível, quilometragem e horímetros.',
        'Prevenção de paralisações inesperadas de ambulâncias durante transferências de emergência.',
        'Gestão rigorosa de manutenções preventivas, freios, suspensão e sistemas 4x4.'
      ]
    },
    funcionalidadesNativas: [
      {
        title: 'Metrologia TWI com Catálogo de Fábrica',
        desc: 'Cálculo de borracha útil e profundidade de sulco em milímetros para cada pneu instalado, com alertas automáticos de rodízio.',
        tag: 'Metrologia'
      },
      {
        title: 'Auditoria de Abastecimento Antifraude',
        desc: 'Cruzamento dinâmico de odômetro, volume abastecido e média histórica por chassi, impedindo desvios operacionais.',
        tag: 'Governança'
      },
      {
        title: 'Checklist Veicular Digital de Troca de Turno',
        desc: 'Inspeção pré-partida executada pelo condutor socorrista com registro de níveis de óleo, arrefecimento e sirenes.',
        tag: 'Prontidão'
      },
      {
        title: 'Gestão Integrada de Ordens de Serviço (OS)',
        desc: 'Abertura, aprovação de orçamentos, requisição de peças e histórico completo de manutenção por placa e chassi.',
        tag: 'Manutenção'
      }
    ],
    marcoRegulatorio: {
      normas: [
        'Resolução CONTRAN nº 558/80 — Limites de segurança para desgaste de banda de rodagem (TWI)',
        'Resolução CONTRAN nº 912/22 — Requisitos de segurança para veículos de emergência',
        'ABNT NBR 14561 — Veículos para atendimento a emergências médicas e resgate'
      ],
      orgaos: ['Senatran / Contran', 'Detran', 'Polícia Rodoviária Federal (PRF)'],
      impactoJuridico: 'Garantia de conformidade pericial veicular em caso de sinistros, protegendo gestores de frotas contra autuações e responsabilizações.'
    },
    arquiteturaDados: {
      tipoSync: 'Sincronização em Nuvem com Telemetria de Borda',
      tecnologias: ['IndexedDB Local', 'Web Workers para Cálculos TWI', 'API REST Segura TLS 1.3'],
      resiliencia: 'Condutores realizam a medição de pneus e checklists no pátio sem sinal; a auditoria é calculada instantaneamente no dispositivo.'
    }
  },

  cecom: {
    id: 'cecom',
    pillarNumber: 'PILAR 03 // CAD / CECOM',
    title: '🛰️ CENTRAL DE COMANDO & DESPACHO (CAD / CECOM)',
    subtitle: 'Rastreamento Operacional em Tempo Real',
    badgeTitle: 'Central de Comando & Despacho (CAD/CECOM)',
    highlight: 'Linha do tempo da ocorrência, despacho ágil, SLAs de resposta e mapa GIS interativo.',
    tooltipText: 'GIS Tático Vivo • SLA de Despacho <60s • Linha do Tempo e Geocerceamento',
    accentColor: '#818CF8',
    iconName: 'radio',
    badges: [
      '✓ Mapa Tático em Tempo Real',
      '• Linha do Tempo Ocorrência',
      '• SLA de Resposta <60s'
    ],
    cockpitUrl: '/dashboard',
    missaoEscopo: {
      resumo: 'Prover consciência situacional total e despacho inteligente no menor tempo de resposta possível, conectando a central de operações aos socorristas e brigadistas em campo com georreferenciamento de alta precisão.',
      desafiosIndustriais: [
        'Localização precisa de ocorrências em plantas industriais de grande extensão territorial.',
        'Triagem de emergência rápida sem gargalos de comunicação ou perda de histórico.',
        'Atribuição da viatura mais próxima e adequada para o tipo específico de evento.',
        'Auditoria rigorosa da linha do tempo: acionamento, saída, chegada na cena e desfecho.'
      ]
    },
    funcionalidadesNativas: [
      {
        title: 'Mapa GIS Interativo com Posicionamento Vivo',
        desc: 'Visualização espacial de viaturas, brigadas em deslocamento, hidrantes da planta e pontos de encontro em tempo real.',
        tag: 'Geolocalização'
      },
      {
        title: 'Despacho Tático em Um Clique (SLA < 60s)',
        desc: 'Notificação instantânea para o terminal móvel da equipe de plantão com rota tática e detalhes da emergência.',
        tag: 'Comando'
      },
      {
        title: 'Linha do Tempo Auditável e Imutável',
        desc: 'Registro cronometrado segundo a segundo de todas as etapas da ocorrência para posterior análise de debriefing.',
        tag: 'Inteligência'
      },
      {
        title: 'Cerca Eletrônica & Zonas de Risco (Geofencing)',
        desc: 'Alertas automáticos de entrada e saída de viaturas em áreas críticas, inflamáveis ou confinadas.',
        tag: 'Segurança'
      }
    ],
    marcoRegulatorio: {
      normas: [
        'Portaria MS nº 2048/2002 — Normas de regulação e despacho de urgências',
        'Resoluções ANATEL — Padrões de radiocomunicação de missão crítica',
        'Protocolos NFPA 1221 — Standard for the Installation, Maintenance, and Use of Emergency Services Communications Systems'
      ],
      orgaos: ['Ministério da Saúde', 'Defesa Civil', 'ANATEL'],
      impactoJuridico: 'Comprovação temporal fidedigna para auditorias de seguradoras, órgãos governamentais e inquéritos periciais pós-incidente.'
    },
    arquiteturaDados: {
      tipoSync: 'Barramento de Eventos em Tempo Real (Zero-Lag)',
      tecnologias: ['WebSockets / Supabase Realtime', 'OGC GeoJSON Specs', 'Workers Dedicados'],
      resiliencia: 'Transmissão contínua de telemetria com bufferização local caso haja perda pontual de pacote na rede de rádio ou celular.'
    }
  },

  aph: {
    id: 'aph',
    pillarNumber: 'PILAR 04 // ePCR CLÍNICO',
    title: '🩺 PRONTUÁRIO APH VIVO (ePCR CLÍNICO)',
    subtitle: 'Ficha de Atendimento Pré-Hospitalar Digital',
    badgeTitle: 'Prontuário APH Vivo (ePCR Clínico)',
    highlight: 'Sinais vitais em tempo real, condutas clínicas, controle de insumos e transição segura para o hospital.',
    tooltipText: 'Portaria MS 2048/2002 • Sinais Vitais em Tempo Real • Farmácia & Insumos',
    accentColor: '#FB7185',
    iconName: 'HeartPulse',
    badges: [
      '✓ ePCR de Cena Digital',
      '• Monitor de Sinais Vitais',
      '• Rastreio de Farmácia & Medicamentos'
    ],
    cockpitUrl: '/dashboard',
    missaoEscopo: {
      resumo: 'Substituir a ficha de atendimento em papel por um prontuário eletrônico de atendimento pré-hospitalar (ePCR) dinâmico, garantindo precisão clínica na cena e transferência segura de cuidados para a unidade hospitalar.',
      desafiosIndustriais: [
        'Registro de sinais vitais seriados (Glasgow, PAM, SpO2, glicemia) durante transporte em terreno acidentado.',
        'Rastreabilidade rigorosa de medicamentos de uso controlado e insumos hospitalares administrados.',
        'Proteção absoluta de dados de saúde sensíveis conforme exigências da LGPD e conselhos de classe.',
        'Assinatura digital e transferência formal de responsabilidade na entrega do paciente no hospital.'
      ]
    },
    funcionalidadesNativas: [
      {
        title: 'Monitor Gráfico de Sinais Vitais Seriados',
        desc: 'Plotagem contínua de evolução clínica (PA, FC, FR, SpO2, ECG e Escala de Coma de Glasgow) na linha do tempo.',
        tag: 'Clínica'
      },
      {
        title: 'Condutas Médicas e Protocolos Guideline',
        desc: 'Checklists guiados de PHTLS, ACLS e atendimento ao trauma industrial com validação de procedimentos invasivos.',
        tag: 'Protocolos'
      },
      {
        title: 'Baixa Automática de Farmácia & Insumos',
        desc: 'Abatimento imediato no estoque da viatura de medicamentos, cateteres, oxigênio e curativos aplicados.',
        tag: 'Farmácia'
      },
      {
        title: 'Passagem de Plantão e Ficha Hospitalar',
        desc: 'Geração instantânea de relatório médico em PDF/A criptografado com assinatura digital do médico ou enfermeiro da cena.',
        tag: 'LGPD'
      }
    ],
    marcoRegulatorio: {
      normas: [
        'Portaria MS nº 2048/2002 — Regulamento Técnico dos Sistemas Estaduais de Urgência e Emergência',
        'Resolução CFM nº 2.147/2016 — Responsabilidade de médicos no atendimento pré-hospitalar',
        'Resolução COFEN nº 688/2021 — Diretrizes para enfermagem em APH móvel',
        'Lei Federal nº 13.709/2018 (LGPD) — Proteção a dados pessoais sensíveis de saúde'
      ],
      orgaos: ['Conselho Federal de Medicina (CFM)', 'Conselho Federal de Enfermagem (COFEN)', 'Ministério da Saúde'],
      impactoJuridico: 'Documento médico legal irrefutável com hash criptográfico pericial e trilha de auditoria para respaldo técnico e civil da equipe de saúde.'
    },
    arquiteturaDados: {
      tipoSync: 'Criptografia Ponta a Ponta com Armazenamento Seguro Offline',
      tecnologias: ['Web Cryptography API (AES-GCM-256)', 'IndexedDB Local Seguro', 'PDF/A Signature Engine'],
      resiliencia: 'O socorrista preenche a ficha durante o socorro dentro da ambulância mesmo sem sinal; ao chegar ao hospital com Wi-Fi/4G, os dados são enviados instantaneamente.'
    }
  }
};
