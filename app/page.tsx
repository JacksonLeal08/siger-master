import { Metadata } from 'next';
import { SITE_URL, SEO_CONFIG } from '@/config/seo';
import QuietLuxuryHome from './components/QuietLuxuryHome';

export const metadata: Metadata = {
  title: {
    absolute: 'SIGER Master | Gestão Integrada de Emergência & Resgate • JIMMP Info',
  },
  description: 'Plataforma integrada para rastreabilidade de Ativos SIGER, telemetria de frotas operacionais e emissão de laudos técnicos em tempo real.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'SIGER Master | Gestão Integrada de Emergência, Resgate e Frotas • JIMMP Info',
    description: 'Centralização de laudos técnicos NBR, telemetria operacional de frotas e governança contínua.',
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
    title: 'SIGER Master | Gestão Integrada de Emergência & Resgate • JIMMP Info',
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
      name: 'Qual é a periodicidade da inspeção de extintores segundo a NBR 12962?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'A inspeção de nível 1 (visual e operacional) deve ser realizada mensalmente, a manutenção de nível 2 (recarga) anualmente e o ensaio hidrostático (nível 3) a cada 5 anos conforme as normas ABNT NBR 12962 e regulamentações do Inmetro.',
      },
    },
    {
      '@type': 'Question',
      name: 'Como funciona a vistoria técnica offline-first no SISTEMA SIGER?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'O técnico de campo realiza todo o checklist normativo no smartphone mesmo sem sinal de internet. Ao restabelecer a conexão, os dados e fotos são sincronizados automaticamente com a nuvem em conformidade com o AVCB e NBRs.',
      },
    },
    {
      '@type': 'Question',
      name: 'Quais itens são vistoriados na rede de hidrantes NBR 13714?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'São auditados o estado das mangueiras de incêndio, acoplamentos Storz, esguichos reguláveis, chaves de mangueira, abrigo, desobstrução física e verificação de pressão residual estática e dinâmica da casa de bombas.',
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
