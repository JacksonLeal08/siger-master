import { Metadata } from 'next';
import { SITE_URL } from '@/config/seo';
import LoginClient from './LoginClient';

export const metadata: Metadata = {
  title: 'Entrar no Cockpit - SPCI Compliance',
  description: 'Acesse o Cockpit de governança e gestão de combate a incêndio do SISTEMA SIGER.',
  alternates: {
    canonical: '/login',
  },
  openGraph: {
    title: 'Entrar no Cockpit | SPCI Compliance',
    description: 'Acesse o Cockpit de governança e gestão de combate a incêndio do SISTEMA SIGER.',
    url: `${SITE_URL}/login`,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Entrar no Cockpit | SPCI Compliance',
    description: 'Acesse o Cockpit de governança e gestão de combate a incêndio do SISTEMA SIGER.',
  },
};

export default function LoginPage() {
  return <LoginClient />;
}
