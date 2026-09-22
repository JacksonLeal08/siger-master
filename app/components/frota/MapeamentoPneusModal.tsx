'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Viatura, 
  PosicaoPneuAbreviada, 
  CatalogoPneuReferencia, 
  ItemAfericaoPneu, 
  StatusTwi,
  TipoTerrenoPneu
} from '@/lib/types/frota';
import { 
  TireWearCalculator, 
  CATALOGO_PNEUS_HOMOLOGADOS_PADRAO,
  LIMITE_LEGAL_TWI_MM,
  LIMITE_ATENCAO_MM
} from '@/lib/services/TireWearCalculator';
import { 
  getCatalogoPneusAction, 
  salvarInspecaoRodagemAction 
} from '@/app/actions/pneuActions';
import { soundNotificationService } from '@/lib/soundNotificationService';
import { TwiEducationalCard } from './TwiEducationalCard';
import { TireTypesGuideCard } from './TireTypesGuideCard';
import { useTheme } from '@/app/context/ThemeContext';
import { 
  Disc, 
  Gauge, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  Minus, 
  Maximize2, 
  Minimize2, 
  ChevronRight, 
  ChevronDown, 
  HelpCircle, 
  Sparkles, 
  Calculator, 
  Save, 
  Camera, 
  Upload,
  Sun,
  Moon 
} from 'lucide-react';

interface MapeamentoPneusModalProps {
  isOpen: boolean;
  viatura: Viatura;
  contratoId?: string;
  onClose: () => void;
  onMinimize?: () => void;
  onSuccess?: () => void;
  tecnicoPadrao?: string;
  theme?: 'dark' | 'light' | 'system';
}

interface SlotRodaConfig {
  posicao: PosicaoPneuAbreviada;
  label: string;
  descricao: string;
  eixo: 'DIANTEIRO' | 'TRASEIRO' | 'ESTEPE';
}

const SLOTS_RODAS: SlotRodaConfig[] = [
  { posicao: 'DE', label: 'Dianteiro Esquerdo', descricao: 'Eixo Direcional Lado Condutor', eixo: 'DIANTEIRO' },
  { posicao: 'DD', label: 'Dianteiro Direito', descricao: 'Eixo Direcional Lado Auxiliar', eixo: 'DIANTEIRO' },
  { posicao: 'TE', label: 'Traseiro Esquerdo', descricao: 'Eixo de Tração / Carga Lado Condutor', eixo: 'TRASEIRO' },
  { posicao: 'TD', label: 'Traseiro Direito', descricao: 'Eixo de Tração / Carga Lado Auxiliar', eixo: 'TRASEIRO' },
  { posicao: 'ESTEPE', label: 'Estepe Operacional', descricao: 'Reserva Técnica Mandatória', eixo: 'ESTEPE' }
];

