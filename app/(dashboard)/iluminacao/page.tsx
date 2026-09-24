'use client';

import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { useSpci } from '@/app/context/SpciContext';
import DisintegrationOverlay from '@/app/components/DisintegrationOverlay';
import { 
  Lightbulb, 
  Plus, 
  ClipboardCheck, 
  History, 
  Bell, 
  Trash2, 
  MapPin, 
  Zap, 
  BatteryCharging, 
  Clock, 
  ShieldCheck,
  AlertTriangle,
  XCircle,
  CheckCircle2
} from 'lucide-react';

export default function IluminacaoPage() {
  const {
    iluminacoes,
    saveAssetsList,
    deleteAsset,
    setShowAddForm,
    setNewAssetType,
    setSelectedAssetForInspection,
    setSelectedAssetForHistory,
    setPremiumAlert,
    userProfile,
    deletingAssetId,
    setDeletingAssetId,
    requestAssetDeletion,
    activeSite
  } = useSpci();

  const canDelete = userProfile?.role === 'Desenvolvedor' || userProfile?.role === 'Administrador';

  // Contrato operacional efetivo
  const currentContratoId = useMemo(() => {
    if (activeSite && !activeSite.startsWith('TODOS') && activeSite !== 'GLOBAL') {
      return activeSite;
    }
    return userProfile?.site && !userProfile.site.startsWith('TODOS') ? userProfile.site : 'SALOBO';
  }, [activeSite, userProfile]);

  const handleOpenAlertCenter = (asset: any) => {
    setPremiumAlert({
      show: true,
      title: 'Central de Emissão de Alertas Corporativos',
      message: 'Configure e despache alertas de vencimentos e relatórios para gestores de forma imediata via WhatsApp, Telegram ou Email.',
      type: 'critical',
      dispatchData: asset
    });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 select-none font-sans pb-16">
      {/* Header Executivo Cockpit */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-2.5 py-0.5 rounded-full font-mono font-bold uppercase tracking-wider">
              SIGER ILUMINAÇÃO
            </span>
            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded font-mono font-bold">
              Site: {currentContratoId}
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Lightbulb className="w-6 h-6 text-amber-500" />
            Iluminação de Emergência & Autonomia
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-sans">
            Registro de blocos autônomos, baterias, testes de autonomia (NBR 10898), centrais e motogeradores
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button 
            type="button"
            onClick={() => { setShowAddForm(true); setNewAssetType('iluminacao'); }} 
            className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-mono font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer border-none"
          >
            <Plus className="w-4 h-4" /> Nova Luminária
          </button>
        </div>
      </div>

      {/* Grid de KPIs de Iluminação */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { 
            title: 'Operacionais', 
            count: iluminacoes.filter(x => x.status === 'Operacional').length, 
            borderColor: 'border-l-emerald-500', 
            icon: CheckCircle2, 
            iconColor: 'text-emerald-500' 
          },
          { 
            title: 'Atenção Bateria', 
            count: iluminacoes.filter(x => x.status === 'Atenção').length, 
            borderColor: 'border-l-amber-500', 
            icon: AlertTriangle, 
            iconColor: 'text-amber-500' 
          },
          { 
            title: 'Falha de Carga', 
            count: iluminacoes.filter(x => x.status === 'Falha Carga').length, 
            borderColor: 'border-l-rose-500', 
            icon: XCircle, 
            iconColor: 'text-rose-500' 
          },
          { 
            title: 'Total Cadastrado', 
            count: iluminacoes.length, 
            borderColor: 'border-l-sky-500', 
            icon: Lightbulb, 
            iconColor: 'text-sky-500' 
          }
        ].map((sub, i) => {
          const IconComponent = sub.icon;
          return (
            <div 
              key={i} 
              className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs border-l-4 ${sub.borderColor} flex justify-between items-center`}
            >
              <div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-black font-sans">{sub.title}</p>
                <p className="text-2xl font-black font-mono text-slate-800 dark:text-slate-100 mt-0.5">{sub.count}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                <IconComponent className={`w-5 h-5 ${sub.iconColor}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Grid de Cards de Luminárias */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {iluminacoes.map((asset) => (
          <div 
            key={asset.id} 
            className={`transition-all duration-300 group flex flex-col justify-between rounded-2xl ${
              deletingAssetId === asset.id 
                ? 'border-transparent shadow-none bg-transparent overflow-visible' 
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all'
            }`}
          >
            <DisintegrationOverlay
              isActive={deletingAssetId === asset.id}
              themeColor="#f59e0b"
            />
            
            <div className={`flex flex-col justify-between h-full w-full transition-all duration-300 ${
              deletingAssetId === asset.id ? 'opacity-0 scale-95 pointer-events-none' : ''
            }`}>
              <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${
                asset.status === 'Operacional' ? 'bg-emerald-500' : asset.status === 'Falha Carga' ? 'bg-rose-500' : 'bg-amber-500'
              }`}></div>
              
              <div className="p-5 pl-6">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="font-mono text-slate-400 dark:text-slate-500 text-xs font-semibold">LUM: {asset.idAtivo}</span>
                    <h3 className="font-sans font-bold text-slate-800 dark:text-slate-100 text-base">{asset.model}</h3>
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                    asset.status === 'Operacional' 
                      ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800' 
                      : asset.status === 'Falha Carga' 
                        ? 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800' 
                        : 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800'
                  }`}>
                    {asset.status}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 mb-4 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800/80">
                  <p className="flex items-center gap-1.5 truncate">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span><strong>Local:</strong> {asset.location} - {asset.subLocation}</span>
                  </p>
                  <p className="flex items-center gap-1.5 truncate">
                    <Zap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span><strong>Sistema:</strong> {asset.systemType}</span>
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center border-t border-slate-100 dark:border-slate-800/80 pt-3 text-[10px]">
                  <div className="flex items-center justify-center gap-1.5">
                    <BatteryCharging className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-slate-500 dark:text-slate-400">Carga:</span>
                    <strong className="text-slate-800 dark:text-slate-200 font-mono">{asset.battery || '100%'}</strong>
                  </div>
                  <div className="flex items-center justify-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-slate-500 dark:text-slate-400">Autonomia:</span>
                    <strong className="text-slate-800 dark:text-slate-200 font-mono">{asset.autonomy || '2h'}</strong>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30 p-3 flex items-center justify-between gap-2 overflow-x-auto shrink-0 rounded-b-2xl">
                <button 
                  type="button"
                  onClick={() => { setSelectedAssetForInspection(asset); }} 
                  className="flex-1 text-center bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase py-2 tracking-wider rounded-lg border-none cursor-pointer flex items-center justify-center gap-1.5 transition-all shadow-xs"
                >
                  <ClipboardCheck className="w-3.5 h-3.5" /> Inspecionar
                </button>
                <button 
                  type="button"
                  onClick={() => { setSelectedAssetForHistory({ ...asset, type: 'iluminacao' }); }} 
                  className="border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold px-2.5 py-1.5 rounded-lg text-[10px] uppercase flex items-center gap-1 shrink-0 bg-white dark:bg-slate-900 cursor-pointer transition-all" 
                  title="Ver Histórico NBR"
                >
                  <History className="w-3.5 h-3.5 text-slate-400" /> Histórico
                </button>
                <button 
                  type="button"
                  onClick={() => handleOpenAlertCenter(asset)} 
                  className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 border-none cursor-pointer transition-all" 
                  title="Alerta Corporativo"
                >
                  <Bell className="w-3.5 h-3.5" />
                </button>
                {canDelete && (
                  <button 
                    type="button"
                    onClick={() => {
                      requestAssetDeletion(asset, 'iluminacao', async () => {
                        setDeletingAssetId(asset.id);
                        await new Promise((resolve) => setTimeout(resolve, 1200));
                        await deleteAsset('iluminacao', asset.id);
                        setDeletingAssetId(null);
                      });
                    }} 
                    className="bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 p-2 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-900/40 cursor-pointer transition-all"
                    title="Excluir Luminária"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
