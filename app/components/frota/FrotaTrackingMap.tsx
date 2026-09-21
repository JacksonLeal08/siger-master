'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import 'leaflet/dist/leaflet.css';
import { 
  Viatura, 
  ViaturaTrackingTelemetry, 
  RankingPostoInfo 
} from '@/lib/types/frota';
import { getFrotaTrackingAction } from '@/app/actions/frotaActions';
import { 
  Compass, 
  Gauge, 
  Navigation, 
  Radio, 
  Fuel, 
  Car, 
  Cross, 
  Info, 
  MapPin, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  Layers, 
  Maximize2,
  ExternalLink,
  Shield,
  Clock
} from 'lucide-react';

interface FrotaTrackingMapProps {
  contratoId?: string;
  viaturasCadastradas?: Viatura[];
  onOpenAbastecimento?: (viatura: Viatura) => void;
  onOpenInspecaoPneus?: (viatura: Viatura) => void;
  onOpenOs?: (viatura: Viatura) => void;
}

export default function FrotaTrackingMap({
  contratoId = 'ONÇA PUMA',
  viaturasCadastradas = [],
  onOpenAbastecimento,
  onOpenInspecaoPneus,
  onOpenOs
}: FrotaTrackingMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const postosLayerRef = useRef<any>(null);

  const [telemetryData, setTelemetryData] = useState<ViaturaTrackingTelemetry[]>([]);
  const [postosData, setPostosData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTelemetry, setSelectedTelemetry] = useState<ViaturaTrackingTelemetry | null>(null);
  const [activePopupTab, setActivePopupTab] = useState<'info' | 'gps' | 'ocorrencia'>('info');
  const [filtroTipo, setFiltroTipo] = useState<'TODOS' | 'CAMINHONETE' | 'AMBULANCIA' | 'POSTOS'>('TODOS');
  const [mapStyle, setMapStyle] = useState<'streets' | 'satellite'>('streets');

  // Coordenadas centrais padrão (Parauapebas / Complexo Mineral)
  const defaultCenter: [number, number] = [-6.085417, -49.859307];

  // Carrega telemetria da frota
  const fetchTelemetry = async () => {
    try {
      setIsLoading(true);
      const res = await getFrotaTrackingAction(contratoId);
      if (res.success) {
        setTelemetryData(res.viaturas || []);
        setPostosData(res.postos || []);
        if (!selectedTelemetry && res.viaturas && res.viaturas.length > 0) {
          setSelectedTelemetry(res.viaturas[0]);
        }
      }
    } catch (err) {
      console.error('Erro ao carregar telemetria da frota:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 20000); // Polling de 20s
    return () => clearInterval(interval);
  }, [contratoId]);

  // Inicializa mapa Leaflet
  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return;

    let isSubscribed = true;

    import('leaflet').then((module) => {
      const L = module.default;
      if (!isSubscribed) return;

      if (!mapInstanceRef.current && mapContainerRef.current) {
        const map = L.map(mapContainerRef.current, {
          center: defaultCenter,
          zoom: 14,
          zoomControl: false,
          attributionControl: false
        });

        L.control.zoom({ position: 'bottomright' }).addTo(map);

        // Camada de Ruas OpenStreetMap
        const tileStreets = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19
        }).addTo(map);

        mapInstanceRef.current = map;
        markersLayerRef.current = L.layerGroup().addTo(map);
        postosLayerRef.current = L.layerGroup().addTo(map);
      }
    });

    return () => {
      isSubscribed = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Atualiza marcadores no mapa
  useEffect(() => {
    if (!mapInstanceRef.current || typeof window === 'undefined') return;

    import('leaflet').then((module) => {
      const L = module.default;
      const markersLayer = markersLayerRef.current;
      const postosLayer = postosLayerRef.current;

      if (!markersLayer || !postosLayer) return;

      markersLayer.clearLayers();
      postosLayer.clearLayers();

      // Renderiza Postos Georreferenciados ⛽
      if (filtroTipo === 'TODOS' || filtroTipo === 'POSTOS') {
        postosData.forEach((p) => {
          const postoHtml = `
            <div class="group relative flex flex-col items-center cursor-pointer transition-transform hover:scale-110">
              <div class="px-2 py-0.5 rounded-full bg-slate-900 text-white text-[9px] font-black tracking-wider uppercase border border-slate-700 shadow-md mb-1 whitespace-nowrap">
                ⛽ ${p.bandeira || 'POSTO'} • R$ ${(p.ultimoPrecoDieselS10 || 5.99).toFixed(2)}
              </div>
              <div class="w-8 h-8 rounded-full bg-blue-600 border-2 border-white shadow-xl flex items-center justify-center text-white text-xs">
                ⛽
              </div>
            </div>
          `;

          const postoIcon = L.divIcon({
            html: postoHtml,
            className: 'custom-posto-marker',
            iconSize: [40, 40],
            iconAnchor: [20, 35]
          });

          const m = L.marker([p.latitude, p.longitude], { icon: postoIcon }).addTo(postosLayer);
          m.bindTooltip(`<b>${p.nome}</b><br/>${p.endereco}`, { direction: 'top', offset: [0, -25] });
        });
      }

      // Renderiza Viaturas Vetoriais com Heading
      telemetryData.forEach((v) => {
        if (filtroTipo === 'CAMINHONETE' && v.tipo_veiculo !== 'CAMINHONETE') return;
        if (filtroTipo === 'AMBULANCIA' && v.tipo_veiculo !== 'AMBULANCIA') return;

        const isAmbulancia = v.tipo_veiculo === 'AMBULANCIA';
        const isEmTransito = v.status_movimento === 'em_transito';
        const statusColor = isEmTransito ? '#10b981' : '#f59e0b';

        // Marcador Vetorial Orientado ao Heading (Graus)
        const vehicleHtml = `
          <div class="flex flex-col items-center cursor-pointer select-none group">
            <!-- Tag da Empresa e Placa -->
            <div class="flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-950 text-white border border-slate-700 shadow-lg mb-1">
              <span class="text-[9px] font-black text-amber-400 uppercase tracking-wider">${v.empresa || 'OMEGA'}</span>
              <span class="text-[9px] font-bold text-slate-200 font-mono">${v.placa}</span>
            </div>

            <!-- Corpo Rotacionado pelo Heading -->
            <div style="transform: rotate(${v.heading_graus}deg); transition: transform 0.4s ease;" class="relative flex items-center justify-center">
              <div class="w-10 h-10 rounded-full bg-slate-900 border-2 ${isEmTransito ? 'border-emerald-400' : 'border-amber-400'} shadow-2xl flex items-center justify-center text-white relative">
                ${
                  isAmbulancia
                    ? `<svg class="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24"><path d="M19 10.5h-5.5V5h-3v5.5H5v3h5.5V19h3v-5.5H19v-3z"/></svg>`
                    : `<svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"/></svg>`
                }

                <!-- Seta de Projeção de Direção / Vetor -->
                <div class="absolute -top-1.5 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[6px] border-b-amber-400"></div>
              </div>

              <!-- Pulso de movimento se em trânsito -->
              ${
                isEmTransito
                  ? `<div class="absolute w-12 h-12 rounded-full border border-emerald-500 animate-ping opacity-70 pointer-events-none"></div>`
                  : ''
              }
            </div>

            <!-- Velocidade Instantânea -->
            <div class="mt-1 px-1.5 py-0.5 rounded bg-slate-900/90 text-white font-mono text-[9px] font-bold border border-slate-700">
              ${v.velocidade_kmh} km/h
            </div>
          </div>
        `;

        const icon = L.divIcon({
          html: vehicleHtml,
          className: 'custom-vehicle-marker',
          iconSize: [60, 70],
          iconAnchor: [30, 45]
        });

        const marker = L.marker([v.latitude, v.longitude], { icon }).addTo(markersLayer);
        marker.on('click', () => {
          setSelectedTelemetry(v);
        });
      });
    });
  }, [telemetryData, postosData, filtroTipo]);

  // Viatura correspondente do banco para enriquecer o popup
  const viaturaDbCorrespondente = useMemo(() => {
    if (!selectedTelemetry) return null;
    return viaturasCadastradas.find(
      (v) =>
        v.id === selectedTelemetry.viatura_id ||
        v.placa.replace(/[^A-Za-z0-9]/g, '') === selectedTelemetry.placa.replace(/[^A-Za-z0-9]/g, '')
    );
  }, [selectedTelemetry, viaturasCadastradas]);

  const centralizarNoVeiculo = (v: ViaturaTrackingTelemetry) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([v.latitude, v.longitude], 15, { duration: 1.2 });
      setSelectedTelemetry(v);
    }
  };

  return (
    <div className="relative w-full h-[620px] rounded-2xl overflow-hidden border border-slate-200 shadow-xl bg-slate-950 font-sans flex flex-col select-none">
      
      {/* BARRA SUPERIOR DO COCKPIT GIS */}
      <div className="absolute top-3 left-3 right-3 z-[1000] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Pills de Status & Contrato */}
        <div className="flex items-center gap-2 pointer-events-auto bg-slate-900/90 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-700 shadow-lg text-white">
          <div className="flex items-center gap-1.5 text-xs font-black text-red-500 tracking-wider uppercase">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            TELEMETRIA GIS FROTA
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 uppercase">
            {contratoId}
          </span>
          <span className="text-[10px] text-slate-400 font-mono">
            {telemetryData.length} Viaturas Ativas
          </span>
        </div>

        {/* Filtros de Visualização */}
        <div className="flex items-center gap-1.5 pointer-events-auto bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-700 shadow-lg">
          <button
            onClick={() => setFiltroTipo('TODOS')}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
              filtroTipo === 'TODOS' ? 'bg-red-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => setFiltroTipo('CAMINHONETE')}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
              filtroTipo === 'CAMINHONETE' ? 'bg-red-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            4x4
          </button>
          <button
            onClick={() => setFiltroTipo('AMBULANCIA')}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
              filtroTipo === 'AMBULANCIA' ? 'bg-red-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            Ambulâncias
          </button>
          <button
            onClick={() => setFiltroTipo('POSTOS')}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
              filtroTipo === 'POSTOS' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            Postos ⛽
          </button>
          <button
            onClick={fetchTelemetry}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer"
            title="Atualizar Telemetria"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* CONTAINER DO MAPA LEAFLET */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* CARD LATERAL EXECUTIVO / POPUP DA VIATURA SELECIONADA */}
      {selectedTelemetry && (
        <div className="absolute top-16 left-3 z-[1000] w-80 sm:w-96 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 shadow-2xl overflow-hidden transition-all duration-300">
          
          {/* Header do Card com Linha SPCI Vermelha */}
          <div className="h-1 w-full bg-gradient-to-r from-red-600 via-rose-600 to-red-600" />
          
          <div className="p-4 bg-slate-50/90 border-b border-slate-200 flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              {/* Foto Oficial do Veículo ou Ícone */}
              {selectedTelemetry.foto_veiculo_url || viaturaDbCorrespondente?.foto_veiculo_url ? (
                <img
                  src={selectedTelemetry.foto_veiculo_url || viaturaDbCorrespondente?.foto_veiculo_url || ''}
                  alt="Foto do Veículo"
                  className="w-14 h-14 rounded-xl object-cover border border-slate-300 shadow-xs"
                />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-slate-900 text-white flex flex-col items-center justify-center border border-slate-800 shadow-xs">
                  {selectedTelemetry.tipo_veiculo === 'AMBULANCIA' ? (
                    <Cross className="w-6 h-6 text-red-500" />
                  ) : (
                    <Car className="w-6 h-6 text-emerald-400" />
                  )}
                  <span className="text-[8px] font-black uppercase tracking-wider text-slate-400 mt-0.5">
                    {selectedTelemetry.prefixo}
                  </span>
                </div>
              )}

              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black font-mono px-2 py-0.5 rounded-md bg-slate-900 text-white border border-slate-800">
                    {selectedTelemetry.placa}
                  </span>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 uppercase tracking-wide">
                    {selectedTelemetry.empresa}
                  </span>
                </div>
                <h3 className="text-sm font-black text-slate-900 mt-1 uppercase">
                  {viaturaDbCorrespondente?.modelo || selectedTelemetry.prefixo}
                </h3>
                <p className="text-[10px] text-slate-500 font-medium">
                  {selectedTelemetry.tipo_veiculo === 'CAMINHONETE' ? 'CAMINHONETE 4X4 OPERACIONAL' : 'AMBULÂNCIA DE RESGATE 4X2'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setSelectedTelemetry(null)}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-200 transition-all cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* TELEMETRIA INSTANTÂNEA: 3 CARDS COMPACTOS */}
          <div className="p-3 bg-slate-100/70 border-b border-slate-200 grid grid-cols-3 gap-2 text-center">
            {/* Velocidade */}
            <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-center gap-1 text-[9px] font-bold text-slate-500 uppercase">
                <Gauge className="w-3 h-3 text-blue-600" /> Velocidade
              </div>
              <div className="text-sm font-black text-slate-900 font-mono mt-0.5">
                {selectedTelemetry.velocidade_kmh} <span className="text-[9px] font-normal">km/h</span>
              </div>
            </div>

            {/* Status Movimento */}
            <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-center gap-1 text-[9px] font-bold text-slate-500 uppercase">
                <Radio className="w-3 h-3 text-emerald-600" /> Status
              </div>
              <div className="text-[11px] font-black uppercase mt-0.5">
                {selectedTelemetry.status_movimento === 'em_transito' ? (
                  <span className="text-emerald-600 font-bold">Em Trânsito</span>
                ) : selectedTelemetry.status_movimento === 'ralenti' ? (
                  <span className="text-amber-600 font-bold">Ralenti</span>
                ) : (
                  <span className="text-slate-500 font-bold">Desligado</span>
                )}
              </div>
            </div>

            {/* Heading / Direção */}
            <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-center gap-1 text-[9px] font-bold text-slate-500 uppercase">
                <Compass className="w-3 h-3 text-rose-600" /> Direção
              </div>
              <div className="text-xs font-black text-slate-900 font-mono mt-0.5">
                {selectedTelemetry.heading_graus.toFixed(1)}°
              </div>
            </div>
          </div>

          {/* ABAS OPERACIONAIS: INFO | GPS | OCORRÊNCIA */}
          <div className="flex border-b border-slate-200 bg-slate-50">
            <button
              onClick={() => setActivePopupTab('info')}
              className={`flex-1 py-2 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                activePopupTab === 'info'
                  ? 'border-red-600 text-red-600 bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Info
            </button>
            <button
              onClick={() => setActivePopupTab('gps')}
              className={`flex-1 py-2 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                activePopupTab === 'gps'
                  ? 'border-red-600 text-red-600 bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              GPS
            </button>
            <button
              onClick={() => setActivePopupTab('ocorrencia')}
              className={`flex-1 py-2 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                activePopupTab === 'ocorrencia'
                  ? 'border-red-600 text-red-600 bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Ações & Pneus
            </button>
          </div>

          {/* CONTEÚDO DAS ABAS */}
          <div className="p-3.5 text-xs text-slate-700 max-h-48 overflow-y-auto">
            {activePopupTab === 'info' && (
              <div className="space-y-2 font-medium">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Prefixo Operacional:</span>
                  <span className="font-bold text-slate-900">{selectedTelemetry.prefixo}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Odômetro Atual:</span>
                  <span className="font-bold font-mono text-slate-900">
                    {viaturaDbCorrespondente?.odometro_atual_km || selectedTelemetry.odometro_km} KM
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Combustível:</span>
                  <span className="font-bold text-slate-900">
                    {viaturaDbCorrespondente?.tipo_combustivel || 'DIESEL S10'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Contrato / Planta:</span>
                  <span className="font-bold text-slate-900">
                    {viaturaDbCorrespondente?.contrato_id || contratoId}
                  </span>
                </div>
              </div>
            )}

            {activePopupTab === 'gps' && (
              <div className="space-y-2 font-mono text-[11px]">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-sans">Latitude:</span>
                  <span className="font-bold text-slate-900">{selectedTelemetry.latitude.toFixed(6)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-sans">Longitude:</span>
                  <span className="font-bold text-slate-900">{selectedTelemetry.longitude.toFixed(6)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-sans">Último Ping Telemetria:</span>
                  <span className="font-bold text-slate-900">Tempo Real (Online)</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500 font-sans">Base Operacional:</span>
                  <span className="font-bold text-slate-900 font-sans">Parauapebas / Complexo Mineral</span>
                </div>
              </div>
            )}

            {activePopupTab === 'ocorrencia' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-600" />
                    <div>
                      <div className="text-[10px] font-bold uppercase text-slate-500">Sulco Médio TWI</div>
                      <div className="text-xs font-black text-slate-900 font-mono">3.4 mm • Conforme</div>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    CONTRAN 558/80
                  </span>
                </div>

                {/* Botões Rápidos de Ação */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {viaturaDbCorrespondente && onOpenAbastecimento && (
                    <button
                      onClick={() => onOpenAbastecimento(viaturaDbCorrespondente)}
                      className="py-1.5 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Fuel className="w-3.5 h-3.5" /> + Abastecer
                    </button>
                  )}

                  {viaturaDbCorrespondente && onOpenInspecaoPneus && (
                    <button
                      onClick={() => onOpenInspecaoPneus(viaturaDbCorrespondente)}
                      className="py-1.5 px-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Gauge className="w-3.5 h-3.5" /> Medir Pneus
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Rodapé com Centralização no Mapa */}
          <div className="p-2.5 bg-slate-100/90 border-t border-slate-200 flex items-center justify-between">
            <button
              onClick={() => centralizarNoVeiculo(selectedTelemetry)}
              className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer"
            >
              <Navigation className="w-3.5 h-3.5" /> Focar neste veículo
            </button>
            <span className="text-[10px] text-slate-400 font-mono">ID: {selectedTelemetry.id}</span>
          </div>

        </div>
      )}

      {/* RODAPÉ DO MAPA GIS */}
      <div className="absolute bottom-3 left-3 z-[1000] flex items-center gap-2 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700 text-white text-[11px]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Rede de Rastreamento GIS Conectada</span>
        </div>
      </div>

    </div>
  );
}
