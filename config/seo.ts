/**
 * Configurações Centrais de SEO e Metadados do SIGER Master (JIMMP Info)
 * Garante URL dinâmica baseada em ambiente e centralização de tags.
 */

export const SITE_URL = 
  process.env.NEXT_PUBLIC_SITE_URL || 
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://spci-master.vercel.app');

export const SEO_CONFIG = {
  siteName: 'SIGER Master',
  defaultTitle: 'SIGER Master - Gestão Integrada de Emergência, Resgate e Frotas | JIMMP Info',
  titleTemplate: '%s | SIGER Master',
  defaultDescription: 'Plataforma integrada para rastreabilidade de ativos, telemetria de viaturas, laudos técnicos NBR e gestão operacional offline-first.',
  keywords: [
    'SIGER Master',
    'JIMMP Info',
    'SPCI',
    'Gestão de Frotas',
    'Telemetria Operacional',
    'Prevenção de Incêndio',
    'NBR 12962',
    'NBR 13434',
    'NBR 13714',
    'Extintores Inmetro',
    'Inspeção de Hidrantes',
    'Laudo Técnico AVCB',
    'Gestão de Ativos',
    'Segurança Contra Incêndio',
    'Vistoria Predial',
    'Engenharia de Segurança'
  ],
  category: 'technology',
  ogImage: '/assets/branding/logo-jimmp-info.png',
  locale: 'pt_BR',
};
