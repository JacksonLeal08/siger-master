'use client';

import React, { Suspense } from 'react';
import OrdensServicoView from '@/app/components/frota/OrdensServicoView';

export default function FrotaOrdensServicoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-xs text-slate-400 font-mono">
        Carregando painel de Ordens de Serviço SIGER...
      </div>
    }>
      <OrdensServicoView />
    </Suspense>
  );
}

