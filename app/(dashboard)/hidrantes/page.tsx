'use client';

import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { useSpci } from '@/app/context/SpciContext';
import DisintegrationOverlay from '@/app/components/DisintegrationOverlay';
import { 
  Droplets, 
  Plus, 
  ClipboardCheck, 
  History, 
  Bell, 
  Trash2, 
  MapPin, 
  Box, 
  Calendar,
  Sparkles,
  ShieldAlert
} from 'lucide-react';

export default function HidrantesPage() {
  const {
    hidrantes,
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

  const getCustomAttributes = (asset: any) => {
    const standardKeys = [
      'id', 'idAtivo', 'id_ativo', 'patrimonio', 'numero_patrimonio', 'numeroPatrimonio', 'cod_patrimonio', 'patrimonio_sugerido',
      'category', 'model', 'modelo', 'location', 'subLocation', 'sub_location', 'seloInmetro', 'selo_inmetro', 'selo_inmetro_anterior',
      'chassi', 'numero_serie', 'numeroSerie', 'serialNumber', 'peso', 'peso_capacidade', 'capacidade', 'capacidade_peso',
      'lastRecarga', 'data_ultima_recarga', 'ultima_recarga', 'recurrenceInterval', 'meses_validade_recarga', 'mes_ano_ultima_recarga', 'mes_ano_vencimento',
      'validadeRecarga', 'validade_recarga', 'validadeTesteHidro', 'data_vencimento_teste', 'status', 'status_estoque', 'statusEstoque',
      'tipo_movimentacao', 'tipoMovimentacao', 'statusConformidade', 'status_conformidade', 'geolocation', 'type', 'components',
      'lastInsp', 'nextInsp', 'group', 'systemType', 'qty', 'battery', 'autonomy', 'name', 'code', 'power', 'range', 'starts',
      'qr_code_hash', 'qrCodeHash', 'fotoUrl', 'foto_url', 'ultimoTesteHidro', 'anoFabricacao', 'ano_fabricacao', 'ano_ultimo_teste_hidro',
      'anoUltimoTesteHidro', 'created_at', 'updated_at', 'validadeRecargaMeses', 'data_pesagem_co2', 'details', 'lote_manutencao_atual_id',
      'fabricante', 'etiqueta_garantia', 'area', 'projeto', 'local', 'setor', 'tipo_equipamento', 'agente_extintor', 'sub_local', 'prateleira',
      'formattedRecarga', 'formattedVencimento', 'createdAt', 'updatedAt', 'loteId', 'lote_id'
    ];

    const formatLabel = (rawKey: string): string => {
      const clean = rawKey.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim();
      return clean.charAt(0).toUpperCase() + clean.slice(1);
    };

    return Object.keys(asset).filter(k => {
      if (standardKeys.includes(k)) return false;
      if (standardKeys.some(sk => sk.toLowerCase() === k.toLowerCase())) return false;
      const val = asset[k];
      return val !== null && val !== undefined && typeof val !== 'object' && String(val).trim() !== '' && String(val).trim() !== '---';
    }).map(k => ({ key: formatLabel(k), rawKey: k, value: String(asset[k]) }));
  };

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
            <span className="text-[10px] bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 px-2.5 py-0.5 rounded-full font-mono font-bold uppercase tracking-wider">
              SIGER HIDRANTES
            </span>
            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded font-mono font-bold">
              Site: {currentContratoId}
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Droplets className="w-6 h-6 text-sky-600" />
            Hidrantes & Abrigos Operacionais
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-sans">
            Acompanhamento de mangueiras (NBR 12779), válvulas angulares, chaves Storz e esguichos reguláveis
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button 
            type="button"
            onClick={() => { setShowAddForm(true); setNewAssetType('hidrante'); }} 
            className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-mono font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer border-none"
          >
            <Plus className="w-4 h-4" /> Novo Hidrante
          </button>
        </div>
      </div>

      {/* Grid de Cards de Hidrantes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {hidrantes.map((asset) => (
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
              themeColor="#0284c7"
            />
            
            <div className={`flex flex-col justify-between h-full w-full transition-all duration-300 ${
              deletingAssetId === asset.id ? 'opacity-0 scale-95 pointer-events-none' : ''
            }`}>
              <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${
                asset.status === 'Conforme' ? 'bg-emerald-500' : asset.status === 'Vencido' ? 'bg-rose-500' : 'bg-amber-500'
              }`}></div>
              
              <div className="p-5 pl-6">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="font-mono text-slate-400 dark:text-slate-500 text-xs font-semibold">HD: {asset.idAtivo}</span>
                    <h3 className="font-sans font-bold text-slate-800 dark:text-slate-100 text-base">Abrigo + Acessórios</h3>
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                    asset.status === 'Conforme' 
                      ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800' 
                      : asset.status === 'Vencido' 
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
                    <Box className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span><strong>Componentes:</strong> {Array.isArray(asset.components) ? asset.components.join(', ') : 'Válvula, Mangueira, Esguicho'}</span>
                  </p>
                  
                  {getCustomAttributes(asset).length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                      <p className="text-[8.5px] font-mono font-black text-sky-600 dark:text-sky-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-sky-500" />
                        Atributos SIGER IA
                      </p>
                      <div className="grid grid-cols-2 gap-1.5 text-[9px] font-mono bg-white dark:bg-slate-900/60 p-2 rounded-lg border border-slate-200/60 dark:border-slate-700/60 leading-tight">
                        {getCustomAttributes(asset).map((attr, idx) => (
                          <div key={idx} className="truncate flex items-center gap-1" title={`${attr.key}: ${attr.value}`}>
                            <span className="font-bold text-slate-500 dark:text-slate-400">{attr.key}:</span>
                            <span className="text-slate-800 dark:text-slate-200 font-semibold truncate">{attr.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-center border-t border-slate-100 dark:border-slate-800/80 pt-3 text-[10px]">
                  <div>
                    <p className="text-slate-400 dark:text-slate-500 uppercase font-black text-[9px] pb-0.5 tracking-wider">Último Teste</p>
                    <p className="font-semibold text-slate-700 dark:text-slate-200 font-mono">{asset.lastInsp || '---'}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 dark:text-slate-500 uppercase font-black text-[9px] pb-0.5 tracking-wider">Próximo Teste</p>
                    <p className={`font-semibold font-mono ${asset.status === 'Vencido' ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-700 dark:text-slate-200'}`}>
                      {asset.nextInsp || '---'}
                    </p>
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
                  onClick={() => { setSelectedAssetForHistory({ ...asset, type: 'hidrante' }); }} 
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
                      requestAssetDeletion(asset, 'hidrante', async () => {
                        setDeletingAssetId(asset.id);
                        await new Promise((resolve) => setTimeout(resolve, 1200));
                        await deleteAsset('hidrantes', asset.id);
                        setDeletingAssetId(null);
                      });
                    }} 
                    className="bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 p-2 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-900/40 cursor-pointer transition-all"
                    title="Excluir Hidrante"
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
