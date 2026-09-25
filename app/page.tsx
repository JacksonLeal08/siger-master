import { Metadata } from 'next';
import { SITE_URL, SEO_CONFIG } from '@/config/seo';
import QuietLuxuryHome from './components/QuietLuxuryHome';

export const metadata: Metadata = {
  title: {
    absolute: 'SIGER Master | Comando Unificado de Emergência, Resgate e Prontidão • JIMMP Info',
  },
  description: 'Do gerenciamento preventivo de ativos críticos ao despacho tático de ambulâncias e viaturas 4x4. Plataforma com telemetria metrológica, comando CECOM e prontuário pré-hospitalar vivo.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'SIGER Master | Comando Unificado de Emergência, Resgate e Frotas • JIMMP Info',
    description: 'Plataforma integrada de missão crítica: Ativos SPCI, Gestão de Frotas de Emergência, Central de Despacho CAD/CECOM e Prontuário APH Vivo.',
    url: SITE_URL,
    type: 'website',
    images: [
      {
        url: '/assets/branding/logo-jimmp-info.png',
        width: 1200,
        height: 630,
        alt: 'SIGER Master - JIMMP Info',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SIGER Master | Comando Unificado de Emergência, Resgate e Frotas • JIMMP Info',
    description: 'Centralização de laudos técnicos NBR, telemetria operacional de frotas e governança contínua.',
    images: ['/assets/branding/logo-jimmp-info.png'],
  },
};

const homeFaqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  '@id': `${SITE_URL}/#faq`,
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Como o SIGER Master unifica combate a incêndio, frota e atendimento pré-hospitalar?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'A plataforma opera com arquitetura modular integrada: enquanto a engenharia monitora ativos fixos (extintores, hidrantes e bombas), o módulo de frota acompanha a prontidão metrológica de ambulâncias e 4x4, conectando-se ao CAD/CECOM para despacho georreferenciado e ao Prontuário APH Vivo para registro clínico simultâneo.',
      },
    },
    {
      '@type': 'Question',
      name: 'Como funciona a auditoria de frotas e telemetria metrológica de pneus (TWI)?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'O sistema realiza o mapeamento digital dos sulcos dos pneus em milímetros com base no catálogo de fábrica de cada chassi homologado. Alertas visuais e sonoros indicam limites de desgaste e necessidade de rodízio ou substituição perante a resolução CONTRAN 558/80.',
      },
    },
    {
      '@type': 'Question',
      name: 'A operação de campo e vistorias funciona sem conexão com a internet (Offline-First)?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Sim. Os brigadistas e condutores realizam checklists normativos, laudos fotográficos e prontuários clínicos diretamente em smartphones mesmo sem sinal de internet. Os dados são salvos em banco local criptografado e sincronizados atomicamente com a nuvem assim que a rede for restabelecida.',
      },
    },
  ],
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeFaqJsonLd) }}
      />
      <QuietLuxuryHome />
    </>
  );
}
