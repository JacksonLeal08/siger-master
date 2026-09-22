'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Minus, 
  Maximize2, 
  Minimize2, 
  Disc, 
  Volume2, 
  Fuel, 
  Gauge, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Compass, 
  Layers, 
  Truck,
  Activity,
  Droplets,
  Wind
} from 'lucide-react';
import { TipoTerrenoPneu } from '@/lib/types/frota';
import { TireProfileDetail, TIRE_PROFILES_DATA } from '@/lib/data/tireProfilesData';

interface TireTypeDetailModalProps {
  isOpen: boolean;
  profileType: TipoTerrenoPneu | null;
  isDark?: boolean;
  onClose: () => void;
  onMinimize?: (profile: TireProfileDetail) => void;
}

export const TireTypeDetailModal: React.FC<TireTypeDetailModalProps> = ({
  isOpen,
  profileType,
  isDark = true,
  onClose,
  onMinimize
}) => {
  const [mounted, setMounted] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  // Evita erros de hidratação garantindo montagem apenas no navegador
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fechamento com tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!mounted || !isOpen || !profileType) return null;

  const profile = TIRE_PROFILES_DATA[profileType];
  if (!profile) return null;

  // Semáforo cromático por perfil
  const getThemeAccents = () => {
    switch (profile.corTema) {
      case 'blue':
        return {
          badge: isDark ? 'bg-blue-500/20 text-blue-400 border-blue-500/40' : 'bg-blue-50 text-blue-700 border-blue-300',
          accentText: isDark ? 'text-blue-400' : 'text-blue-600',
          barColor: 'bg-blue-600',
          borderGlow: isDark ? 'border-blue-500/30' : 'border-blue-300',
          iconBg: isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'
        };
      case 'emerald':
        return {
          badge: isDark ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : 'bg-emerald-50 text-emerald-700 border-emerald-300',
          accentText: isDark ? 'text-emerald-400' : 'text-emerald-600',
          barColor: 'bg-emerald-600',
          borderGlow: isDark ? 'border-emerald-500/30' : 'border-emerald-300',
          iconBg: isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'
        };
      case 'amber':
        return {
          badge: isDark ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' : 'bg-amber-50 text-amber-700 border-amber-300',
          accentText: isDark ? 'text-amber-400' : 'text-amber-600',
          barColor: 'bg-amber-600',
          borderGlow: isDark ? 'border-amber-500/30' : 'border-amber-300',
          iconBg: isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-600'
        };
      case 'red':
      default:
        return {
          badge: isDark ? 'bg-red-500/20 text-red-400 border-red-500/40' : 'bg-red-50 text-red-700 border-red-300',
          accentText: isDark ? 'text-red-400' : 'text-red-600',
          barColor: 'bg-red-700',
          borderGlow: isDark ? 'border-red-500/30' : 'border-red-300',
          iconBg: isDark ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600'
        };
    }
  };

  const accents = getThemeAccents();

  return createPortal(
    <div
      className="fixed inset-0 z-[99998] flex items-center justify-center p-3 sm:p-6 backdrop-blur-md bg-black/70 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="tire-detail-title"
    >
      <div
        className={`relative z-[99999] flex flex-col transition-all duration-200 ease-out border shadow-2xl font-sans ${
          isMaximized
            ? 'w-screen h-screen inset-0 rounded-none max-w-none max-h-none'
            : 'max-w-3xl w-full max-h-[88vh] rounded-3xl'
        } ${
          isDark
            ? 'bg-zinc-950 text-zinc-100 border-zinc-800 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)]'
            : 'bg-white text-slate-900 border-slate-300 shadow-2xl'
        }`}
      >
        {/* ==================================================================== */}
        {/* CABEÇALHO EXECUTIVO COM CONTROLES DE JANELA (SIGER MASTER) */}
        {/* ==================================================================== */}
        <header
          className={`px-5 sm:px-6 py-4 border-b flex items-center justify-between gap-3 shrink-0 rounded-t-3xl ${
            isDark ? 'bg-zinc-900/90 border-zinc-800' : 'bg-slate-50/95 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${accents.iconBg} ${accents.borderGlow}`}
            >
              <Disc className="w-5 h-5 animate-spin-slow" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[10px] font-mono font-black px-2.5 py-0.5 rounded-full border ${accents.badge}`}>
                  FICHA TÉCNICA: PNEU {profile.sigla}
                </span>
                <span className={`text-[10px] font-mono uppercase font-bold tracking-wider ${accents.accentText}`}>
                  {profile.nomeCompleto}
                </span>
              </div>
              <h3
                id="tire-detail-title"
                className={`text-xs sm:text-sm font-mono font-black uppercase truncate mt-0.5 ${
                  isDark ? 'text-zinc-100' : 'text-slate-950'
                }`}
              >
                {profile.subtitulo}
              </h3>
            </div>
          </div>

          {/* Barra Corporativa de Controles de Janela */}
          <div
            className={`flex items-center border rounded-xl overflow-hidden shrink-0 ${
              isDark ? 'border-zinc-800 bg-zinc-900' : 'border-slate-300 bg-slate-100'
            }`}
          >
            {/* Minimizar para a Barra Flutuante Dock */}
            {onMinimize && (
              <button
                type="button"
                onClick={() => onMinimize(profile)}
                className={`p-2 transition-colors border-none bg-transparent cursor-pointer ${
                  isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-slate-600 hover:text-slate-950 hover:bg-slate-200'
                }`}
                title="Minimizar para a Barra Dock Inferior (_)"
                aria-label="Minimizar"
              >
                <Minus className="w-4 h-4" />
              </button>
            )}

            {/* Maximizar / Restaurar */}
            <button
              type="button"
              onClick={() => setIsMaximized(!isMaximized)}
              className={`p-2 transition-colors border-none bg-transparent cursor-pointer ${
                isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-slate-600 hover:text-slate-950 hover:bg-slate-200'
              }`}
              title={isMaximized ? 'Restaurar Janela Centralizada' : 'Maximizar em Tela Cheia'}
              aria-label={isMaximized ? 'Restaurar' : 'Maximizar'}
            >
              {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Fechar */}
            <button
              type="button"
              onClick={onClose}
              className={`p-2 transition-colors border-none bg-transparent cursor-pointer ${
                isDark ? 'text-zinc-400 hover:text-red-400 hover:bg-zinc-800' : 'text-slate-600 hover:text-red-600 hover:bg-slate-200'
              }`}
              title="Fechar Janela (Esc)"
              aria-label="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* ==================================================================== */}
        {/* CORPO DO MODAL EXECUTIVO COM CONTEÚDO TÉCNICO ENRIQUECIDO */}
        {/* ==================================================================== */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          
          {/* 1. SEÇÃO DE TERRENO & PROPORÇÃO GRÁFICA */}
          <div
            className={`p-4 sm:p-5 rounded-2xl border ${
              isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <Compass className={`w-4 h-4 ${accents.accentText}`} />
                <h4 className="font-mono font-bold text-xs uppercase tracking-wider">
                  Proporção de Terreno & Aplicação de Rota
                </h4>
              </div>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${accents.badge}`}>
                Severidade Balanceada
              </span>
            </div>

            {/* Barra Gráfica Segmentada com Percentuais Grandes */}
            <div className="my-3">
              <div className="flex justify-between text-xs font-mono font-bold mb-1.5">
                <span className="flex items-center gap-1.5 text-blue-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                  {profile.porcentagemAsfalto}% Pavimento / Asfalto
                </span>
                <span className="flex items-center gap-1.5 text-amber-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  {profile.porcentagemOffroad}% {profile.labelOffroad}
                </span>
              </div>
              <div className="w-full h-3.5 rounded-full overflow-hidden flex bg-slate-200 dark:bg-zinc-800 shadow-inner">
                <div
                  className="bg-blue-600 h-full transition-all duration-700 relative flex items-center justify-center"
                  style={{ width: `${profile.porcentagemAsfalto}%` }}
                >
                  <span className="text-[9px] font-mono font-black text-white px-1">
                    {profile.porcentagemAsfalto}%
                  </span>
                </div>
                <div
                  className="bg-amber-500 h-full transition-all duration-700 relative flex items-center justify-center"
                  style={{ width: `${profile.porcentagemOffroad}%` }}
                >
                  <span className="text-[9px] font-mono font-black text-zinc-900 px-1">
                    {profile.porcentagemOffroad}%
                  </span>
                </div>
              </div>
            </div>

            <p className={`text-xs leading-relaxed ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
              {profile.resumoTecnico}
            </p>

            {profile.advertencia && (
              <div
                className={`mt-3 p-3 rounded-xl border text-xs font-mono flex items-start gap-2 ${
                  isDark ? 'bg-red-950/40 border-red-800/70 text-red-300' : 'bg-red-50 border-red-200 text-red-800'
                }`}
              >
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Advertência Operacional:</strong> {profile.advertencia}
                </span>
              </div>
            )}
          </div>

          {/* 2. QUADRO DE FÍSICA & COMPORTAMENTO MECÂNICO */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Activity className={`w-4 h-4 ${accents.accentText}`} />
              <h4 className="font-mono font-bold text-xs uppercase tracking-wider">
                Física & Comportamento Mecânico de Rodagem
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              
              {/* Bloco 2A: Ruído na Cabine (dB) */}
              <div
                className={`p-4 rounded-2xl border flex flex-col justify-between ${
                  isDark ? 'bg-zinc-900/70 border-zinc-800' : 'bg-white border-slate-200 shadow-xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                      Ruído na Cabine
                    </span>
                    <Volume2 className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="flex items-baseline gap-1.5 mb-1">
                    <span className="text-2xl font-mono font-black text-blue-500">
                      {profile.dadosMecanicos.ruidoCabineDb}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-400">dB(A)</span>
                  </div>
                  <p className="text-[11px] font-mono leading-tight text-slate-400">
                    {profile.dadosMecanicos.classificacaoRuido}
                  </p>
                </div>

                {/* Medidor acústico visual */}
                <div className="mt-3 pt-2 border-t border-slate-700/40">
                  <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-zinc-800 overflow-hidden">
                    <div
                      className={`h-full ${
                        profile.dadosMecanicos.ruidoCabineDb > 78
                          ? 'bg-red-500'
                          : profile.dadosMecanicos.ruidoCabineDb > 73
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, ((profile.dadosMecanicos.ruidoCabineDb - 60) / 30) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Bloco 2B: Resistência ao Rolamento & Consumo Diesel */}
              <div
                className={`p-4 rounded-2xl border flex flex-col justify-between ${
                  isDark ? 'bg-zinc-900/70 border-zinc-800' : 'bg-white border-slate-200 shadow-xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                      Resistência & Consumo
                    </span>
                    <Fuel className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="text-sm font-mono font-black text-amber-500 mb-1">
                    {profile.dadosMecanicos.resistenciaRolamento}
                  </div>
                  <p className="text-[11px] font-mono leading-tight text-slate-400">
                    Impacto no Diesel: <strong className={isDark ? 'text-zinc-200' : 'text-slate-800'}>{profile.dadosMecanicos.impactoConsumoDiesel}</strong>
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-700/40 text-[10px] font-mono text-slate-400">
                  Auditoria de Consumo SIGER
                </div>
              </div>

              {/* Bloco 2C: Frenagem & Aderência */}
              <div
                className={`p-4 rounded-2xl border flex flex-col justify-between ${
                  isDark ? 'bg-zinc-900/70 border-zinc-800' : 'bg-white border-slate-200 shadow-xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                      Frenagem & Aderência
                    </span>
                    <Droplets className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p className="text-[11px] font-mono leading-tight mb-1">
                    <strong className="text-emerald-500">Seco:</strong> {profile.dadosMecanicos.aderenciaAsfaltoSeco}
                  </p>
                  <p className="text-[11px] font-mono leading-tight">
                    <strong className="text-blue-400">Molhado:</strong> {profile.dadosMecanicos.aderenciaPisoMolhado}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-700/40 text-[10.5px] font-mono text-slate-400">
                  Tração Severa: <span className={isDark ? 'text-zinc-200' : 'text-slate-800'}>{profile.dadosMecanicos.tracaoTerrenoSevero}</span>
                </div>
              </div>

            </div>
          </div>

          {/* 3. DIRETRIZ DE PRESSÃO OPERACIONAL (PSI) */}
          <div
            className={`p-4 sm:p-5 rounded-2xl border ${
              isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <Gauge className="w-4 h-4 text-red-500" />
                <h4 className="font-mono font-bold text-xs uppercase tracking-wider">
                  Diretrizes de Pressão Recomendada (PSI)
                </h4>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                Calibragem a Frio
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
              
              <div className={`p-3 rounded-xl border text-center ${
                isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-slate-200'
              }`}>
                <span className="text-[10px] font-mono text-slate-400 block uppercase">
                  Deslocamento Rodoviário
                </span>
                <span className="text-2xl font-mono font-black text-blue-500">
                  {profile.diretrizesCalibragemPsi.rodoviariaPadrao} <span className="text-xs font-normal text-slate-400">PSI</span>
                </span>
                <span className="text-[9.5px] font-mono block text-slate-500 mt-0.5">
                  Pavimento / Viatura Leve
                </span>
              </div>

              <div className={`p-3 rounded-xl border text-center ${
                isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-slate-200'
              }`}>
                <span className="text-[10px] font-mono text-slate-400 block uppercase">
                  Carga Máxima / Equipamentos
                </span>
                <span className="text-2xl font-mono font-black text-emerald-500">
                  {profile.diretrizesCalibragemPsi.cargaMaxima} <span className="text-xs font-normal text-slate-400">PSI</span>
                </span>
                <span className="text-[9.5px] font-mono block text-slate-500 mt-0.5">
                  Módulos de Resgate e Água
                </span>
              </div>

              <div className={`p-3 rounded-xl border text-center ${
                isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-slate-200'
              }`}>
                <span className="text-[10px] font-mono text-slate-400 block uppercase">
                  Alívio Emergencial (Off-Road)
                </span>
                <span className="text-2xl font-mono font-black text-amber-500">
                  {profile.diretrizesCalibragemPsi.emergencialOffroad} <span className="text-xs font-normal text-slate-400">PSI</span>
                </span>
                <span className="text-[9.5px] font-mono block text-slate-500 mt-0.5">
                  Lamaçal / Areial Fofo
                </span>
              </div>

            </div>

            <p className="text-[11px] font-mono text-slate-400 italic">
              ℹ️ {profile.diretrizesCalibragemPsi.notaCalibragem}
            </p>
          </div>

          {/* 4. DIRETRIZ CORPORATIVA DE APLICAÇÃO SIGER MASTER */}
          <div
            className={`p-4 sm:p-5 rounded-2xl border ${
              isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <h4 className="font-mono font-bold text-xs uppercase tracking-wider">
                Enquadramento Operacional SIGER Master
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">
                  Viaturas Homologadas:
                </span>
                <ul className="space-y-1.5">
                  {profile.viaturasRecomendadas.map((viatura, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Truck className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                      <span className={isDark ? 'text-zinc-200' : 'text-slate-800'}>{viatura}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">
                  Frentes de Trabalho Indicadas:
                </span>
                <ul className="space-y-1.5">
                  {profile.frentesTrabalho.map((frente, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span className={isDark ? 'text-zinc-200' : 'text-slate-800'}>{frente}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>
          </div>

        </div>

        {/* ==================================================================== */}
        {/* RODAPÉ EXECUTIVO DE CONTROLE */}
        {/* ==================================================================== */}
        <footer
          className={`px-5 sm:px-6 py-3.5 border-t flex flex-wrap items-center justify-between gap-3 shrink-0 rounded-b-3xl ${
            isDark ? 'bg-zinc-900/90 border-zinc-800' : 'bg-slate-50/95 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
            <span>Classificação Técnica:</span>
            <strong className={isDark ? 'text-zinc-200' : 'text-slate-900'}>CONTRAN 558/80 & Norma SIGER</strong>
          </div>

          <div className="flex items-center gap-2">
            {onMinimize && (
              <button
                type="button"
                onClick={() => onMinimize(profile)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                  isDark
                    ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                }`}
              >
                <Minus className="w-3.5 h-3.5" />
                Minimizar no Rodapé
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white border-none cursor-pointer transition-all shadow-xs active:scale-95"
            >
              <X className="w-3.5 h-3.5" />
              Fechar Ficha
            </button>
          </div>
        </footer>
      </div>
    </div>,
    document.body
  );
};

export default TireTypeDetailModal;