export const MapeamentoPneusModal: React.FC<MapeamentoPneusModalProps> = ({
  isOpen,
  viatura,
  contratoId,
  onClose,
  onMinimize,
  onSuccess,
  tecnicoPadrao = 'Inspetor de Frota SPCI',
  theme: themeProp
}) => {
  const { theme: contextTheme, toggleTheme } = useTheme();
  const activeTheme = (themeProp && themeProp !== 'system') ? themeProp : (contextTheme || 'dark');
  const isDark = activeTheme === 'dark';


  // Estado de Controles de Janela (Maximizar / Restaurar)
  const [isMaximized, setIsMaximized] = useState(false);

  // Catálogo de Pneus Homologados
  const [catalogo, setCatalogo] = useState<CatalogoPneuReferencia[]>(CATALOGO_PNEUS_HOMOLOGADOS_PADRAO);
  const [selectedCatalogoId, setSelectedCatalogoId] = useState<string>(CATALOGO_PNEUS_HOMOLOGADOS_PADRAO[0].id);

  // Seleção Ativa da Roda
  const [selectedPosicao, setSelectedPosicao] = useState<PosicaoPneuAbreviada>('DE');

  // Mapeamento dos 5 Pneus (Armazenamento em Memória durante a Sessão)
  const [medicoes, setMedicoes] = useState<Record<PosicaoPneuAbreviada, ItemAfericaoPneu>>(() => {
    const initial: Partial<Record<PosicaoPneuAbreviada, ItemAfericaoPneu>> = {};
    const refPadrao = CATALOGO_PNEUS_HOMOLOGADOS_PADRAO[0];
    
    SLOTS_RODAS.forEach((slot) => {
      const calc = TireWearCalculator.calcularMetrologiaCompleta(refPadrao.profundidade_original_mm, 8.0, viatura.odometro_atual_km || 0);
      initial[slot.posicao] = {
        posicao_pneu: slot.posicao,
        pneu_referencia_id: refPadrao.id,
        marca: refPadrao.marca,
        modelo: refPadrao.modelo,
        medida: refPadrao.medida,
        profundidade_original_mm: refPadrao.profundidade_original_mm,
        profundidade_sulco_mm: 8.0,
        desgaste_acumulado_mm: calc.deltaDesgaste,
        percentual_vida_util: calc.percentualVidaUtil,
        pressao_psi: refPadrao.pressao_recomendada_psi,
        status_twi: calc.statusTwi
      };
    });
    return initial as Record<PosicaoPneuAbreviada, ItemAfericaoPneu>;
  });

  // Inputs da Roda Atualmente Selecionada
  const [sulcoInput, setSulcoInput] = useState<string>('8.0');
  const [pressaoInput, setPressaoInput] = useState<string>('32.0');
  const [fotoMedicaoUrl, setFotoMedicaoUrl] = useState<string>('');
  
  // Parâmetros Gerais da Sessão de Inspeção
  const [odometroInput, setOdometroInput] = useState<string>(String(viatura.odometro_atual_km || 0));
  const [houveCalibracao, setHouveCalibracao] = useState<boolean>(true);
  const [observacoesGerais, setObservacoesGerais] = useState<string>('');
  const [showTwiGuide, setShowTwiGuide] = useState<boolean>(false);
  const [showTireGuide, setShowTireGuide] = useState<boolean>(false);
  const [highlightedTireType, setHighlightedTireType] = useState<TipoTerrenoPneu | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Microinteração com Scroll Suave e Destaque ao clicar na tag de terreno
  const handleTagTerrenoClick = (tipoTerreno?: TipoTerrenoPneu) => {
    if (!tipoTerreno) return;
    setShowTireGuide(true);
    setHighlightedTireType(tipoTerreno);

    // Scroll suave até o card correspondente com destaque pulsante temporário
    setTimeout(() => {
      const el = document.getElementById(`tire-profile-${tipoTerreno}`) || document.getElementById('tire-types-guide-container');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 100);

    setTimeout(() => {
      setHighlightedTireType(null);
    }, 1600);
  };

  // Carregar catálogo oficial ao abrir
  useEffect(() => {
    if (isOpen) {
      getCatalogoPneusAction().then((res) => {
        if (res.success && res.data && res.data.length > 0) {
          setCatalogo(res.data);
        }
      });
    }
  }, [isOpen]);

  // Atualiza os inputs ao trocar a roda selecionada
  useEffect(() => {
    const itemAtual = medicoes[selectedPosicao];
    if (itemAtual) {
      setSulcoInput(String(itemAtual.profundidade_sulco_mm));
      setPressaoInput(String(itemAtual.pressao_psi));
      setFotoMedicaoUrl(itemAtual.foto_medicao_url || '');
      if (itemAtual.pneu_referencia_id) {
        setSelectedCatalogoId(itemAtual.pneu_referencia_id);
      }
    }
  }, [selectedPosicao]);

  // Pneu de referência ativo para a roda selecionada
  const refAtual = useMemo(() => {
    return catalogo.find((p) => p.id === selectedCatalogoId) || catalogo[0] || CATALOGO_PNEUS_HOMOLOGADOS_PADRAO[0];
  }, [catalogo, selectedCatalogoId]);

  // Cálculo Metrológico Dinâmico em Tempo Real
  const metrologiaAtual = useMemo(() => {
    const sOrig = refAtual.profundidade_original_mm;
    const sAferido = parseFloat(sulcoInput) || 0;
    const odometroNum = parseFloat(odometroInput) || viatura.odometro_atual_km || 0;
    return TireWearCalculator.calcularMetrologiaCompleta(sOrig, sAferido, odometroNum);
  }, [refAtual, sulcoInput, odometroInput, viatura.odometro_atual_km]);

  // Estatística de Rodas Inspecionadas
  const totalInspecionados = useMemo(() => {
    return Object.values(medicoes).filter((m) => m.profundidade_sulco_mm > 0).length;
  }, [medicoes]);

  // Manipular seleção no catálogo de referência
  const handleSelectPneuReferencia = (pneuId: string) => {
    setSelectedCatalogoId(pneuId);
    const pneu = catalogo.find((p) => p.id === pneuId);
    if (pneu) {
      setPressaoInput(String(pneu.pressao_recomendada_psi));
    }
  };

  // Salvar medição da roda atual e atualizar o estado
  const handleSalvarRodaAtual = () => {
    const sAferido = parseFloat(sulcoInput);
    const pressao = parseFloat(pressaoInput);

    if (isNaN(sAferido) || sAferido < 0) {
      alert('Informe um valor de profundidade de sulco válido em mm.');
      return;
    }

    if (isNaN(pressao) || pressao < 0) {
      alert('Informe uma pressão válida em PSI.');
      return;
    }

    const itemAtualizado: ItemAfericaoPneu = {
      posicao_pneu: selectedPosicao,
      pneu_referencia_id: refAtual.id,
      marca: refAtual.marca,
      modelo: refAtual.modelo,
      medida: refAtual.medida,
      profundidade_original_mm: refAtual.profundidade_original_mm,
      profundidade_sulco_mm: sAferido,
      desgaste_acumulado_mm: metrologiaAtual.deltaDesgaste,
      percentual_vida_util: metrologiaAtual.percentualVidaUtil,
      pressao_psi: pressao,
      status_twi: metrologiaAtual.statusTwi,
      foto_medicao_url: fotoMedicaoUrl || null
    };

    setMedicoes((prev) => ({
      ...prev,
      [selectedPosicao]: itemAtualizado
    }));

    // Se estiver crítico, emite alerta sonoro de alta prioridade
    if (metrologiaAtual.statusTwi === 'CRITICO_PROIBIDO') {
      soundNotificationService.playTwiCriticalAlert();
    }

    // Avança automaticamente para a próxima roda do ciclo
    const idx = SLOTS_RODAS.findIndex((s) => s.posicao === selectedPosicao);
    if (idx >= 0 && idx < SLOTS_RODAS.length - 1) {
      setSelectedPosicao(SLOTS_RODAS[idx + 1].posicao);
    }
  };

  // Gravar Inspeção Completa no Supabase
  const handleGravarInspecaoCompleta = async () => {
    setIsSaving(true);
    try {
      const odometroNum = parseFloat(odometroInput) || viatura.odometro_atual_km || 0;
      const itensLista = Object.values(medicoes);

      const res = await salvarInspecaoRodagemAction({
        contrato_id: contratoId || viatura.contrato_id || 'SALOBO',
        viatura_id: viatura.id,
        odometro_km: odometroNum,
        houve_calibracao: houveCalibracao,
        tecnico_nome: tecnicoPadrao,
        observacoes_gerais: observacoesGerais,
        itens: itensLista
      });

      if (res.success) {
        if (onSuccess) onSuccess();
        onClose();
      } else {
        alert(`Erro ao salvar inspeção: ${res.error || 'Tente novamente.'}`);
      }
    } catch (err: any) {
      alert(`Falha na conexão: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 backdrop-blur-md font-sans select-none animate-in fade-in duration-200 ${
      isDark ? 'bg-slate-950/80' : 'bg-slate-900/40'
    }`}>
      <div 
        className={`w-full flex flex-col overflow-hidden transition-all duration-300 border shadow-2xl ${
          isMaximized 
            ? 'fixed inset-2 sm:inset-4 rounded-2xl max-w-none max-h-none' 
            : 'max-w-5xl max-h-[94vh] rounded-3xl'
        } ${
          isDark 
            ? 'bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-slate-700/80 text-slate-100' 
            : 'bg-gradient-to-b from-white via-slate-50 to-slate-100 border-slate-200 text-slate-900 shadow-slate-900/10'
        }`}
      >
        {/* ==================================================================== */}
        {/* CABEÇALHO CORPORATIVO & CONTROLES DE JANELA */}
        {/* ==================================================================== */}
        <header className={`px-5 py-3.5 border-b flex items-center justify-between gap-3 shrink-0 ${
          isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white/95 border-slate-200 shadow-2xs'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shadow-inner ${
              isDark ? 'bg-red-600/10 border-red-600/30 text-red-500' : 'bg-red-50 border-red-200 text-red-600'
            }`}>
              <Disc className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-mono font-black text-sm uppercase tracking-wider text-red-600">
                  MAPEAMENTO INTERATIVO DE PNEUS & CALIBRAGEM
                </h3>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                  isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-300'
                }`}>
                  CONTRAN 558/80
                </span>
              </div>
              <p className={`text-xs font-mono flex items-center gap-2 mt-0.5 ${
                isDark ? 'text-slate-400' : 'text-slate-600'
              }`}>
                <span className={isDark ? 'text-slate-200 font-bold' : 'text-slate-900 font-bold'}>{viatura.prefixo_frota}</span>
                <span>•</span>
                <span>Placa: <strong className={isDark ? 'text-slate-100' : 'text-slate-900'}>{viatura.placa}</strong></span>
                <span>•</span>
                <span>Odômetro: <strong className={isDark ? 'text-slate-100' : 'text-slate-900'}>{(viatura.odometro_atual_km || 0).toLocaleString('pt-BR')} km</strong></span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Badge de Progresso */}
            <div className={`px-3 py-1 rounded-xl text-xs font-mono font-bold border hidden sm:flex items-center gap-1.5 ${
              totalInspecionados === 5 
                ? (isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-emerald-50 text-emerald-700 border-emerald-300')
                : (isDark ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'bg-amber-50 text-amber-700 border-amber-300')
            }`}>
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Total Inspecionados: {totalInspecionados} de 5</span>
            </div>

            {/* Alternador Rápido de Tema (Claro / Escuro) */}
            <button
              type="button"
              onClick={toggleTheme}
              className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
                isDark 
                  ? 'border-slate-700 bg-slate-800/80 text-amber-400 hover:text-amber-300 hover:bg-slate-700' 
                  : 'border-slate-300 bg-slate-100 text-slate-700 hover:text-slate-900 hover:bg-slate-200 shadow-2xs'
              }`}
              title={isDark ? 'Mudar para Modo Claro (☀️)' : 'Mudar para Modo Escuro (🌙)'}
              aria-label="Alternar Tema"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Controles de Janela */}
            <div className={`flex items-center border rounded-xl overflow-hidden ${
              isDark ? 'border-slate-700/60 bg-slate-800/60' : 'border-slate-300 bg-slate-100'
            }`}>
              {onMinimize && (
                <button
                  type="button"
                  onClick={onMinimize}
                  className={`p-2 transition-colors border-none bg-transparent cursor-pointer ${
                    isDark ? 'text-slate-400 hover:text-white hover:bg-slate-700/60' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                  }`}
                  title="Minimizar para o Dock"
                >
                  <Minus className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsMaximized(!isMaximized)}
                className={`p-2 transition-colors border-none bg-transparent cursor-pointer ${
                  isDark ? 'text-slate-400 hover:text-white hover:bg-slate-700/60' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                }`}
                title={isMaximized ? 'Restaurar Janela' : 'Maximizar Janela'}
              >
                {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={onClose}
                className={`p-2 transition-colors border-none bg-transparent cursor-pointer ${
                  isDark ? 'text-slate-400 hover:text-red-400 hover:bg-slate-700/60' : 'text-slate-600 hover:text-red-600 hover:bg-slate-200'
                }`}
                title="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* ==================================================================== */}
        {/* CORPO DO MODAL (OPÇÃO A: CHASSI PANORÂMICO SUPERIOR + BENTO CARDS INFERIORES) */}
        {/* ==================================================================== */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-6">
          
          {/* ------------------------------------------------------------------ */}
          {/* SEÇÃO SUPERIOR: DIAGRAMA ESQUEMÁTICO DO CHASSI EM EXTENSÃO TOTAL */}
          {/* ------------------------------------------------------------------ */}
          <div className={`p-4 sm:p-5 rounded-3xl border shadow-xs transition-colors ${
            isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            {/* Header do Esquema com Título, Subtítulo e Legenda de Cores */}
            <div className={`flex flex-col md:flex-row items-start md:items-center justify-between pb-3.5 border-b gap-3 mb-4 ${
              isDark ? 'border-slate-800' : 'border-slate-200'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  isDark ? 'bg-red-600/10 border border-red-600/30 text-red-500' : 'bg-red-50 border border-red-200 text-red-600'
                }`}>
                  <Gauge className="w-4 h-4" />
                </div>
                <div>
                  <h4 className={`font-mono font-bold text-xs uppercase tracking-wider ${
                    isDark ? 'text-slate-100' : 'text-slate-900'
                  }`}>
                    Diagrama Esquemático do Chassi & Mapa de Rodagem
                  </h4>
                  <p className={`text-[10.5px] font-mono ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    Toque em qualquer roda para inspecionar, calibrar ou detalhar medições
                  </p>
                </div>
              </div>

              {/* Guia Rápido Normativo de Cores */}
              <div className="flex items-center gap-2 flex-wrap text-[10px] font-mono font-bold">
                <span className={`px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${
                  isDark ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                }`}>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  ≥ 3.0 mm (Conforme)
                </span>
                <span className={`px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${
                  isDark ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-amber-50 border-amber-200 text-amber-700'
                }`}>
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  1.7 a 2.9 mm (Atenção)
                </span>
                <span className={`px-2.5 py-1 rounded-lg border flex items-center gap-1.5 animate-pulse ${
                  isDark ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-red-50 border-red-200 text-red-700'
                }`}>
                  <span className="w-2 h-2 rounded-full bg-red-600" />
                  ≤ 1.6 mm (Crítico / TWI Proibido)
                </span>
              </div>
            </div>

            {/* Esquema Espaçoso e Panorâmico do Chassi */}
            <div className="relative w-full max-w-5xl mx-auto py-2">
              
              {/* EIXO DIANTEIRO (DE e DD) */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center relative z-10">
                {/* Roda DE */}
                <div className="sm:col-span-5 flex justify-center sm:justify-end">
                  <RodaCard
                    slot={SLOTS_RODAS[0]}
                    medicao={medicoes.DE}
                    isSelected={selectedPosicao === 'DE'}
                    onClick={() => setSelectedPosicao('DE')}
                    isDark={isDark}
                  />
                </div>

                {/* Eixo Dianteiro Direcional e Indicador Frente */}
                <div className="sm:col-span-2 hidden sm:flex flex-col items-center justify-center">
                  <div className={`h-2 w-full rounded-full ${isDark ? 'bg-slate-700/80' : 'bg-slate-300'}`} />
                  <div className={`mt-2 px-3 py-0.5 rounded-full border text-[9px] font-mono font-black uppercase tracking-widest text-center shadow-2xs ${
                    isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-300'
                  }`}>
                    ▲ FRENTE ▲
                  </div>
                </div>

                {/* Roda DD */}
                <div className="sm:col-span-5 flex justify-center sm:justify-start">
                  <RodaCard
                    slot={SLOTS_RODAS[1]}
                    medicao={medicoes.DD}
                    isSelected={selectedPosicao === 'DD'}
                    onClick={() => setSelectedPosicao('DD')}
                    isDark={isDark}
                  />
                </div>
              </div>

              {/* SEÇÃO CENTRAL: VIGA DO CHASSI + CABINE DO VEÍCULO */}
              <div className="relative py-4 flex items-center justify-center">
                {/* Linha Longitudinal do Chassi */}
                <div className={`absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-2 rounded-full ${
                  isDark ? 'bg-slate-700/60' : 'bg-slate-300'
                }`} />

                {/* Silhueta Central da Cabine */}
                <div className={`relative z-10 px-8 py-3 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center backdrop-blur-xs shadow-xs ${
                  isDark ? 'border-slate-700/80 bg-slate-950/80 text-slate-300' : 'border-slate-300 bg-slate-50/90 text-slate-700'
                }`}>
                  <span className="text-[11px] font-mono font-black text-red-600 uppercase tracking-wider">
                    {viatura.prefixo_frota}
                  </span>
                  <span className="text-xs font-mono font-bold">
                    {viatura.marca} {viatura.modelo}
                  </span>
                  <span className={`text-[9.5px] font-mono mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Placa: {viatura.placa} • Tração 4x4 / Chassi Longarinas
                  </span>
                </div>
              </div>

              {/* EIXO TRASEIRO (TE e TD) */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center relative z-10">
                {/* Roda TE */}
                <div className="sm:col-span-5 flex justify-center sm:justify-end">
                  <RodaCard
                    slot={SLOTS_RODAS[2]}
                    medicao={medicoes.TE}
                    isSelected={selectedPosicao === 'TE'}
                    onClick={() => setSelectedPosicao('TE')}
                    isDark={isDark}
                  />
                </div>

                {/* Eixo Traseiro de Carga */}
                <div className="sm:col-span-2 hidden sm:flex flex-col items-center justify-center">
                  <div className={`h-2 w-full rounded-full ${isDark ? 'bg-slate-700/80' : 'bg-slate-300'}`} />
                  <div className={`mt-2 px-3 py-0.5 rounded-full border text-[9px] font-mono font-black uppercase tracking-widest text-center shadow-2xs ${
                    isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-300'
                  }`}>
                    ▼ TRASEIRA ▼
                  </div>
                </div>

                {/* Roda TD */}
                <div className="sm:col-span-5 flex justify-center sm:justify-start">
                  <RodaCard
                    slot={SLOTS_RODAS[3]}
                    medicao={medicoes.TD}
                    isSelected={selectedPosicao === 'TD'}
                    onClick={() => setSelectedPosicao('TD')}
                    isDark={isDark}
                  />
                </div>
              </div>

              {/* ESTEPE OPERACIONAL (COMPARTIMENTO TÉCNICO INFERIOR) */}
              <div className="mt-5 pt-3.5 border-t border-dashed border-slate-200/80 dark:border-slate-800/80 flex flex-col items-center justify-center gap-1.5">
                <span className={`text-[9.5px] font-mono font-bold uppercase tracking-widest ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  Compartimento Técnico de Reserva
                </span>
                <RodaCard
                  slot={SLOTS_RODAS[4]}
                  medicao={medicoes.ESTEPE}
                  isSelected={selectedPosicao === 'ESTEPE'}
                  onClick={() => setSelectedPosicao('ESTEPE')}
                  isDark={isDark}
                />
              </div>

            </div>
          </div>

          {/* ------------------------------------------------------------------ */}
          {/* EXTREMIDADE INFERIOR: BENTO GRID DE DADOS E MEMÓRIA DE CÁLCULO */}
          {/* ------------------------------------------------------------------ */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            
            {/* BLOCO ESQUERDA (5 COLUNAS): ENTRADA DA RODA ATIVA + SESSÃO + GUIA */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              
              {/* Card de Entrada da Roda Selecionada */}
              <div className={`p-4 rounded-2xl border ${
                isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
              }`}>
                <div className={`flex items-center justify-between pb-3 border-b mb-3 ${
                  isDark ? 'border-slate-800' : 'border-slate-200'
                }`}>
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-red-600 text-white font-mono font-black text-xs flex items-center justify-center shadow-xs">
                      {selectedPosicao}
                    </span>
                    <div>
                      <h4 className={`font-mono font-bold text-xs uppercase ${
                        isDark ? 'text-slate-200' : 'text-slate-800'
                      }`}>
                        {SLOTS_RODAS.find(s => s.posicao === selectedPosicao)?.label}
                      </h4>
                      <p className={`text-[10px] font-mono ${
                        isDark ? 'text-slate-400' : 'text-slate-500'
                      }`}>
                        {SLOTS_RODAS.find(s => s.posicao === selectedPosicao)?.descricao}
                      </p>
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border ${
                    metrologiaAtual.statusTwi === 'CRITICO_PROIBIDO'
                      ? (isDark ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse' : 'bg-red-50 text-red-700 border-red-200 animate-pulse')
                      : metrologiaAtual.statusTwi === 'ATENCAO'
                      ? (isDark ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' : 'bg-amber-50 text-amber-700 border-amber-200')
                      : (isDark ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : 'bg-emerald-50 text-emerald-700 border-emerald-200')
                  }`}>
                    {metrologiaAtual.statusTwi === 'CRITICO_PROIBIDO' ? '⚠️ CRÍTICO (TWI)' : metrologiaAtual.statusTwi}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Catálogo Mestre */}
                  <div className="sm:col-span-3">
                    <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                      <label className={`text-[10px] uppercase font-mono font-bold block ${
                        isDark ? 'text-slate-400' : 'text-slate-600'
                      }`}>
                        Pneu de Referência Homologado (Fábrica)
                      </label>

                      {/* Pílula tátil do Perfil de Terreno com microinteração de navegação */}
                      {refAtual && (
                        <button
                          type="button"
                          onClick={() => handleTagTerrenoClick(refAtual.tipo_terreno || 'AT')}
                          className={`text-[9.5px] font-mono font-bold px-2.5 py-0.5 rounded-full border cursor-pointer transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5 shadow-2xs ${
                            (refAtual.tipo_terreno === 'HT')
                              ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 hover:bg-blue-500/20'
                              : (refAtual.tipo_terreno === 'RT')
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                              : (refAtual.tipo_terreno === 'MT')
                              ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30 hover:bg-red-500/20'
                              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                          }`}
                          title="Clique para abrir e destacar o Guia Didático de Terreno deste modelo"
                        >
                          <span className="w-1.5 h-1.5 rounded-full animate-ping bg-current opacity-75" />
                          <span>
                            {refAtual.tipo_terreno === 'HT' && '🏷️ H/T • ASFALTO'}
                            {(refAtual.tipo_terreno === 'AT' || !refAtual.tipo_terreno) && '🏷️ A/T • USO MISTO'}
                            {refAtual.tipo_terreno === 'RT' && '🏷️ R/T • TERRENO SEVERO'}
                            {refAtual.tipo_terreno === 'MT' && '🏷️ M/T • LAMA/OFF-ROAD'}
                          </span>
                        </button>
                      )}
                    </div>

                    <select
                      value={selectedCatalogoId}
                      onChange={(e) => handleSelectPneuReferencia(e.target.value)}
                      className={`w-full border rounded-xl px-3 py-2 text-xs font-mono focus:border-red-500 outline-none transition-colors ${
                        isDark 
                          ? 'bg-slate-950 border-slate-700 text-slate-100' 
                          : 'bg-slate-50 border-slate-300 text-slate-800'
                      }`}
                    >
                      {catalogo.map((pneu) => (
                        <option key={pneu.id} value={pneu.id}>
                          {pneu.marca} {pneu.modelo} • {pneu.medida} [{pneu.tipo_terreno || 'AT'}] (S_orig: {pneu.profundidade_original_mm.toFixed(2)} mm • {pneu.pressao_recomendada_psi} PSI)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Profundidade Aferida (S_aferido) */}
                  <div>
                    <label className={`text-[10px] uppercase font-mono font-bold block mb-1 ${
                      isDark ? 'text-slate-400' : 'text-slate-600'
                    }`}>
                      Sulco Aferido (mm) *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="20"
                        value={sulcoInput}
                        onChange={(e) => setSulcoInput(e.target.value)}
                        className={`w-full border rounded-xl px-3 py-2 text-xs font-mono font-bold focus:border-red-500 outline-none pr-8 transition-colors ${
                          isDark 
                            ? 'bg-slate-950 border-slate-700 text-slate-100' 
                            : 'bg-slate-50 border-slate-300 text-slate-800'
                        }`}
                      />
                      <span className={`absolute right-2.5 top-2 text-[10px] font-mono ${
                        isDark ? 'text-slate-400' : 'text-slate-500'
                      }`}>mm</span>
                    </div>
                  </div>

                  {/* Pressão PSI */}
                  <div>
                    <label className={`text-[10px] uppercase font-mono font-bold block mb-1 ${
                      isDark ? 'text-slate-400' : 'text-slate-600'
                    }`}>
                      Pressão Aferida (PSI) *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="1"
                        min="10"
                        max="120"
                        value={pressaoInput}
                        onChange={(e) => setPressaoInput(e.target.value)}
                        className={`w-full border rounded-xl px-3 py-2 text-xs font-mono font-bold focus:border-red-500 outline-none pr-8 transition-colors ${
                          isDark 
                            ? 'bg-slate-950 border-slate-700 text-slate-100' 
                            : 'bg-slate-50 border-slate-300 text-slate-800'
                        }`}
                      />
                      <span className={`absolute right-2.5 top-2 text-[10px] font-mono ${
                        isDark ? 'text-slate-400' : 'text-slate-500'
                      }`}>PSI</span>
                    </div>
                  </div>

                  {/* Botão de Salvar Roda Atual */}
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={handleSalvarRodaAtual}
                      className={`w-full rounded-xl py-2 px-3 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border active:scale-95 shadow-xs ${
                        isDark 
                          ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-600' 
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                      }`}
                    >
                      <Save className={`w-3.5 h-3.5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                      Salvar Roda
                    </button>
                  </div>
                </div>
              </div>

              {/* Parâmetros da Sessão: Calibração e Odômetro */}
              <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-2xl border ${
                isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-2xs'
              }`}>
                <label className={`flex items-center gap-2 cursor-pointer text-xs font-mono ${
                  isDark ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  <input
                    type="checkbox"
                    checked={houveCalibracao}
                    onChange={(e) => setHouveCalibracao(e.target.checked)}
                    className={`w-4 h-4 rounded text-red-600 focus:ring-0 ${
                      isDark ? 'border-slate-700 bg-slate-950' : 'border-slate-300 bg-white'
                    }`}
                  />
                  <span>Houve Calibração dos Pneus nesta sessão</span>
                </label>

                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Odômetro:</span>
                  <input
                    type="number"
                    value={odometroInput}
                    onChange={(e) => setOdometroInput(e.target.value)}
                    className={`w-28 border rounded-lg px-2 py-1 text-xs font-mono font-bold ${
                      isDark ? 'bg-slate-950 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-800'
                    }`}
                  />
                  <span className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>km</span>
                </div>
              </div>

              {/* Guia Didático TWI Integrado (Expansível) */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowTwiGuide(!showTwiGuide)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer ${
                    isDark 
                      ? 'bg-slate-800/40 hover:bg-slate-800/80 border-slate-700/80 text-slate-300' 
                      : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-500" />
                    <span>Guia Técnico Normativo: O que é TWI e Amparo Legal CONTRAN?</span>
                  </div>
                  {showTwiGuide ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>

                {showTwiGuide && (
                  <div className="mt-2 animate-in fade-in duration-200">
                    <TwiEducationalCard isDark={isDark} />
                  </div>
                )}
              </div>

              {/* Guia Técnico Didático: Tipos de Pneus para Caminhonetes & Viaturas (H/T, A/T, R/T, M/T) */}
              <TireTypesGuideCard 
                isDark={isDark}
                highlightedType={highlightedTireType}
                isOpenControlled={showTireGuide}
                onToggleOpen={(open) => setShowTireGuide(open)}
              />
            </div>

            {/* BLOCO DIREITA (7 COLUNAS): MEMÓRIA DE CÁLCULO E PARÂMETROS METROLÓGICOS */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              <div className={`p-4 sm:p-5 rounded-2xl border relative overflow-hidden ${
                isDark ? 'bg-slate-900/95 border-slate-800 shadow-xl' : 'bg-white border-slate-200 shadow-xs'
              }`}>
                <div className={`flex items-center justify-between pb-3 border-b mb-3 ${
                  isDark ? 'border-slate-800' : 'border-slate-200'
                }`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                      isDark ? 'bg-blue-500/10 border border-blue-500/30 text-blue-400' : 'bg-blue-50 border border-blue-200 text-blue-600'
                    }`}>
                      <Calculator className="w-4 h-4" />
                    </div>
                    <h4 className={`font-mono font-bold text-xs uppercase ${
                      isDark ? 'text-slate-200' : 'text-slate-800'
                    }`}>
                      Memória de Cálculo & Parâmetros Metrológicos
                    </h4>
                  </div>
                  <span className={`text-[10px] font-mono ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    Normatização CONTRAN nº 558/80
                  </span>
                </div>

                {/* Tabela de Parâmetros Metrológicos */}
                <div className="space-y-2 text-xs font-mono">
                  <div className={`flex items-center justify-between py-1.5 border-b ${
                    isDark ? 'border-slate-800/60' : 'border-slate-200/80'
                  }`}>
                    <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Profundidade Original de Fábrica (S_orig):</span>
                    <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>{metrologiaAtual.sOrig.toFixed(2)} mm</span>
                  </div>

                  <div className={`flex items-center justify-between py-1.5 border-b ${
                    isDark ? 'border-slate-800/60' : 'border-slate-200/80'
                  }`}>
                    <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Limite Legal Mandatório (CONTRAN 558/80):</span>
                    <span className={`font-bold ${isDark ? 'text-red-400' : 'text-red-600'}`}>1.60 mm (TWI)</span>
                  </div>

                  <div className={`flex items-center justify-between py-1.5 border-b ${
                    isDark ? 'border-slate-800/60' : 'border-slate-200/80'
                  }`}>
                    <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Borracha Útil Total de Projeto (B_útil):</span>
                    <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>{metrologiaAtual.bUtilTotal.toFixed(2)} mm</span>
                  </div>

                  <div className={`flex items-center justify-between py-1.5 border-b ${
                    isDark ? 'border-slate-800/60' : 'border-slate-200/80'
                  }`}>
                    <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Desgaste Acumulado da Rodagem (Δ_desgaste):</span>
                    <span className={`font-bold ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                      {metrologiaAtual.deltaDesgaste.toFixed(2)} mm ({metrologiaAtual.percentualDesgasteConsumido.toFixed(1)}% consumido)
                    </span>
                  </div>

                  <div className={`flex items-center justify-between py-1.5 border-b ${
                    isDark ? 'border-slate-800/60' : 'border-slate-200/80'
                  }`}>
                    <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Saldo de Borracha Restante até o Limite:</span>
                    <span className={`font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{metrologiaAtual.saldoBorrachaRestante.toFixed(2)} mm</span>
                  </div>

                  <div className={`flex items-center justify-between py-1.5 border-b ${
                    isDark ? 'border-slate-800/60' : 'border-slate-200/80'
                  }`}>
                    <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Percentual de Vida Útil Restante (% V_útil):</span>
                    <span className={`font-black text-sm ${
                      metrologiaAtual.percentualVidaUtil < 20 
                        ? (isDark ? 'text-red-400' : 'text-red-600') 
                        : metrologiaAtual.percentualVidaUtil < 40 
                        ? (isDark ? 'text-amber-400' : 'text-amber-600') 
                        : (isDark ? 'text-emerald-400' : 'text-emerald-600')
                    }`}>
                      {metrologiaAtual.percentualVidaUtil.toFixed(2)}%
                    </span>
                  </div>

                  {/* Barra Gráfica de Vida Útil */}
                  <div className="pt-1.5 pb-2">
                    <div className={`w-full h-3 rounded-full border overflow-hidden flex ${
                      isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-200 border-slate-300'
                    }`}>
                      <div 
                        style={{ width: `${metrologiaAtual.percentualVidaUtil}%` }}
                        className={`h-full transition-all duration-500 rounded-full ${
                          metrologiaAtual.percentualVidaUtil < 20 
                            ? 'bg-red-500' 
                            : metrologiaAtual.percentualVidaUtil < 40 
                            ? 'bg-amber-500' 
                            : 'bg-emerald-500'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Demonstrativo Formal da Equação Matemática */}
                  <div className={`p-3 rounded-xl border text-[11px] ${
                    isDark ? 'bg-slate-950/80 border-slate-800/80 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}>
                    <span className={`text-[10px] uppercase font-bold block mb-1 ${
                      isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                      Demonstrativo Formal da Equação:
                    </span>
                    <code className={`block break-words font-mono font-bold ${
                      isDark ? 'text-emerald-400' : 'text-emerald-700'
                    }`}>
                      {metrologiaAtual.demonstrativoEquacao}
                    </code>
                  </div>

                  {/* Quilometragem Projetada para Troca */}
                  {metrologiaAtual.kmProjetadoTwi && (
                    <div className="flex items-center justify-between pt-1.5">
                      <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Quilometragem Projetada para Atingimento do TWI:</span>
                      <span className={`font-mono font-black ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                        {metrologiaAtual.kmProjetadoTwi.toLocaleString('pt-BR')} km
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ==================================================================== */}
        {/* RODAPÉ DO MODAL: AÇÕES DE SALVAMENTO */}
        {/* ==================================================================== */}
        <footer className={`px-5 py-3.5 border-t flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 ${
          isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white/95 border-slate-200'
        }`}>
          <div className={`text-[11px] font-mono flex items-center gap-2 ${
            isDark ? 'text-slate-400' : 'text-slate-600'
          }`}>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Inspetor: <strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>{tecnicoPadrao}</strong></span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer border ${
                isDark 
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700' 
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
              }`}
            >
              Cancelar
            </button>

            <button
              type="button"
              disabled={isSaving}
              onClick={handleGravarInspecaoCompleta}
              className="flex-1 sm:flex-none px-6 py-2 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white rounded-xl text-xs font-mono font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer border-none shadow-lg shadow-red-600/30 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Gravando...' : 'Gravar Inspeção Completa'}</span>
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};

interface RodaCardProps {
  slot: SlotRodaConfig;
  medicao: ItemAfericaoPneu;
  isSelected: boolean;
  onClick: () => void;
  isDark: boolean;
}

const RodaCard: React.FC<RodaCardProps> = ({ slot, medicao, isSelected, onClick, isDark }) => {
  const isCritico = medicao.status_twi === 'CRITICO_PROIBIDO';
  const isAtencao = medicao.status_twi === 'ATENCAO';

  return (
    <div
      onClick={onClick}
      className={`group cursor-pointer transition-all duration-200 rounded-2xl p-3 sm:p-3.5 border shadow-sm w-full max-w-[280px] sm:max-w-[320px] ${
        isSelected
          ? (isDark 
              ? 'ring-2 ring-red-500 scale-[1.02] bg-slate-800/95 border-red-500 shadow-lg shadow-red-500/20' 
              : 'ring-2 ring-red-500 scale-[1.02] bg-red-50/90 border-red-400 shadow-md shadow-red-500/10')
          : (isDark 
              ? 'bg-slate-900/90 border-slate-700/80 hover:border-slate-500 hover:bg-slate-800/90' 
              : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 shadow-xs')
      }`}
    >
      {/* Topo do Card: Posição + Nome + Status */}
      <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-200/60 dark:border-slate-800/60">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-6 h-6 rounded-md bg-red-600 text-white font-mono font-black text-[11px] flex items-center justify-center shrink-0 shadow-2xs">
            {slot.posicao}
          </span>
          <div className="min-w-0">
            <h5 className={`font-mono font-bold text-xs truncate ${isDark ? 'text-slate-100' : 'text-slate-900'}`} title={slot.label}>
              {slot.label}
            </h5>
            <p className={`text-[9.5px] font-mono truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {slot.descricao}
            </p>
          </div>
        </div>

        <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border shrink-0 ${
          isCritico 
            ? (isDark ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse' : 'bg-red-50 text-red-700 border-red-200 animate-pulse')
            : isAtencao
            ? (isDark ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' : 'bg-amber-50 text-amber-700 border-amber-200')
            : (isDark ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : 'bg-emerald-50 text-emerald-700 border-emerald-200')
        }`}>
          {isCritico ? 'CRÍTICO' : isAtencao ? 'ATENÇÃO' : 'CONFORME'}
        </span>
      </div>

      {/* Meio: Pneu Visual + Métricas Numéricas */}
      <div className="flex items-center justify-between gap-3">
        {/* Pneu Gráfico com Profundidade */}
        <div className="flex items-center gap-2.5">
          <div className={`w-9 h-13 rounded-lg flex flex-col items-center justify-center border-2 transition-all relative shrink-0 shadow-inner ${
            isCritico
              ? (isDark ? 'bg-red-950 border-red-500 text-red-400 animate-pulse' : 'bg-red-100 border-red-600 text-red-700 animate-pulse')
              : isAtencao
              ? (isDark ? 'bg-amber-950 border-amber-500 text-amber-400' : 'bg-amber-100 border-amber-500 text-amber-700')
              : (isDark ? 'bg-slate-950 border-emerald-500 text-emerald-400' : 'bg-emerald-50 border-emerald-500 text-emerald-700')
          }`}>
            <span className="font-mono font-black text-[11px]">{slot.posicao}</span>
            <span className="text-[8px] font-mono font-bold mt-0.5">{medicao.profundidade_sulco_mm.toFixed(1)}</span>
          </div>

          <div className="space-y-0.5">
            <div className="flex items-baseline gap-1">
              <span className={`text-base font-black font-mono ${
                isCritico ? (isDark ? 'text-red-400' : 'text-red-600') : isAtencao ? (isDark ? 'text-amber-400' : 'text-amber-600') : (isDark ? 'text-emerald-400' : 'text-emerald-600')
              }`}>
                {medicao.profundidade_sulco_mm.toFixed(1)}
              </span>
              <span className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>mm sulco</span>
            </div>
            <div className={`text-[11px] font-mono ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              <strong>{medicao.pressao_psi}</strong> <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>PSI</span>
            </div>
          </div>
        </div>

        {/* Vida Útil Percentual com Mini Barra */}
        <div className="text-right flex flex-col items-end gap-1">
          <span className={`font-black font-mono text-xs ${
            isCritico ? (isDark ? 'text-red-400' : 'text-red-600') : isAtencao ? (isDark ? 'text-amber-400' : 'text-amber-600') : (isDark ? 'text-emerald-400' : 'text-emerald-600')
          }`}>
            {medicao.percentual_vida_util.toFixed(0)}% vida
          </span>
          <div className={`w-16 h-2 rounded-full overflow-hidden border ${isDark ? 'bg-slate-950 border-slate-700' : 'bg-slate-200 border-slate-300'}`}>
            <div 
              style={{ width: `${Math.max(5, Math.min(100, medicao.percentual_vida_util))}%` }}
              className={`h-full rounded-full transition-all duration-300 ${
                isCritico ? 'bg-red-500' : isAtencao ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapeamentoPneusModal;
