import { Metadata } from 'next';
import { SITE_URL } from '@/config/seo';
import LoginClient from './LoginClient';

export const metadata: Metadata = {
  title: 'Entrar no Cockpit • SIGER Master',
  description: 'Acesse o Cockpit do SIGER Master - Comando Unificado de Emergência, Resgate e Prontidão Operacional.',
  alternates: {
    canonical: '/login',
  },
  openGraph: {
    title: 'Entrar no Cockpit • SIGER Master',
    description: 'Acesse o Cockpit do SIGER Master - Comando Unificado de Emergência, Resgate e Prontidão Operacional.',
    url: `${SITE_URL}/login`,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Entrar no Cockpit • SIGER Master',
    description: 'Acesse o Cockpit do SIGER Master - Comando Unificado de Emergência, Resgate e Prontidão Operacional.',
  },
};

export default function LoginPage() {
  return <LoginClient />;
}
