'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Truck,
  Fuel,
  MapPin,
  Camera,
  AlertTriangle,
  CheckCircle2,
  Disc,
  Wifi,
  WifiOff,
  Search,
  ArrowLeft,
  DollarSign,
  Gauge,
  Calendar,
  Layers,
  Sparkles,
  CloudUpload,
  RefreshCw,
  X,
  Radio,
  ChevronRight,
  ShieldCheck,
  Check,
  Info
} from 'lucide-react';
import { Viatura, TipoCombustivel, TipoVeiculo } from '@/lib/types/frota';
import { listViaturasAction, registrarAbastecimentoAction } from '@/app/actions/frotaActions';
import { FuelPricingService } from '@/lib/services/FuelPricingService';
import { FleetLoadingScreen } from '@/app/components/frota/FleetLoadingScreen';
import { terminalOfflineSync, QueuedAbastecimento } from '@/lib/services/terminalOfflineSync';

// Tipos de Categorias com Ícones para as Pílulas Horizontais
const CATEGORIAS_PILULAS: { id: string; label: string; icon: string }[] = [
  { id: 'TODOS', label: 'Todos', icon: '🚙' },
  { id: 'AMBULANCIA', label: 'Ambulâncias', icon: '🚑' },
  { id: 'CAMINHONETE', label: 'Caminhonetes 4x4', icon: '🛻' },
  { id: 'CAMINHAO_INCENDIO', label: 'Combate / Resgate', icon: '🚒' },
  { id: 'UTILITARIO', label: 'Apoio', icon: '🚐' },
];

const POSTOS_SUGERIDOS_REGIAO = [
  'Posto Ipiranga - Rota Sul',
  'Posto Petrobras - Salobo Central',
  'Posto Shell - Rodovia PA-275',
  'Posto Vale Verde - Mina Salobo',
  'Auto Posto Brasil - Parauapebas',
  'Posto Pioneiro - Serra dos Carajás',
];

