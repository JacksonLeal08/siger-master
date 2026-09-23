import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SIGER Master - JIMMP Info',
    short_name: 'SIGER Master',
    description: 'Sistema Integrado de Gestão de Emergência, Resgate e Frotas Operacionais',
    start_url: '/',
    display: 'standalone',
    background_color: '#1E2024', // Grafite Cyber Metálico
    theme_color: '#1E2024',      // Titânio Escuro
    orientation: 'portrait',
    icons: [
      {
        src: '/assets/branding/icon-jimmp.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
    shortcuts: [
      {
        name: 'Inspeção de Campo',
        short_name: 'Inspeção',
        description: 'Consulta pública rápida por QR Code',
        url: '/consulta/EXT-001',
      },
      {
        name: 'Cockpit SIGER',
        short_name: 'Cockpit',
        description: 'Painel Geral de Ativos e Frota',
        url: '/dashboard',
      },
    ],
  };
}
