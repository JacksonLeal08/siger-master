'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { useSpci } from '@/app/context/SpciContext';
import { 
  Gauge, 
  Play, 
  Square, 
  Zap, 
  Activity, 
  CheckCircle2, 
  AlertTriangle,
  RotateCw,
  Sliders,
  ShieldCheck
} from 'lucide-react';

export default function BombasPage() {
  const {
    bombas,
    triggerSuccessNotification,
    activeSite,
    userProfile
  } = useSpci();

  const [pressure, setPressure] = useState(125);
  const [isTestRunning, setIsTestRunning] = useState(false);

  // Contrato operacional efetivo
  const currentContratoId = useMemo(() => {
    if (activeSite && !activeSite.startsWith('TODOS') && activeSite !== 'GLOBAL') {
      return activeSite;
    }
    return userProfile?.site && !userProfile.site.startsWith('TODOS') ? userProfile.site : 'SALOBO';
  }, [activeSite, userProfile]);

  // --- PUMP PRESSURE FLUTTER SIMULATOR ---
  useEffect(() => {
    if (!isTestRunning) return;
    const interval = setInterval(() => {
      setPressure(prev => {
        const delta = Math.floor(Math.random() * 20) - 10;
        const target = prev + delta;
        return target < 80 ? 80 : target > 160 ? 160 : target;
      });
    }, 500);
    return () => clearInterval(interval);
  }, [isTestRunning]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 select-none font-sans pb-16">
      {/* Header Executivo Cockpit */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] bg-red-600/10 text-red-600 dark:text-red-400 border border-red-600/20 px-2.5 py-0.5 rounded-full font-mono font-bold uppercase tracking-wider">
              SIGER CASA DE BOMBAS
            </span>
            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded font-mono font-bold">
              Site: {currentContratoId}
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Gauge className="w-6 h-6 text-red-600" />
            Casa de Bombas & Pressurização Hidráulica
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-sans">
            Monitoramento de pressão estática/dinâmica em tempo real (PSI), bombas Jockey, principais e Reserva Técnica de Incêndio (RTI)
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button 
            type="button"
            onClick={() => {
              if (isTestRunning) {
                setPressure(125);
              }
              setIsTestRunning(!isTestRunning);
            }}
            className={`px-5 py-2.5 rounded-xl text-xs font-mono font-black uppercase tracking-wider text-white transition-all shadow-md flex items-center gap-2 border-none cursor-pointer active:scale-95 ${
              isTestRunning 
                ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-500/20' 
                : 'bg-red-600 hover:bg-red-500 shadow-red-600/20'
            }`}
          >
            {isTestRunning ? (
              <>
                <Square className="w-4 h-4 fill-white" />
                Parar Teste de Pressão
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                Iniciar Simulação de Vazão
              </>
            )}
          </button>
        </div>
      </div>

      {/* Visual Widget de Pressão da Rede */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs relative overflow-hidden grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-emerald-500"></div>
        
        <div className="md:col-span-8 space-y-4 pl-2">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-500 animate-pulse" />
            <h3 className="font-sans font-bold text-lg text-slate-800 dark:text-slate-100">
              Pressão Estabilizada da Rede Hidráulica
            </h3>
          </div>
          
          <div className="flex h-3.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 p-0.5">
            <div className="bg-rose-500 h-full rounded-l-full" style={{ width: '25%' }} title="0 a 50 PSI (Crítico)"></div>
            <div className="bg-emerald-500 h-full" style={{ width: '50%' }} title="50 a 140 PSI (Ideal Operável)"></div>
            <div className="bg-amber-500 h-full rounded-r-full" style={{ width: '25%' }} title="140 a 160 PSI (Sobrepressão)"></div>
          </div>
          
          <div className="flex justify-between font-mono text-[9.5px] font-bold text-slate-400 dark:text-slate-500 px-0.5">
            <span>0 PSI</span>
            <span>50 PSI</span>
            <span className="text-emerald-600 dark:text-emerald-400">100 PSI (MÍN)</span>
            <span className="text-emerald-600 dark:text-emerald-400">120 PSI (IDEAL)</span>
            <span className="text-amber-600 dark:text-amber-400">160 PSI (MAX)</span>
          </div>
        </div>

        <div className="md:col-span-4 text-center bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl relative shadow-2xs">
          <p className="font-mono text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">
            Manômetro Digital Central
          </p>
          <div className="flex items-baseline justify-center gap-1 my-1">
            <span className={`font-mono text-5xl font-black transition-all ${
              pressure < 110 ? 'text-amber-500' : 'text-emerald-600 dark:text-emerald-400'
            }`}>
              {pressure}
            </span>
            <span className="text-xs font-mono font-bold text-slate-400">PSI</span>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-sans flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            Conforme NBR 13714 & NBR 10897
          </p>
        </div>
      </div>

      {/* Grid de Bombas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {bombas.map((pump) => (
          <div 
            key={pump.id} 
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs relative overflow-hidden flex flex-col justify-between hover:shadow-md transition-all group"
          >
            <div className={`absolute top-0 bottom-0 left-0 w-1.5 ${
              pump.status === 'Operacional' || pump.status === 'Standby' ? 'bg-emerald-500' : 'bg-amber-500'
            }`}></div>
            
            <div className="pl-3">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-sans font-bold text-slate-800 dark:text-slate-100 text-base">{pump.name}</h4>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border capitalize ${
                  pump.status === 'Operacional' 
                    ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800' 
                    : 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800'
                }`}>
                  {pump.status}
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80 rounded-xl p-3">
                <p className="flex items-center gap-2">
                  <Sliders className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span><strong>Alimentação:</strong> {pump.power}</span>
                </p>
                <p className="flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span><strong>Faixa Operada:</strong> {pump.range}</span>
                </p>
                <p className="flex items-center gap-2">
                  <RotateCw className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span><strong>Partidas Registradas:</strong> {pump.starts}</span>
                </p>
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800/80 pt-3 mt-4 flex items-center justify-between pl-3">
              <button 
                type="button"
                onClick={() => triggerSuccessNotification(`Teste acionado para ${pump.name}`, `Acionamento remoto NBR do dispositivo efetuado com sucesso.`)} 
                className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 py-2 text-xs font-bold uppercase rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer flex items-center justify-center gap-1.5 transition-all shadow-2xs"
              >
                <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> Acionar Teste Remoto
              </button>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