function TerminalAbastecerContent() {
  const searchParams = useSearchParams();
  const contratoQuery = searchParams?.get('contrato') || 'SALOBO';
  const contratoNome = contratoQuery.toUpperCase();

  // Etapas do Fluxo Operacional:
  // 1: LOADING (FleetLoadingScreen)
  // 2: CATALOG (Catálogo de Viaturas)
  // 3: FORM (Formulário de Abastecimento com GPS e Trava)
  // 4: SUCCESS (Confirmação com Recibo Digital)
  const [etapa, setEtapa] = useState<'LOADING' | 'CATALOG' | 'FORM' | 'SUCCESS'>('LOADING');

  // Estado de Conectividade e Fila
  const [isOnline, setIsOnline] = useState(true);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  // Lista de Viaturas & Filtros
  const [viaturas, setViaturas] = useState<Viatura[]>([]);
  const [isLoadingViaturas, setIsLoadingViaturas] = useState(true);
  const [filtroCategoria, setFiltroCategoria] = useState('TODOS');
  const [termoBusca, setTermoBusca] = useState('');

  // Viatura Selecionada para Abastecimento
  const [selectedViatura, setSelectedViatura] = useState<Viatura | null>(null);

  // Campos do Formulário
  const [condutor, setCondutor] = useState('Condutor de Plantão');
  const [posto, setPosto] = useState('Posto Petrobras - Salobo Central');
  const [tipoCombustivel, setTipoCombustivel] = useState<TipoCombustivel>('DIESEL_S10');
  const [litros, setLitros] = useState('60');
  const [valorTotal, setValorTotal] = useState('360.00');
  const [odometro, setOdometro] = useState('');
  
  // Geoposicionamento (Zero-Touch GPS)
  const [geoLoc, setGeoLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [geoStatus, setGeoStatus] = useState('Capturando GPS...');

  // Calibração e Fotos
  const [houveCalibracao, setHouveCalibracao] = useState(false);
  const [fotoCalibrador, setFotoCalibrador] = useState<string | null>(null);
  const [fotoCupom, setFotoCupom] = useState<string | null>(null);

  // Estados de Envio
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [erroValidacao, setErroValidacao] = useState<string | null>(null);
  const [ultimoRegistroGravado, setUltimoRegistroGravado] = useState<{
    placa: string;
    prefixo: string;
    litros: string;
    valor: string;
    isOffline: boolean;
  } | null>(null);

  // Sugestões de Postos em cache
  const [postosDisponiveis, setPostosDisponiveis] = useState<string[]>(POSTOS_SUGERIDOS_REGIAO);

  // 1. Inicializa listeners de rede (Online/Offline) e fila IndexedDB
  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsOnline(navigator.onLine);

    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Inicializa o sync de background do IndexedDB
    const removeSyncListener = terminalOfflineSync.initOfflineSyncListeners((syncedCount) => {
      terminalOfflineSync.getPendingQueue().then((q) => setPendingSyncCount(q.length));
    });

    // Carrega contador inicial da fila
    terminalOfflineSync.getPendingQueue().then((q) => setPendingSyncCount(q.length));

    // Carrega postos em cache
    terminalOfflineSync.getCachedPostos().then((cached) => {
      if (cached && cached.length > 0) {
        setPostosDisponiveis(Array.from(new Set([...cached, ...POSTOS_SUGERIDOS_REGIAO])));
      }
    });

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      removeSyncListener();
    };
  }, []);

  // 2. Carrega Viaturas (com fallback automático para cache IndexedDB)
  const carregarViaturas = async () => {
    setIsLoadingViaturas(true);
    try {
      if (navigator.onLine) {
        const res = await listViaturasAction(contratoNome);
        if (res.success && res.data && res.data.length > 0) {
          setViaturas(res.data);
          await terminalOfflineSync.cacheViaturas(res.data);
          setIsLoadingViaturas(false);
          return;
        }
      }
      // Se estiver offline ou a API falhar, recupera do IndexedDB
      const cached = await terminalOfflineSync.getCachedViaturas(contratoNome);
      setViaturas(cached);
    } catch (err) {
      console.warn('Falha ao carregar viaturas online, buscando cache...', err);
      const cached = await terminalOfflineSync.getCachedViaturas(contratoNome);
      setViaturas(cached);
    } finally {
      setIsLoadingViaturas(false);
    }
  };

  useEffect(() => {
    carregarViaturas();
  }, [contratoNome]);

  // 3. Captura Zero-Touch de GPS com alta precisão
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = parseFloat(position.coords.latitude.toFixed(6));
          const lng = parseFloat(position.coords.longitude.toFixed(6));
          setGeoLoc({ lat, lng });
          setGeoStatus(`GPS Ativo: ${lat}, ${lng} (±${Math.round(position.coords.accuracy)}m)`);
        },
        (error) => {
          console.warn('GPS indisponível:', error.message);
          setGeoStatus('GPS indisponível / Posto manual');
        },
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }
      );
    }
  }, [selectedViatura]);

  // Filtro de viaturas por Categoria e Busca Debounced
  const viaturasFiltradas = useMemo(() => {
    return viaturas.filter((v) => {
      const matchCategoria =
        filtroCategoria === 'TODOS' ||
        v.tipo_veiculo === filtroCategoria;

      const termo = termoBusca.trim().toLowerCase();
      const matchBusca =
        !termo ||
        v.placa.toLowerCase().includes(termo) ||
        v.prefixo_frota.toLowerCase().includes(termo) ||
        (v.modelo && v.modelo.toLowerCase().includes(termo));

      return matchCategoria && matchBusca;
    });
  }, [viaturas, filtroCategoria, termoBusca]);

  // Status de calibração da viatura selecionada
  const statusCalibracaoViatura = useMemo(() => {
    if (!selectedViatura) return null;
    return FuelPricingService.validarCalibracaoPneus(selectedViatura.data_ultima_calibracao, 15);
  }, [selectedViatura]);

  // Cálculo Dinâmico de R$ / Litro
  const precoCalculadoPorLitro = useMemo(() => {
    const l = parseFloat(litros) || 0;
    const t = parseFloat(valorTotal) || 0;
    if (l <= 0 || t <= 0) return '0.00';
    return (t / l).toFixed(2);
  }, [litros, valorTotal]);

  // Validação Estrita do Odômetro
  const odometroAtualValido = useMemo(() => {
    if (!selectedViatura) return true;
    const kmDigitado = parseFloat(odometro);
    const kmAnterior = selectedViatura.odometro_atual_km || 0;
    if (!odometro || isNaN(kmDigitado)) return false;
    return kmDigitado > kmAnterior;
  }, [odometro, selectedViatura]);

  // Bloqueio de Envio por Trava Quinzenal de Calibração
  const bloqueadoPorCalibracao = useMemo(() => {
    if (!statusCalibracaoViatura?.bloqueioObrigatorio) return false;
    return !houveCalibracao || !fotoCalibrador;
  }, [statusCalibracaoViatura, houveCalibracao, fotoCalibrador]);

  // Selecionar Viatura e avançar para o formulário
  const handleSelectViatura = (v: Viatura) => {
    setSelectedViatura(v);
    setTipoCombustivel(v.tipo_combustivel || 'DIESEL_S10');
    setOdometro(String((v.odometro_atual_km || 0) + 120));
    setHouveCalibracao(false);
    setFotoCalibrador(null);
    setFotoCupom(null);
    setErroValidacao(null);
    setEtapa('FORM');
  };

  // Upload da foto do Cupom Fiscal
  const handleFotoCupomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setFotoCupom(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // Upload da foto do Manômetro de Calibração
  const handleFotoCalibradorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setFotoCalibrador(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // Submissão do Abastecimento
  const handleSubmitAbastecimento = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroValidacao(null);

    if (!selectedViatura) {
      setErroValidacao('Selecione uma viatura válida.');
      return;
    }

    const kmDigitado = parseFloat(odometro);
    const kmAnterior = selectedViatura.odometro_atual_km || 0;
    if (isNaN(kmDigitado) || kmDigitado <= kmAnterior) {
      setErroValidacao(
        `O hodômetro deve ser estritamente maior que o último registro (${kmAnterior.toLocaleString(
          'pt-BR'
        )} km).`
      );
      return;
    }

    if (bloqueadoPorCalibracao) {
      setErroValidacao(
        'Bloqueio Ativo: A calibração de pneus está vencida há mais de 15 dias. Marque a confirmação e anexe a foto do manômetro.'
      );
      return;
    }

    const litrosNum = parseFloat(litros);
    const totalNum = parseFloat(valorTotal);
    const precoLitroNum = parseFloat(precoCalculadoPorLitro);

    if (!litrosNum || litrosNum <= 0) {
      setErroValidacao('Informe a quantidade de litros abastecida.');
      return;
    }

    if (!totalNum || totalNum <= 0) {
      setErroValidacao('Informe o valor total da nota fiscal.');
      return;
    }

    setIsSubmitting(true);

    const payload = {
      contrato_id: contratoNome,
      viatura_id: selectedViatura.id,
      posto: posto.trim(),
      nome_posto: posto.trim(),
      tipo_combustivel: tipoCombustivel,
      litros: litrosNum,
      valor_litro: precoLitroNum,
      valor_total: totalNum,
      odometro_km: kmDigitado,
      condutor_nome: condutor.trim(),
      houve_calibracao_pneus: houveCalibracao,
      foto_calibracao_url: fotoCalibrador,
      foto_cupom_url: fotoCupom,
      latitude_posto: geoLoc?.lat,
      longitude_posto: geoLoc?.lng,
      tipoVeiculo: selectedViatura.tipo_veiculo,
    };

    try {
      if (navigator.onLine) {
        // Envio online direto via Server Action
        const res = await registrarAbastecimentoAction(payload, selectedViatura.tipo_veiculo);

        if (res.success) {
          // Atualiza lista em cache dos postos
          await terminalOfflineSync.cachePostos([posto.trim()]);

          // Atualiza a viatura no estado local
          setViaturas((prev) =>
            prev.map((v) =>
              v.id === selectedViatura.id
                ? {
                    ...v,
                    odometro_atual_km: kmDigitado,
                    data_ultima_calibracao: houveCalibracao
                      ? new Date().toISOString()
                      : v.data_ultima_calibracao,
                  }
                : v
            )
          );

          setUltimoRegistroGravado({
            placa: selectedViatura.placa,
            prefixo: selectedViatura.prefixo_frota,
            litros: litrosNum.toFixed(1),
            valor: totalNum.toFixed(2),
            isOffline: false,
          });

          setEtapa('SUCCESS');
        } else {
          // Falha de validação do servidor
          throw new Error(res.error || 'Falha ao registrar abastecimento.');
        }
      } else {
        // Modo Offline: Gravação transparente no IndexedDB
        await terminalOfflineSync.enqueueAbastecimento(payload);
        setPendingSyncCount((prev) => prev + 1);

        setUltimoRegistroGravado({
          placa: selectedViatura.placa,
          prefixo: selectedViatura.prefixo_frota,
          litros: litrosNum.toFixed(1),
          valor: totalNum.toFixed(2),
          isOffline: true,
        });

        setEtapa('SUCCESS');
      }
    } catch (err: any) {
      console.warn('Tentando enfileirar offline devido a erro de rede:', err);
      // Se falhou por instabilidade de rede mesmo com navigator.onLine == true
      try {
        await terminalOfflineSync.enqueueAbastecimento(payload);
        setPendingSyncCount((prev) => prev + 1);

        setUltimoRegistroGravado({
          placa: selectedViatura.placa,
          prefixo: selectedViatura.prefixo_frota,
          litros: litrosNum.toFixed(1),
          valor: totalNum.toFixed(2),
          isOffline: true,
        });

        setEtapa('SUCCESS');
      } catch (offlineErr: any) {
        setErroValidacao(offlineErr?.message || err?.message || 'Erro ao gravar registro.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================================================
  // ETAPA 1: TELA DE ABERTURA TEMÁTICA (IGNIÇÃO / TELEMETRIA)
  // ============================================================================
  if (etapa === 'LOADING') {
    return (
      <FleetLoadingScreen
        contratoNome={contratoNome}
        onComplete={() => setEtapa('CATALOG')}
        minDurationMs={2600}
        skipable={true}
      />
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans flex flex-col items-center justify-start pb-safe pt-safe selection:bg-red-500 selection:text-white">
      {/* Background sutil com vinheta esportiva */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-black pointer-events-none" />

      {/* Container Mobile App Shell */}
      <div className="relative z-10 w-full max-w-lg min-h-screen flex flex-col bg-zinc-950 border-x border-zinc-900/80 shadow-2xl">
        
        {/* ==================================================================== */}
        {/* BARRA SUPERIOR FIXA (APP SHELL HEADER) */}
        {/* ==================================================================== */}
        <header className="sticky top-0 z-30 px-4 py-3.5 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {etapa === 'FORM' && (
              <button
                type="button"
                onClick={() => setEtapa('CATALOG')}
                className="p-1.5 -ml-1 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 active:scale-95 transition-all"
                title="Voltar ao catálogo"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}

            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-black tracking-widest text-red-500 uppercase">
                    SPCI // TERMINAL
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-zinc-900 border border-zinc-800 font-bold text-zinc-300">
                    SITE: {contratoNome}
                  </span>
                </div>
                <h1 className="text-xs font-black text-white tracking-wide uppercase">
                  {etapa === 'FORM' ? 'Registro de Abastecimento' : 'Catálogo de Viaturas'}
                </h1>
              </div>
            </div>
          </div>

          {/* Badge de Conectividade e Fila */}
          <div className="flex items-center gap-2">
            {pendingSyncCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                <RefreshCw className="w-3 h-3 animate-spin" />
                {pendingSyncCount} pendente{pendingSyncCount > 1 ? 's' : ''}
              </span>
            )}

            <div
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase border transition-colors ${
                isOnline
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              }`}
            >
              {isOnline ? (
                <>
                  <Wifi className="w-3 h-3" />
                  <span>ONLINE</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3" />
                  <span>OFFLINE</span>
                </>
              )}
            </div>
          </div>
        </header>

        {/* ==================================================================== */}
        {/* ETAPA 2: CATÁLOGO DE VIATURAS */}
        {/* ==================================================================== */}
        {etapa === 'CATALOG' && (
          <main className="flex-1 p-4 space-y-4">
            {/* Barra de Pesquisa com Debounce */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                value={termoBusca}
                onChange={(e) => setTermoBusca(e.target.value)}
                placeholder="Buscar por placa (ex: BRA2E19) ou prefixo..."
                className="w-full pl-10 pr-9 py-2.5 bg-zinc-900/90 border border-zinc-800 rounded-2xl text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-red-500/60 transition-colors"
              />
              {termoBusca && (
                <button
                  onClick={() => setTermoBusca('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Seletor de Categorias por Pílulas Horizontais */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar select-none">
              {CATEGORIAS_PILULAS.map((cat) => {
                const isActive = filtroCategoria === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setFiltroCategoria(cat.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all active:scale-95 ${
                      isActive
                        ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                        : 'bg-zinc-900 hover:bg-zinc-850 text-zinc-400 border border-zinc-800/80 hover:text-zinc-200'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Contagem e Status */}
            <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500 px-1">
              <span>
                {viaturasFiltradas.length} viatura{viaturasFiltradas.length !== 1 ? 's' : ''} encontrada{viaturasFiltradas.length !== 1 ? 's' : ''}
              </span>
              <span>TOQUE PARA ABASTECER</span>
            </div>

            {/* Listagem de Cards Táteis */}
            {isLoadingViaturas ? (
              <div className="p-8 text-center space-y-3">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-red-500" />
                <p className="text-xs text-zinc-400 font-mono">Carregando frota operacional...</p>
              </div>
            ) : viaturasFiltradas.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-zinc-900/40 border border-zinc-800/80 space-y-2">
                <Truck className="w-8 h-8 text-zinc-600 mx-auto" />
                <p className="text-xs font-bold text-zinc-300">Nenhuma viatura localizada</p>
                <p className="text-[11px] text-zinc-500">
                  Tente alterar os termos da busca ou selecione outra categoria.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {viaturasFiltradas.map((v) => {
                  const statusPneu = FuelPricingService.validarCalibracaoPneus(
                    v.data_ultima_calibracao,
                    15
                  );

                  return (
                    <div
                      key={v.id}
                      onClick={() => handleSelectViatura(v)}
                      className="group p-4 rounded-2xl bg-zinc-900/70 hover:bg-zinc-900 border border-zinc-800/90 hover:border-zinc-700 shadow-lg transition-all duration-200 cursor-pointer active:scale-[0.99] flex flex-col gap-3 relative overflow-hidden"
                    >
                      {/* Faixa decorativa lateral */}
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-600/80 group-hover:bg-red-500 transition-colors" />

                      <div className="flex items-start justify-between gap-3">
                        {/* Informações da Viatura */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black font-mono tracking-tight text-white group-hover:text-red-400 transition-colors">
                              {v.prefixo_frota}
                            </span>
                            <span className="text-[9px] px-2 py-0.5 rounded-md font-mono bg-zinc-800 text-zinc-300 uppercase font-bold border border-zinc-700/60">
                              {v.tipo_veiculo}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-400 font-medium line-clamp-1">
                            {v.marca} {v.modelo}
                          </p>
                          <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-mono">
                            <Gauge className="w-3.5 h-3.5 text-zinc-500" />
                            <span>{(v.odometro_atual_km || 0).toLocaleString('pt-BR')} km</span>
                          </div>
                        </div>

                        {/* Placa Padrão Mercosul Estampada */}
                        <div className="w-28 bg-white border-2 border-zinc-900 rounded-md overflow-hidden shadow-sm shrink-0 select-none">
                          {/* Tarja Azul Superior */}
                          <div className="bg-[#003399] px-1 py-0.5 flex items-center justify-between text-white">
                            <span className="text-[7px] font-black tracking-widest leading-none">
                              BRASIL
                            </span>
                            {/* Bandeira estilizada */}
                            <div className="w-2.5 h-1.5 bg-emerald-600 rounded-[1px] relative flex items-center justify-center">
                              <div className="w-1.5 h-1 bg-yellow-400 transform rotate-45" />
                            </div>
                          </div>
                          {/* Placa em Preto */}
                          <div className="text-center py-1 bg-white">
                            <span className="text-xs font-black font-mono tracking-widest text-zinc-900">
                              {v.placa}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Rodapé do Card com Status de Calibração */}
                      <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between text-xs">
                        {statusPneu.bloqueioObrigatorio ? (
                          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-rose-400">
                            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                            <span>⚠️ Calibração Vencida ({statusPneu.diasDesdeCalibracao}d)</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400">
                            <Disc className="w-3.5 h-3.5 text-emerald-400" />
                            <span>
                              Calibração OK ({Math.max(0, 15 - statusPneu.diasDesdeCalibracao)}d restantes)
                            </span>
                          </div>
                        )}

                        <span className="text-xs font-bold text-red-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                          Abastecer <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        )}

        {/* ==================================================================== */}
        {/* ETAPA 3: FORMULÁRIO DE ABASTECIMENTO COM GPS & TRAVA */}
        {/* ==================================================================== */}
        {etapa === 'FORM' && selectedViatura && (
          <main className="flex-1 p-4 space-y-4">
            {/* Card da Viatura Selecionada */}
            <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[10px] font-mono uppercase text-zinc-500 font-bold">
                  Viatura em Atendimento
                </span>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black text-white font-mono">
                    {selectedViatura.prefixo_frota}
                  </h2>
                  <span className="text-xs text-zinc-400">
                    {selectedViatura.marca} {selectedViatura.modelo}
                  </span>
                </div>
                <p className="text-[11px] font-mono text-zinc-400">
                  Último Km: <span className="text-white font-bold">{(selectedViatura.odometro_atual_km || 0).toLocaleString('pt-BR')} km</span>
                </p>
              </div>

              {/* Placa Mercosul Estampada */}
              <div className="w-24 bg-white border-2 border-zinc-900 rounded-md overflow-hidden shadow-sm shrink-0">
                <div className="bg-[#003399] px-1 py-0.5 flex items-center justify-between text-white">
                  <span className="text-[6px] font-black tracking-widest leading-none">BRASIL</span>
                  <div className="w-2 h-1 bg-emerald-600 rounded-[1px]" />
                </div>
                <div className="text-center py-0.5 bg-white">
                  <span className="text-[11px] font-black font-mono tracking-widest text-zinc-900">
                    {selectedViatura.placa}
                  </span>
                </div>
              </div>
            </div>

            {/* Zero-Touch GPS Telemetria */}
            <div className="px-3.5 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex items-center gap-2.5 text-xs text-zinc-400 font-mono">
              <MapPin className="w-4 h-4 text-cyan-400 shrink-0 animate-pulse" />
              <span className="truncate">{geoStatus}</span>
            </div>

            {/* Mensagem de Erro / Alerta */}
            {erroValidacao && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs text-rose-300 font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{erroValidacao}</span>
              </div>
            )}

            {/* ================================================================ */}
            {/* TRAVA OBRIGATÓRIA DE CALIBRAÇÃO DE PNEUS (> 15 DIAS) */}
            {/* ================================================================ */}
            {statusCalibracaoViatura?.bloqueioObrigatorio && (
              <div className="p-4 rounded-2xl bg-rose-950/40 border-2 border-rose-600/80 space-y-3">
                <div className="flex items-start gap-2.5">
                  <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 shrink-0 mt-0.5">
                    <Disc className="w-5 h-5 animate-spin" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-rose-200 uppercase tracking-wide">
                      Trava de Segurança: Calibração Vencida
                    </h3>
                    <p className="text-[11px] text-rose-300 mt-0.5 leading-relaxed">
                      Esta viatura está há <span className="font-bold underline">{statusCalibracaoViatura.diasDesdeCalibracao} dias</span> sem registro de calibração (limite de 15 dias). O envio só é permitido mediante calibragem imediata dos pneus.
                    </p>
                  </div>
                </div>

                {/* Checkbox de Confirmação */}
                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-rose-900/30 border border-rose-800/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={houveCalibracao}
                    onChange={(e) => setHouveCalibracao(e.target.checked)}
                    className="w-4 h-4 rounded text-red-600 focus:ring-red-500 bg-zinc-900 border-zinc-700"
                  />
                  <span className="text-xs font-bold text-rose-100">
                    Confirmo que os 4 pneus + estepe foram calibrados no posto
                  </span>
                </label>

                {/* Upload Foto do Manômetro */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase font-bold text-rose-300">
                    Foto Obrigatória do Manômetro / Calibrador:
                  </label>
                  
                  {fotoCalibrador ? (
                    <div className="relative rounded-xl overflow-hidden border border-rose-600 max-h-40">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={fotoCalibrador}
                        alt="Comprovante de Calibragem"
                        className="w-full h-36 object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setFotoCalibrador(null)}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 text-white hover:bg-black"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-rose-500/50 hover:border-rose-400 rounded-xl bg-rose-900/20 cursor-pointer text-center">
                      <Camera className="w-6 h-6 text-rose-400 mb-1" />
                      <span className="text-xs font-bold text-rose-200">
                        Fotografar Manômetro do Posto
                      </span>
                      <span className="text-[10px] text-rose-400 mt-0.5">
                        Tirar foto com a câmera do celular
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleFotoCalibradorChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>
            )}

            {/* FORMULÁRIO DE ENTRADA */}
            <form onSubmit={handleSubmitAbastecimento} className="space-y-4">
              {/* Condutor */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono uppercase font-bold text-zinc-400">
                  Nome do Condutor / Socorrista:
                </label>
                <input
                  type="text"
                  required
                  value={condutor}
                  onChange={(e) => setCondutor(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-red-500"
                />
              </div>

              {/* Hodômetro Atual com Validação */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-mono uppercase font-bold text-zinc-400">
                    Hodômetro Atual (Km do Painel):
                  </label>
                  <span className="text-[10px] font-mono text-zinc-500">
                    Anterior: {(selectedViatura.odometro_atual_km || 0).toLocaleString('pt-BR')} km
                  </span>
                </div>
                <div className="relative">
                  <Gauge className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="number"
                    step="1"
                    required
                    value={odometro}
                    onChange={(e) => setOdometro(e.target.value)}
                    placeholder={`Ex: ${(selectedViatura.odometro_atual_km || 0) + 150}`}
                    className={`w-full pl-10 pr-4 py-2.5 bg-zinc-900 border rounded-xl text-xs font-mono font-bold text-white focus:outline-none ${
                      !odometroAtualValido && odometro
                        ? 'border-rose-500 text-rose-300'
                        : 'border-zinc-800 focus:border-red-500'
                    }`}
                  />
                </div>
                {!odometroAtualValido && odometro && (
                  <p className="text-[10px] text-rose-400 font-mono">
                    ⚠️ O valor deve ser maior que {(selectedViatura.odometro_atual_km || 0).toLocaleString('pt-BR')} km.
                  </p>
                )}
              </div>

              {/* Posto de Combustível */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono uppercase font-bold text-zinc-400">
                  Nome do Posto:
                </label>
                <input
                  type="text"
                  required
                  list="postos-list"
                  value={posto}
                  onChange={(e) => setPosto(e.target.value)}
                  placeholder="Nome do posto conveniado..."
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-red-500"
                />
                <datalist id="postos-list">
                  {postosDisponiveis.map((p, idx) => (
                    <option key={idx} value={p} />
                  ))}
                </datalist>
              </div>

              {/* Tipo de Combustível */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono uppercase font-bold text-zinc-400">
                  Tipo de Combustível:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['DIESEL_S10', 'GASOLINA', 'ETANOL'] as TipoCombustivel[]).map((tipo) => (
                    <button
                      key={tipo}
                      type="button"
                      onClick={() => setTipoCombustivel(tipo)}
                      className={`py-2 px-2 text-[11px] font-mono font-bold rounded-xl border transition-all ${
                        tipoCombustivel === tipo
                          ? 'bg-red-600 text-white border-red-500 shadow-md shadow-red-600/20'
                          : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                      }`}
                    >
                      {tipo.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Litros e Valor Total com Cálculo Dinâmico */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono uppercase font-bold text-zinc-400">
                    Litros:
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={litros}
                    onChange={(e) => setLitros(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-mono font-bold text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono uppercase font-bold text-zinc-400">
                    Valor Total (R$):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={valorTotal}
                    onChange={(e) => setValorTotal(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-mono font-bold text-white focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              {/* Badge de Metrologia R$ / Litro Calculado */}
              <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between text-xs font-mono">
                <span className="text-zinc-400">Preço Calculado por Litro:</span>
                <span className="text-sm font-black text-emerald-400">
                  R$ {precoCalculadoPorLitro} / L
                </span>
              </div>

              {/* Foto da Nota / Cupom Fiscal */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono uppercase font-bold text-zinc-400 flex items-center justify-between">
                  <span>Foto do Cupom / Nota Fiscal</span>
                  <span className="text-zinc-500 text-[10px]">Recomendado</span>
                </label>

                {fotoCupom ? (
                  <div className="relative rounded-xl overflow-hidden border border-zinc-800 max-h-40">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={fotoCupom}
                      alt="Cupom Fiscal"
                      className="w-full h-36 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setFotoCupom(null)}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 text-white hover:bg-black"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center gap-2 p-3.5 border border-dashed border-zinc-800 hover:border-zinc-700 rounded-xl bg-zinc-900/40 cursor-pointer text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors">
                    <Camera className="w-4 h-4 text-red-500" />
                    <span>Tirar Foto da Nota Fiscal</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleFotoCupomChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Botão de Envio com Bloqueio de Segurança */}
              <button
                type="submit"
                disabled={isSubmitting || !odometroAtualValido || bloqueadoPorCalibracao}
                className={`w-full py-3.5 px-4 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-200 shadow-xl ${
                  isSubmitting || !odometroAtualValido || bloqueadoPorCalibracao
                    ? 'bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed'
                    : 'bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-500 hover:to-rose-500 text-white shadow-red-900/40 active:scale-[0.98]'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Transmitindo Registro...</span>
                  </>
                ) : bloqueadoPorCalibracao ? (
                  <>
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span>Bloqueado: Calibre os Pneus</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-emerald-300" />
                    <span>Confirmar e Transmitir Abastecimento</span>
                  </>
                )}
              </button>
            </form>
          </main>
        )}

        {/* ==================================================================== */}
        {/* ETAPA 4: RECIBO DE CONFIRMAÇÃO (SUCCESS) */}
        {/* ==================================================================== */}
        {etapa === 'SUCCESS' && ultimoRegistroGravado && (
          <main className="flex-1 p-6 flex flex-col items-center justify-center text-center space-y-5">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border-2 border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-500/10">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h2 className="text-lg font-black text-white uppercase tracking-tight">
                {ultimoRegistroGravado.isOffline
                  ? 'Abastecimento Gravado no Aparelho!'
                  : 'Abastecimento Transmitido!'}
              </h2>
              <p className="text-xs text-zinc-400 max-w-xs mx-auto">
                {ultimoRegistroGravado.isOffline
                  ? '📡 Registro armazenado com segurança no dispositivo. O envio à central ocorrerá automaticamente assim que houver conexão.'
                  : 'Os dados de metrologia, odômetro e geolocalização foram sincronizados com o servidor.'}
              </p>
            </div>

            {/* Recibo Compacto */}
            <div className="w-full p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 font-mono text-left text-xs space-y-2">
              <div className="flex justify-between text-zinc-400">
                <span>Viatura:</span>
                <span className="text-white font-bold">{ultimoRegistroGravado.prefixo} ({ultimoRegistroGravado.placa})</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Combustível:</span>
                <span className="text-white font-bold">{ultimoRegistroGravado.litros} Litros</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Valor Total:</span>
                <span className="text-emerald-400 font-bold">R$ {ultimoRegistroGravado.valor}</span>
              </div>
              <div className="flex justify-between text-zinc-400 pt-2 border-t border-zinc-800">
                <span>Status de Envio:</span>
                <span className={ultimoRegistroGravado.isOffline ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
                  {ultimoRegistroGravado.isOffline ? 'OFFLINE (PENDENTE SYNC)' : 'ONLINE (SINCRONIZADO)'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setSelectedViatura(null);
                setEtapa('CATALOG');
              }}
              className="w-full py-3.5 px-4 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-white rounded-2xl text-xs font-bold uppercase tracking-wider transition-all active:scale-95"
            >
              Voltar ao Catálogo de Viaturas
            </button>
          </main>
        )}

        {/* Rodapé Mobile App Shell */}
        <footer className="p-3 border-t border-zinc-900 text-center text-[10px] font-mono text-zinc-600 flex items-center justify-between px-4">
          <span>SPCI MASTER V2.11</span>
          <span>SESSÃO SEGURA DO CONDUTOR</span>
        </footer>
      </div>
    </div>
  );
}

export default function TerminalAbastecerPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400 font-mono text-xs">
          Inicializando Terminal Mobile SPCI...
        </div>
      }
    >
      <TerminalAbastecerContent />
    </Suspense>
  );
}
