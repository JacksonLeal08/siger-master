'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Viatura, 
  PosicaoPneuAbreviada, 
  CatalogoPneuReferencia, 
  ItemAfericaoPneu, 
  StatusTwi 
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
  const [isSaving, setIsSaving] = useState<boolean>(false);

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
        {/* CORPO DO MODAL (DUAS COLUNAS: CHASSI ESQUERDA + METROLOGIA DIREITA) */}
        {/* ==================================================================== */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* ------------------------------------------------------------------ */}
          {/* ÁREA ESQUERDA: CHASSI INTERATIVO VETORIAL (5 colunas) */}
          {/* ------------------------------------------------------------------ */}
          <div className="lg:col-span-5 flex flex-col gap-3">
            <div className={`p-4 rounded-2xl border ${
              isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
            }`}>
              <div className={`flex items-center justify-between pb-2 border-b mb-3 ${
                isDark ? 'border-slate-800' : 'border-slate-200'
              }`}>
                <span className={`text-[11px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                  isDark ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  <Gauge className="w-3.5 h-3.5 text-red-500" />
                  Diagrama Esquemático do Chassi
                </span>
                <span className={`text-[10px] font-mono ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  Toque na roda para inspecionar
                </span>
              </div>

              {/* Chassi do Veículo */}
              <div className="relative w-full max-w-[310px] mx-auto py-4">
                {/* Linha Longitudinal do Chassi */}
                <div className={`absolute top-8 bottom-8 left-1/2 -translate-x-1/2 w-1.5 rounded-full ${
                  isDark ? 'bg-slate-700/60' : 'bg-slate-300'
                }`} />

                {/* Eixo Dianteiro */}
                <div className={`absolute top-16 left-6 right-6 h-1 rounded-full ${
                  isDark ? 'bg-slate-700/80' : 'bg-slate-300'
                }`} />
                {/* Eixo Traseiro */}
                <div className={`absolute top-52 left-6 right-6 h-1 rounded-full ${
                  isDark ? 'bg-slate-700/80' : 'bg-slate-300'
                }`} />

                {/* Silhueta Central da Cabine */}
                <div className={`mx-auto w-32 h-64 border-2 border-dashed rounded-3xl flex flex-col items-center justify-between p-3 relative ${
                  isDark ? 'border-slate-700/60 bg-slate-950/30' : 'border-slate-300 bg-slate-50/70'
                }`}>
                  <div className={`text-[9px] font-mono font-bold uppercase tracking-widest mt-1 ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    FRENTE
                  </div>
                  <div className={`text-[9px] font-mono font-bold text-center px-1 truncate max-w-[110px] ${
                    isDark ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    {viatura.modelo}
                  </div>
                  <div className={`text-[9px] font-mono font-bold uppercase tracking-widest mb-1 ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    TRASEIRA
                  </div>
                </div>

                {/* Posição DE (Dianteiro Esquerdo) */}
                <div className="absolute top-10 left-0">
                  <RodaCard
                    slot={SLOTS_RODAS[0]}
                    medicao={medicoes.DE}
                    isSelected={selectedPosicao === 'DE'}
                    onClick={() => setSelectedPosicao('DE')}
                    isDark={isDark}
                  />
                </div>

                {/* Posição DD (Dianteiro Direito) */}
                <div className="absolute top-10 right-0">
                  <RodaCard
                    slot={SLOTS_RODAS[1]}
                    medicao={medicoes.DD}
                    isSelected={selectedPosicao === 'DD'}
                    onClick={() => setSelectedPosicao('DD')}
                    isDark={isDark}
                  />
                </div>

                {/* Posição TE (Traseiro Esquerdo) */}
                <div className="absolute top-46 left-0">
                  <RodaCard
                    slot={SLOTS_RODAS[2]}
                    medicao={medicoes.TE}
                    isSelected={selectedPosicao === 'TE'}
                    onClick={() => setSelectedPosicao('TE')}
                    isDark={isDark}
                  />
                </div>

                {/* Posição TD (Traseiro Direito) */}
                <div className="absolute top-46 right-0">
                  <RodaCard
                    slot={SLOTS_RODAS[3]}
                    medicao={medicoes.TD}
                    isSelected={selectedPosicao === 'TD'}
                    onClick={() => setSelectedPosicao('TD')}
                    isDark={isDark}
                  />
                </div>

                {/* Posição ESTEPE */}
                <div className="mt-4 flex justify-center">
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

            {/* Guia Rápido de Cores Normativas */}
            <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono font-bold">
              <div className={`p-2 rounded-xl border ${
                isDark ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
              }`}>
                <span>≥ 3.0 mm</span>
                <p className={`text-[9px] font-normal ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Conforme Pleno</p>
              </div>
              <div className={`p-2 rounded-xl border ${
                isDark ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-amber-50 border-amber-200 text-amber-700'
              }`}>
                <span>1.7 a 2.9 mm</span>
                <p className={`text-[9px] font-normal ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Atenção Preventiva</p>
              </div>
              <div className={`p-2 rounded-xl border animate-pulse ${
                isDark ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-red-50 border-red-200 text-red-700'
              }`}>
                <span>≤ 1.6 mm</span>
                <p className={`text-[9px] font-normal ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Crítico / TWI Proibido</p>
              </div>
            </div>
          </div>

          {/* ------------------------------------------------------------------ */}
          {/* ÁREA DIREITA: ENTRADA & MEMÓRIA DE CÁLCULO METROLÓGICO (7 colunas) */}
          {/* ------------------------------------------------------------------ */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            
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
                  <label className={`text-[10px] uppercase font-mono font-bold block mb-1 ${
                    isDark ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    Pneu de Referência Homologado (Fábrica)
                  </label>
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
                        {pneu.marca} {pneu.modelo} • {pneu.medida} (S_orig: {pneu.profundidade_original_mm.toFixed(2)} mm • {pneu.pressao_recomendada_psi} PSI)
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

            {/* ================================================================ */}
            {/* CARD EXECUTIVO: MEMÓRIA DE CÁLCULO & PARÂMETROS METROLÓGICOS */}
            {/* ================================================================ */}
            <div className={`p-4 rounded-2xl border relative overflow-hidden ${
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
                <div className={`flex items-center justify-between py-1 border-b ${
                  isDark ? 'border-slate-800/60' : 'border-slate-200/80'
                }`}>
                  <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Profundidade Original de Fábrica (S_orig):</span>
                  <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>{metrologiaAtual.sOrig.toFixed(2)} mm</span>
                </div>

                <div className={`flex items-center justify-between py-1 border-b ${
                  isDark ? 'border-slate-800/60' : 'border-slate-200/80'
                }`}>
                  <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Limite Legal Mandatório (CONTRAN 558/80):</span>
                  <span className={`font-bold ${isDark ? 'text-red-400' : 'text-red-600'}`}>1.60 mm (TWI)</span>
                </div>

                <div className={`flex items-center justify-between py-1 border-b ${
                  isDark ? 'border-slate-800/60' : 'border-slate-200/80'
                }`}>
                  <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Borracha Útil Total de Projeto (B_útil):</span>
                  <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>{metrologiaAtual.bUtilTotal.toFixed(2)} mm</span>
                </div>

                <div className={`flex items-center justify-between py-1 border-b ${
                  isDark ? 'border-slate-800/60' : 'border-slate-200/80'
                }`}>
                  <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Desgaste Acumulado da Rodagem (Δ_desgaste):</span>
                  <span className={`font-bold ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                    {metrologiaAtual.deltaDesgaste.toFixed(2)} mm ({metrologiaAtual.percentualDesgasteConsumido.toFixed(1)}% consumido)
                  </span>
                </div>

                <div className={`flex items-center justify-between py-1 border-b ${
                  isDark ? 'border-slate-800/60' : 'border-slate-200/80'
                }`}>
                  <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Saldo de Borracha Restante até o Limite:</span>
                  <span className={`font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{metrologiaAtual.saldoBorrachaRestante.toFixed(2)} mm</span>
                </div>

                <div className={`flex items-center justify-between py-1 border-b ${
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
                <div className="pt-1 pb-2">
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
                <div className={`p-2.5 rounded-xl border text-[11px] ${
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
                  <div className="flex items-center justify-between pt-1">
                    <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Quilometragem Projetada para Atingimento do TWI:</span>
                    <span className={`font-mono font-black ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                      {metrologiaAtual.kmProjetadoTwi.toLocaleString('pt-BR')} km
                    </span>
                  </div>
                )}
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
      className={`group cursor-pointer transition-all duration-200 rounded-2xl p-2 sm:p-2.5 border shadow-sm ${
        isSelected
          ? (isDark ? 'ring-2 ring-red-500 scale-105 bg-slate-800 border-red-500/80' : 'ring-2 ring-red-500 scale-105 bg-red-50/90 border-red-400 shadow-md')
          : (isDark ? 'bg-slate-900/90 border-slate-700 hover:border-slate-500 hover:bg-slate-800/80' : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50')
      }`}
    >
      <div className="flex items-center gap-2">
        {/* Pneu Visual com Anel Cromático */}
        <div className={`w-8 h-12 rounded-lg flex flex-col items-center justify-center border-2 transition-all relative shrink-0 ${
          isCritico
            ? (isDark ? 'bg-red-950 border-red-500 text-red-400 animate-pulse' : 'bg-red-100 border-red-600 text-red-700 animate-pulse')
            : isAtencao
            ? (isDark ? 'bg-amber-950 border-amber-500 text-amber-400' : 'bg-amber-100 border-amber-500 text-amber-700')
            : (isDark ? 'bg-slate-950 border-emerald-500 text-emerald-400' : 'bg-emerald-50 border-emerald-500 text-emerald-700')
        }`}>
          <span className="font-mono font-black text-[10px]">{slot.posicao}</span>
          <span className="text-[7.5px] font-mono font-bold">{medicao.profundidade_sulco_mm.toFixed(1)}</span>
        </div>

        {/* Informações da Roda */}
        <div className="text-[10px] font-mono leading-tight min-w-0 flex-1">
          <span className={`font-bold block truncate max-w-[85px] ${
            isDark ? 'text-slate-200' : 'text-slate-800'
          }`} title={slot.label}>
            {slot.label}
          </span>
          <span className={`block text-[9px] ${
            isDark ? 'text-slate-400' : 'text-slate-500'
          }`}>
            {medicao.pressao_psi} PSI
          </span>
          <span className={`font-bold text-[9px] ${
            isCritico 
              ? (isDark ? 'text-red-400' : 'text-red-600') 
              : isAtencao 
              ? (isDark ? 'text-amber-400' : 'text-amber-600') 
              : (isDark ? 'text-emerald-400' : 'text-emerald-600')
          }`}>
            {medicao.percentual_vida_util.toFixed(0)}% vida
          </span>
        </div>
      </div>
    </div>
  );
};

export default MapeamentoPneusModal;
