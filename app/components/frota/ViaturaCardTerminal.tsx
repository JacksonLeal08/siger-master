'use client';

import React, { useState } from 'react';
import { Viatura } from '@/lib/types/frota';
import { FuelPricingService } from '@/lib/services/FuelPricingService';
import { VehiclePhotoLightboxModal } from './VehiclePhotoLightboxModal';
import { 
  Truck, 
  Gauge, 
  Disc, 
  Maximize2, 
  CheckCircle2, 
  AlertTriangle,
  ChevronRight,
  Shield
} from 'lucide-react';

interface ViaturaCardTerminalProps {
  viatura: Viatura;
  theme?: 'light' | 'dark';
  onSelect: (viatura: Viatura) => void;
}

export const ViaturaCardTerminal: React.FC<ViaturaCardTerminalProps> = ({
  viatura,
  theme = 'dark',
  onSelect
}) => {
  const isDark = theme === 'dark';
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Validação de calibração TWI (ciclo padrão de 15 dias)
  const statusPneu = FuelPricingService.validarCalibracaoPneus(
    viatura.data_ultima_calibracao,
    15
  );

  const handlePhotoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viatura.foto_veiculo_url) {
      setIsLightboxOpen(true);
    }
  };

  const modeloExibicao = viatura.marca_modelo_crlv || `${viatura.marca} ${viatura.modelo}`.trim();

  return (
    <>
      <div
        onClick={() => onSelect(viatura)}
        className={`group relative overflow-hidden rounded-2xl p-4 transition-all duration-300 cursor-pointer select-none font-sans
          border shadow-lg active:scale-[0.98] hover:-translate-y-1 hover:shadow-2xl
          ${
            isDark
              ? 'bg-gradient-to-br from-zinc-800 via-zinc-900 to-zinc-950 border-zinc-800/80 border-t-zinc-700/60 text-zinc-100 shadow-black/40'
              : 'bg-gradient-to-br from-white via-slate-50 to-slate-100 border-slate-200 border-t-white text-slate-900 shadow-slate-300/50'
          }`}
      >
        {/* Chanfro Tridimensional no Topo (3D Depth Highlight) */}
        <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />

        {/* Faixa Tática Esquerda */}
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-red-600 group-hover:bg-red-500 transition-colors shadow-sm" />

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
          {/* ================================================================ */}
          {/* FOTO OFICIAL DA VIATURA (16:9 COM ZOOM FLUTUANTE) */}
          {/* ================================================================ */}
          <div 
            onClick={handlePhotoClick}
            className={`relative w-full sm:w-36 h-28 sm:h-24 rounded-xl overflow-hidden shrink-0 border transition-all duration-200 group/photo ${
              viatura.foto_veiculo_url 
                ? 'cursor-zoom-in hover:ring-2 hover:ring-red-500/80' 
                : 'cursor-pointer'
            } ${
              isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-200 border-slate-300'
            }`}
          >
            {viatura.foto_veiculo_url ? (
              <>
                <img
                  src={viatura.foto_veiculo_url}
                  alt={viatura.prefixo_frota}
                  className="w-full h-full object-cover group-hover/photo:scale-105 transition-transform duration-300"
                />
                {/* Gradiente sutil inferior */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-60 group-hover/photo:opacity-80 transition-opacity" />

                {/* Botão sutil de lupa / zoom */}
                <div className="absolute bottom-1.5 right-1.5 p-1 rounded-lg bg-black/60 backdrop-blur-sm text-white/90 border border-white/20 shadow-xs group-hover/photo:scale-110 transition-transform">
                  <Maximize2 className="w-3 h-3" />
                </div>
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500 gap-1 p-2 text-center">
                <Truck className="w-6 h-6 opacity-60" />
                <span className="text-[9px] font-mono uppercase font-bold opacity-60">Sem Foto Oficial</span>
              </div>
            )}

            {/* Badge de Tipo do Veículo sobre a Foto */}
            <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase font-mono tracking-wider bg-black/70 text-white backdrop-blur-xs border border-white/10">
              {viatura.tipo_veiculo}
            </div>
          </div>

          {/* ================================================================ */}
          {/* CORPO DO CARD COM INFORMAÇÕES TÉCNICAS */}
          {/* ================================================================ */}
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <h3 className={`text-base font-black font-mono tracking-tight uppercase truncate ${
                  isDark ? 'text-white group-hover:text-red-400' : 'text-slate-900 group-hover:text-red-600'
                } transition-colors`}>
                  {viatura.prefixo_frota}
                </h3>
                {viatura.modelo_plano_chave && (
                  <span className="hidden sm:inline-flex text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 uppercase">
                    PLANO FABRICANTE
                  </span>
                )}
              </div>

              {/* Placa Mercosul Estampada em Relevo Metálico */}
              <div className="w-24 sm:w-28 bg-white border-2 border-zinc-900 rounded-md overflow-hidden shadow-xs shrink-0 select-none">
                {/* Tarja Azul Superior com Brasil e Bandeira */}
                <div className="bg-[#003399] px-1 py-0.5 flex items-center justify-between text-white">
                  <span className="text-[6.5px] sm:text-[7px] font-black tracking-widest leading-none">
                    BRASIL
                  </span>
                  <div className="w-2.5 h-1.5 bg-emerald-600 rounded-[1px] relative flex items-center justify-center">
                    <div className="w-1.5 h-1 bg-yellow-400 transform rotate-45" />
                  </div>
                </div>
                {/* Placa em Preto Estampado */}
                <div className="text-center py-0.5 sm:py-1 bg-white">
                  <span className="text-[11px] sm:text-xs font-black font-mono tracking-widest text-zinc-950">
                    {viatura.placa}
                  </span>
                </div>
              </div>
            </div>

            {/* Descrição do Modelo / CRLV Oficial */}
            <p className={`text-xs font-medium line-clamp-1 ${
              isDark ? 'text-zinc-400' : 'text-slate-600'
            }`} title={modeloExibicao}>
              {modeloExibicao}
            </p>

            {/* Métricas: Hodômetro + Calibração TWI */}
            <div className="flex items-center gap-2 pt-1 flex-wrap text-[11px] font-mono">
              <div className={`flex items-center gap-1 px-2 py-0.5 rounded-lg border ${
                isDark ? 'bg-zinc-900/90 border-zinc-800 text-zinc-300' : 'bg-white border-slate-200 text-slate-700'
              }`}>
                <Gauge className="w-3 h-3 text-red-500" />
                <span className="font-bold">{(viatura.odometro_atual_km || 0).toLocaleString('pt-BR')} km</span>
              </div>

              {/* Indicador de Calibração TWI */}
              <div className={`flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] font-bold ${
                statusPneu.bloqueioObrigatorio
                  ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                  : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
              }`}>
                <Disc className="w-3 h-3" />
                <span>
                  {statusPneu.bloqueioObrigatorio 
                    ? 'Calibragem Pendente' 
                    : `Calibrado (${statusPneu.diasDesdeCalibracao}d)`}
                </span>
              </div>
            </div>
          </div>

          {/* Seta Indicativa à Direita */}
          <div className="hidden sm:flex items-center justify-center text-zinc-500 group-hover:text-red-500 group-hover:translate-x-1 transition-all">
            <ChevronRight className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Lightbox Flutuante Sem Bordas */}
      <VehiclePhotoLightboxModal
        isOpen={isLightboxOpen}
        photoUrl={viatura.foto_veiculo_url}
        prefixo={viatura.prefixo_frota}
        placa={viatura.placa}
        modelo={modeloExibicao}
        onClose={() => setIsLightboxOpen(false)}
      />
    </>
  );
};
