'use client';

import React from 'react';
import MotoristaAbastecimentoForm from '@/app/components/frota/MotoristaAbastecimentoForm';
import { useSpci } from '@/app/context/SpciContext';

export default function AbastecerPage() {
  const { activeSite, userProfile } = useSpci();
  const contratoId = (activeSite && activeSite !== 'TODOS' && activeSite !== 'GLOBAL')
    ? activeSite
    : (userProfile?.site && userProfile.site !== 'TODOS')
    ? userProfile.site
    : (typeof window !== 'undefined' ? (localStorage.getItem('siger_active_contract') || localStorage.getItem('spci_active_contract')) : '') || 'SALOBO';

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-3">
      <MotoristaAbastecimentoForm
        contratoId={contratoId}
        condutorPadrao={userProfile?.nome || 'Motorista Operacional'}
      />
    </div>
  );
}
