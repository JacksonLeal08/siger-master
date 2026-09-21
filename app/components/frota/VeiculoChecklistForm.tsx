'use client';

import React, { useState, useMemo } from 'react';
import { 
  Viatura, 
  ChecklistVeicular, 
  ChecklistItemAvaliacao, 
  SistemaGrupoChecklist, 
  ParecerChecklist, 
  GravidadeAnomalia 
} from '@/lib/types/frota';
import { DualPhotoCapture } from './DualPhotoCapture';
import { 
  ClipboardCheck, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  AlertTriangle, 
  ShieldAlert, 
  ArrowLeft, 
  Sparkles, 
  Send, 
  MapPin, 
  User, 
  Gauge,
  Clock,
  Car,
  RefreshCw,
  Wrench
} from 'lucide-react';

interface VeiculoChecklistFormProps {
  viatura: Viatura;
  contratoId: string;
  theme?: 'light' | 'dark';
  onBack: () => void;
  onSubmitChecklist: (checklist: ChecklistVeicular) => Promise<{ success: boolean; error?: string; osId?: string }>;
  onSuccess?: (checklist: ChecklistVeicular) => void;
}

interface ItemDef {
  id: string;
  sistema: SistemaGrupoChecklist;
  nome: string;
  descricao?: string;
  condicional?: 'AMBULANCIA' | 'CAMINHONETE';
}

const ITENS_TAXONOMIA: ItemDef[] = [
  // 1. FREIOS & PARADA
  { id: 'freio_fluido', sistema: 'FREIOS', nome: 'Nível do fluido de freio (DOT 4 / 5.1)' },
  { id: 'freio_estacionamento', sistema: 'FREIOS', nome: 'Eficiência do freio de estacionamento (freio de mão)' },
  { id: 'freio_pedal', sistema: 'FREIOS', nome: 'Resposta do pedal (curso, firmeza, ausência de ruídos/vibrações)' },
  { id: 'freio_luz_painel', sistema: 'FREIOS', nome: 'Luz indicadora de desgaste de pastilhas / ABS no painel' },

  // 2. SUSPENSÃO & DIREÇÃO
  { id: 'susp_direcao_folga', sistema: 'SUSPENSAO', nome: 'Folga na caixa de direção e alinhamento do volante' },
  { id: 'susp_amortecedores', sistema: 'SUSPENSAO', nome: 'Amortecedores (ausência de vazamentos e estabilidade)' },
  { id: 'susp_ruidos_pivos', sistema: 'SUSPENSAO', nome: 'Pivôs, buchas de bandeja, barras e feixes de molas' },

  // 3. MOTOR & TRANSMISSÃO
  { id: 'motor_oleo', sistema: 'MOTOR_CAMBIO', nome: 'Nível e viscosidade visual do óleo lubrificante do motor' },
  { id: 'motor_arrefecimento', sistema: 'MOTOR_CAMBIO', nome: 'Líquido de arrefecimento e mangueiras do radiador' },
  { id: 'motor_transmissao', sistema: 'MOTOR_CAMBIO', nome: 'Engate de marchas e embreagem / câmbio automático' },
  { id: 'motor_4x4_reduzida', sistema: 'MOTOR_CAMBIO', nome: 'Sistema de tração 4x4 e reduzida', condicional: 'CAMINHONETE' },

  // 4. ELÉTRICA & ELETRÔNICA
  { id: 'elet_bateria_principal', sistema: 'ELETRICA', nome: 'Tensão e fixação da bateria (polos sem zinabre/oxidação)' },
  { id: 'elet_bateria_aux_inversor', sistema: 'ELETRICA', nome: 'Baterias auxiliares e inversor elétrico 110/220V', condicional: 'AMBULANCIA' },
  { id: 'elet_partida_alternador', sistema: 'ELETRICA', nome: 'Funcionamento do motor de partida e alternador' },
  { id: 'elet_painel_luzes_injecao', sistema: 'ELETRICA', nome: 'Painel e ausência de luzes de injeção (ECM)/avarias' },

  // 5. ILUMINAÇÃO & SINALIZAÇÃO DE EMERGÊNCIA
  { id: 'ilum_farois_lanternas', sistema: 'ILUMINACAO', nome: 'Faróis (baixo/alto), lanternas e luzes de freio' },
  { id: 'ilum_setas_alerta', sistema: 'ILUMINACAO', nome: 'Sinalizadores de direção (setas) e pisca-alerta' },
  { id: 'ilum_giroflex_leds', sistema: 'ILUMINACAO', nome: 'Giroflex / Barra de LED e estrobos perimetrais' },
  { id: 'ilum_sirene_megafone', sistema: 'ILUMINACAO', nome: 'Sirene acústica eletrônica e comandos do megafone/buzina' },

  // 6. PNEUS & RODAGEM (DIRETRIZ TWI)
  { id: 'pneus_calibracao', sistema: 'PNEUS', nome: 'Calibração dos pneus rodantes conforme recomendação PSI' },
  { id: 'pneus_estepe', sistema: 'PNEUS', nome: 'Estepe (calibrado, sem avarias e trava funcional)' },
  { id: 'pneus_sulco_twi', sistema: 'PNEUS', nome: 'Profundidade dos sulcos (aferição TWI ≥ 1,6 mm)' },

  // 7. EQUIPAMENTOS DE BORDO & ESTRUTURA
  { id: 'equip_cintos', sistema: 'EQUIPAMENTOS', nome: 'Cintos de segurança em todos os assentos (travamento retrátil)' },
  { id: 'equip_limpadores', sistema: 'EQUIPAMENTOS', nome: 'Limpadores de para-brisa, palhetas e esguicho d’água' },
  { id: 'equip_ferramentas_extintor', sistema: 'EQUIPAMENTOS', nome: 'Triângulo, macaco, chave de roda e extintor veicular' },
  { id: 'equip_espelhos_vidros', sistema: 'EQUIPAMENTOS', nome: 'Integridade de espelhos retrovisores, vidros e travas' },

  // 8. IMPLEMENTOS ESPECÍFICOS DE RESGATE / EMERGÊNCIA
  { id: 'impl_maca_oxigenio', sistema: 'IMPLEMENTOS_ESPECIFICOS', nome: 'Maca retrátil articulada e cilindro de oxigênio (pressão)', condicional: 'AMBULANCIA' },
  { id: 'impl_ar_cabine_medica', sistema: 'IMPLEMENTOS_ESPECIFICOS', nome: 'Ar-condicionado da cabine médica e armários de imobilização', condicional: 'AMBULANCIA' },
  { id: 'impl_guincho_pranchas', sistema: 'IMPLEMENTOS_ESPECIFICOS', nome: 'Guincho elétrico dianteiro e pranchas de desatolamento', condicional: 'CAMINHONETE' },
  { id: 'impl_kit_combate_engate', sistema: 'IMPLEMENTOS_ESPECIFICOS', nome: 'Kit de combate rápido e engate traseiro', condicional: 'CAMINHONETE' }
];

const SISTEMAS_NOMES: Record<SistemaGrupoChecklist, string> = {
  FREIOS: '1. Sistema de Freios & Parada',
  SUSPENSAO: '2. Suspensão, Direção & Alinhamento',
  MOTOR_CAMBIO: '3. Motor, Transmissão & Fluídos',
  ELETRICA: '4. Sistema Elétrico & Eletrônico',
  ILUMINACAO: '5. Iluminação & Sinalização de Emergência',
  PNEUS: '6. Pneus, Rodagem & Estepe (TWI)',
  EQUIPAMENTOS: '7. Equipamentos de Bordo & Estrutura',
  IMPLEMENTOS_ESPECIFICOS: '8. Implementos Específicos de Emergência'
};

export const VeiculoChecklistForm: React.FC<VeiculoChecklistFormProps> = ({
  viatura,
  contratoId,
  theme = 'dark',
  onBack,
  onSubmitChecklist,
  onSuccess
}) => {
  const isDark = theme === 'dark';
  const tipoVeiculoNormalized = (viatura.tipo_veiculo || '').toUpperCase();
  const isAmbulancia = tipoVeiculoNormalized.includes('AMBULANCIA') || tipoVeiculoNormalized.includes('RESGATE');

  // Filtrar itens de acordo com a categoria da viatura
  const itensAplicaveis = useMemo(() => {
    return ITENS_TAXONOMIA.filter(item => {
      if (!item.condicional) return true;
      if (item.condicional === 'AMBULANCIA') return isAmbulancia;
      if (item.condicional === 'CAMINHONETE') return !isAmbulancia;
      return true;
    });
  }, [isAmbulancia]);

  // Agrupar itens por sistema
  const itensPorSistema = useMemo(() => {
    const grupos: Record<SistemaGrupoChecklist, ItemDef[]> = {
      FREIOS: [],
      SUSPENSAO: [],
      MOTOR_CAMBIO: [],
      ELETRICA: [],
      ILUMINACAO: [],
      PNEUS: [],
      EQUIPAMENTOS: [],
      IMPLEMENTOS_ESPECIFICOS: []
    };

    itensAplicaveis.forEach(item => {
      grupos[item.sistema].push(item);
    });

    return grupos;
  }, [itensAplicaveis]);

  // Estados do Formulário
  const [tecnicoNome, setTecnicoNome] = useState('');
  const [odometro, setOdometro] = useState(String((viatura.odometro_atual_km || 0) + 50));
  const [horimetro, setHorimetro] = useState('');
  const [observacoesGerais, setObservacoesGerais] = useState('');
  const [geoLoc, setGeoLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [erroGeral, setErroGeral] = useState<string | null>(null);

  // Estado do Modal Executivo de Progresso de Transmissão
  const [progressModal, setProgressModal] = useState<{
    isOpen: boolean;
    step: 1 | 2 | 3 | 4 | 5; // 1: validando, 2: fotos, 3: transmitindo, 4: concluído, 5: erro
    statusText: string;
    percent: number;
    osId?: string;
    error?: string;
  }>({
    isOpen: false,
    step: 1,
    statusText: '',
    percent: 0
  });
  const [lastPayload, setLastPayload] = useState<ChecklistVeicular | null>(null);

  // Estados dos Itens: itemId -> { parecer, gravidade, descricao, foto1, foto2 }
  const [respostas, setRespostas] = useState<Record<string, {
    parecer: ParecerChecklist;
    gravidade?: GravidadeAnomalia;
    descricao?: string;
    foto1?: string | null;
    foto2?: string | null;
  }>>({});

  // Captura automática de GPS na montagem
  React.useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setGeoLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.warn('[ChecklistForm] GPS indisponível:', err.message),
        { timeout: 8000, enableHighAccuracy: true }
      );
    }
  }, []);

  // Marcar Todos como Conforme
  const handleMarcarTodosConforme = () => {
    const novasRespostas: typeof respostas = {};
    itensAplicaveis.forEach(item => {
      novasRespostas[item.id] = {
        parecer: 'CONFORME'
      };
    });
    setRespostas(novasRespostas);
  };

  // Alterar parecer de um item
  const handleSetParecer = (itemId: string, parecer: ParecerChecklist) => {
    setRespostas(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        parecer,
        gravidade: parecer === 'NAO_CONFORME' ? (prev[itemId]?.gravidade || 'MEDIA') : undefined,
        descricao: parecer === 'NAO_CONFORME' ? (prev[itemId]?.descricao || '') : undefined,
        foto1: parecer === 'NAO_CONFORME' ? (prev[itemId]?.foto1 || null) : null,
        foto2: parecer === 'NAO_CONFORME' ? (prev[itemId]?.foto2 || null) : null
      }
    }));
  };

  // Alterar detalhes da anomalia
  const handleSetAnomalia = (itemId: string, field: 'gravidade' | 'descricao' | 'foto1' | 'foto2', value: any) => {
    setRespostas(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value
      }
    }));
  };

  // Métricas do Checklist em tempo real
  const metricas = useMemo(() => {
    const total = itensAplicaveis.length;
    let conformes = 0;
    let naoConformes = 0;
    let na = 0;
    let criticos = 0;

    itensAplicaveis.forEach(item => {
      const resp = respostas[item.id];
      if (resp?.parecer === 'CONFORME') conformes++;
      else if (resp?.parecer === 'NAO_CONFORME') {
        naoConformes++;
        if (resp.gravidade === 'CRITICA') criticos++;
      }
      else if (resp?.parecer === 'NA') na++;
    });

    const avaliados = conformes + naoConformes;
    const percentual = avaliados > 0 ? Math.round((conformes / avaliados) * 100) : 100;

    let statusAprovacao: 'APROVADO' | 'ATENCAO' | 'INTERDITADO' = 'APROVADO';
    if (criticos > 0) {
      statusAprovacao = 'INTERDITADO';
    } else if (naoConformes > 0) {
      statusAprovacao = 'ATENCAO';
    }

    return { total, conformes, naoConformes, na, percentual, criticos, statusAprovacao };
  }, [itensAplicaveis, respostas]);

  // Validação e Envio com Popup de Progresso em Tempo Real
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroGeral(null);

    if (!tecnicoNome.trim()) {
      setErroGeral('Informe o nome do condutor ou técnico avaliador.');
      return;
    }

    const odoNum = parseFloat(odometro);
    if (isNaN(odoNum) || odoNum <= 0) {
      setErroGeral('Informe a quilometragem atual do odômetro.');
      return;
    }

    // Verificar se todos os itens foram respondidos
    const itensPendentes = itensAplicaveis.filter(i => !respostas[i.id]?.parecer);
    if (itensPendentes.length > 0) {
      setErroGeral(`Existem ${itensPendentes.length} itens sem avaliação. Utilize o botão "Marcar Todos como Conforme" se apropriado.`);
      return;
    }

    // Verificar se anomalias possuem descrição e as 2 fotos
    for (const item of itensAplicaveis) {
      const r = respostas[item.id];
      if (r?.parecer === 'NAO_CONFORME') {
        if (!r.descricao || r.descricao.trim().length < 5) {
          setErroGeral(`Descreva detalhadamente a não conformidade no item: "${item.nome}".`);
          return;
        }
        if (!r.foto1 || !r.foto2) {
          setErroGeral(`É obrigatório anexar as 2 FOTOS (Visão Geral + Detalhe) para o item com anomalia: "${item.nome}".`);
          return;
        }
      }
    }

    // Abre o Popup de Progresso em Tempo Real
    setIsSubmitting(true);
    setProgressModal({
      isOpen: true,
      step: 1,
      statusText: 'Validando integridade dos dados e coordenadas GPS...',
      percent: 25
    });

    const itensAvaliacao: ChecklistItemAvaliacao[] = itensAplicaveis.map(item => {
      const r = respostas[item.id] || { parecer: 'CONFORME' };
      return {
        sistema_grupo: item.sistema,
        item_nome: item.nome,
        parecer: r.parecer,
        gravidade_anomalia: r.parecer === 'NAO_CONFORME' ? (r.gravidade || 'MEDIA') : null,
        observacao_anomalia: r.parecer === 'NAO_CONFORME' ? (r.descricao || null) : null,
        foto_evidencia_1_url: r.parecer === 'NAO_CONFORME' ? (r.foto1 || null) : null,
        foto_evidencia_2_url: r.parecer === 'NAO_CONFORME' ? (r.foto2 || null) : null
      };
    });

    const checklistPayload: ChecklistVeicular = {
      contrato_id: contratoId,
      viatura_id: viatura.id,
      tecnico_nome: tecnicoNome.trim(),
      tipo_checklist: 'DIARIO_PREVENTIVO',
      odometro_km: odoNum,
      horimetro: horimetro ? parseFloat(horimetro) : null,
      status_aprovacao: metricas.statusAprovacao,
      percentual_conformidade: metricas.percentual,
      total_itens: metricas.total,
      total_conformes: metricas.conformes,
      total_nao_conformes: metricas.naoConformes,
      latitude: geoLoc?.lat || null,
      longitude: geoLoc?.lng || null,
      observacoes_gerais: observacoesGerais.trim() || null,
      itens: itensAvaliacao
    };
    setLastPayload(checklistPayload);

    // Passo 2: Otimização de Imagens e Laudo
    await new Promise(r => setTimeout(r, 250));
    setProgressModal(prev => ({
      ...prev,
      step: 2,
      statusText: 'Otimizando laudo pericial e fotos de evidência...',
      percent: 50
    }));

    // Passo 3: Gravação na Central
    await new Promise(r => setTimeout(r, 250));
    setProgressModal(prev => ({
      ...prev,
      step: 3,
      statusText: 'Transmitindo laudo e sincronizando com a central...',
      percent: 80
    }));

    try {
      const res = await onSubmitChecklist(checklistPayload);
      if (res.success) {
        setProgressModal(prev => ({
          ...prev,
          step: 4,
          statusText: 'Checklist transmitido e homologado com sucesso!',
          percent: 100,
          osId: res.osId
        }));
        setIsSubmitting(false);
      } else {
        setProgressModal(prev => ({
          ...prev,
          step: 5,
          statusText: 'Falha no envio',
          percent: 100,
          error: res.error || 'Falha ao processar checklist veicular na central.'
        }));
        setIsSubmitting(false);
      }
    } catch (err: any) {
      setProgressModal(prev => ({
        ...prev,
        step: 5,
        statusText: 'Falha de comunicação',
        percent: 100,
        error: err?.message || 'Erro inesperado ao salvar checklist no banco de dados.'
      }));
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`min-h-screen pb-24 select-none ${
      isDark ? 'bg-zinc-950 text-zinc-100' : 'bg-slate-100 text-slate-900'
    }`} translate="no">
      {/* Header Fixo */}
      <div className={`sticky top-0 z-30 px-4 py-3 border-b backdrop-blur-md flex items-center justify-between shadow-xs ${
        isDark ? 'bg-zinc-900/90 border-zinc-800' : 'bg-white/95 border-slate-300'
      }`}>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className={`p-2 rounded-xl border transition-colors ${
              isDark ? 'bg-zinc-800/80 border-zinc-700 text-zinc-300 hover:bg-zinc-800' : 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100 shadow-2xs'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black tracking-wider uppercase text-red-500">
                {viatura.prefixo_frota} • {viatura.placa}
              </span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                metricas.statusAprovacao === 'INTERDITADO'
                  ? 'bg-red-600 text-white'
                  : metricas.statusAprovacao === 'ATENCAO'
                    ? 'bg-amber-500 text-zinc-950'
                    : 'bg-emerald-600 text-white'
              }`}>
                {metricas.percentual}% CONFORME
              </span>
            </div>
            <h1 className="text-xs font-bold font-mono text-zinc-400">CHECKLIST TÉCNICO VEICULAR</h1>
          </div>
        </div>

        <button
          type="button"
          onClick={handleMarcarTodosConforme}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all active:scale-95 shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Todos Conforme</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto p-4 space-y-5">
        {/* Bloco de Identificação e Odômetro */}
        <div className={`p-4 rounded-2xl border space-y-3 ${
          isDark ? 'bg-zinc-900 border-zinc-800 shadow-md' : 'bg-white border-slate-300 shadow-sm'
        }`}>
          <div className="text-xs font-black tracking-wider uppercase text-zinc-400 flex items-center gap-2">
            <Gauge className="w-4 h-4 text-red-500" />
            <span>Dados da Vistoria em Campo</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={`block text-[11px] font-bold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                Condutor / Técnico Vistoriador *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  required
                  placeholder="Nome completo do vistoriador"
                  value={tecnicoNome}
                  onChange={(e) => setTecnicoNome(e.target.value)}
                  className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border focus:outline-none focus:border-red-500 font-semibold ${
                    isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-100 placeholder:text-zinc-600' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className={`block text-[11px] font-bold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                Odômetro Atual (Km) *
              </label>
              <div className="relative">
                <Gauge className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="number"
                  required
                  min="0"
                  step="1"
                  placeholder="Ex: 45200"
                  value={odometro}
                  onChange={(e) => setOdometro(e.target.value)}
                  className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border focus:outline-none focus:border-red-500 font-mono font-bold ${
                    isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-100 placeholder:text-zinc-600' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400'
                  }`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Alerta de Erro Geral */}
        {erroGeral && (
          <div className="p-3 rounded-xl bg-red-600/20 border border-red-500 text-red-400 text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{erroGeral}</span>
          </div>
        )}

        {/* ==================================================================== */}
        {/* OS 8 SISTEMAS AUTOMOTIVOS */}
        {/* ==================================================================== */}
        {(Object.keys(itensPorSistema) as SistemaGrupoChecklist[]).map((grupoKey) => {
          const itensGrupo = itensPorSistema[grupoKey];
          if (itensGrupo.length === 0) return null;

          return (
            <div key={grupoKey} className={`p-4 rounded-2xl border space-y-3 ${
              isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-300 shadow-xs'
            }`}>
              <div className="border-b pb-2 flex items-center justify-between border-zinc-800 dark:border-zinc-800">
                <h3 className={`text-xs font-black tracking-wide uppercase ${
                  isDark ? 'text-zinc-200' : 'text-slate-900'
                }`}>
                  {SISTEMAS_NOMES[grupoKey]}
                </h3>
                <span className="text-[10px] font-mono text-zinc-500">
                  {itensGrupo.length} {itensGrupo.length > 1 ? 'itens' : 'item'}
                </span>
              </div>

              <div className="space-y-3">
                {itensGrupo.map((item) => {
                  const resp = respostas[item.id];
                  const parecerAtual = resp?.parecer;
                  const isNaoConforme = parecerAtual === 'NAO_CONFORME';

                  return (
                    <div 
                      key={item.id}
                      className={`p-3 rounded-xl border transition-all ${
                        isNaoConforme
                          ? isDark ? 'bg-red-950/20 border-red-500/50 shadow-xs' : 'bg-red-50/50 border-red-400 shadow-xs'
                          : parecerAtual === 'CONFORME'
                            ? isDark ? 'bg-zinc-950/40 border-zinc-850' : 'bg-slate-50/70 border-slate-200'
                            : isDark ? 'bg-zinc-950/20 border-zinc-800' : 'bg-slate-50/30 border-slate-200'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="flex-1">
                          <span className={`text-xs font-bold ${
                            isDark ? 'text-zinc-100' : 'text-slate-900'
                          }`}>
                            {item.nome}
                          </span>
                          {item.condicional && (
                            <span className="ml-2 text-[9px] font-bold font-mono uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                              {item.condicional}
                            </span>
                          )}
                        </div>

                        {/* Botões Tri-State Táteis */}
                        <div className="grid grid-cols-3 gap-1.5 w-full sm:w-auto">
                          <button
                            type="button"
                            onClick={() => handleSetParecer(item.id, 'CONFORME')}
                            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-all active:scale-95 ${
                              parecerAtual === 'CONFORME'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : isDark
                                  ? 'bg-zinc-800/60 text-zinc-400 hover:text-zinc-200 border border-zinc-700/60'
                                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-300'
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>C</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSetParecer(item.id, 'NAO_CONFORME')}
                            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-all active:scale-95 ${
                              isNaoConforme
                                ? 'bg-red-600 text-white shadow-xs'
                                : isDark
                                  ? 'bg-zinc-800/60 text-zinc-400 hover:text-zinc-200 border border-zinc-700/60'
                                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-300'
                            }`}
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>NC</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSetParecer(item.id, 'NA')}
                            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-all active:scale-95 ${
                              parecerAtual === 'NA'
                                ? isDark ? 'bg-zinc-700 text-white' : 'bg-slate-600 text-white'
                                : isDark
                                  ? 'bg-zinc-800/60 text-zinc-400 hover:text-zinc-200 border border-zinc-700/60'
                                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-300'
                            }`}
                          >
                            <span>N/A</span>
                          </button>
                        </div>
                      </div>

                      {/* Container Expansível de Não Conformidade & Fotos Duplas */}
                      {isNaoConforme && (
                        <div className={`mt-3 pt-3 border-t space-y-3 animate-in fade-in ${
                          isDark ? 'border-red-900/40' : 'border-red-200'
                        }`}>
                          {/* Seletor de Gravidade */}
                          <div>
                            <span className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${
                              isDark ? 'text-zinc-300' : 'text-slate-700'
                            }`}>
                              Classificação da Gravidade:
                            </span>
                            <div className="grid grid-cols-3 gap-2">
                              {(['LEVE', 'MEDIA', 'CRITICA'] as GravidadeAnomalia[]).map((grav) => {
                                const isSelected = (resp?.gravidade || 'MEDIA') === grav;
                                return (
                                  <button
                                    key={grav}
                                    type="button"
                                    onClick={() => handleSetAnomalia(item.id, 'gravidade', grav)}
                                    className={`py-1.5 px-2 rounded-lg text-[10px] font-bold tracking-wider uppercase border transition-all ${
                                      isSelected
                                        ? grav === 'CRITICA'
                                          ? 'bg-red-600 text-white border-red-600 font-black'
                                          : grav === 'MEDIA'
                                            ? 'bg-amber-500 text-zinc-950 border-amber-500 font-black'
                                            : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40'
                                        : isDark
                                          ? 'bg-zinc-900 border-zinc-800 text-zinc-400'
                                          : 'bg-white border-slate-300 text-slate-600'
                                    }`}
                                  >
                                    {grav === 'CRITICA' ? 'Impeditiva' : grav === 'MEDIA' ? 'Média (OS)' : 'Leve'}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Descrição Obrigatória da Anomalia */}
                          <div>
                            <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${
                              isDark ? 'text-zinc-300' : 'text-slate-700'
                            }`}>
                              Descrição da Anomalia Identificada *
                            </label>
                            <textarea
                              rows={2}
                              required
                              placeholder="Descreva detalhadamente a avaria, vazamento, ruído ou defeito visual..."
                              value={resp?.descricao || ''}
                              onChange={(e) => handleSetAnomalia(item.id, 'descricao', e.target.value)}
                              className={`w-full p-2.5 text-xs rounded-xl border focus:outline-none focus:border-red-500 ${
                                isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-100 placeholder:text-zinc-600' : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 shadow-2xs'
                              }`}
                            />
                          </div>

                          {/* Componente Obrigatório de Foto Dupla */}
                          <DualPhotoCapture
                            fotoGeral={resp?.foto1 || null}
                            fotoDetalhe={resp?.foto2 || null}
                            onChangeFotoGeral={(url) => handleSetAnomalia(item.id, 'foto1', url)}
                            onChangeFotoDetalhe={(url) => handleSetAnomalia(item.id, 'foto2', url)}
                            required={true}
                            theme={theme}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Observações Finais */}
        <div className={`p-4 rounded-2xl border space-y-2 ${
          isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-300 shadow-xs'
        }`}>
          <label className={`block text-xs font-bold uppercase tracking-wide ${
            isDark ? 'text-zinc-200' : 'text-slate-900'
          }`}>
            Observações Gerais da Vistoria (Opcional)
          </label>
          <textarea
            rows={3}
            placeholder="Comentários adicionais sobre a rota, tempo, condições de tráfego na mina ou recomendações..."
            value={observacoesGerais}
            onChange={(e) => setObservacoesGerais(e.target.value)}
            className={`w-full p-2.5 text-xs rounded-xl border focus:outline-none focus:border-red-500 ${
              isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-100 placeholder:text-zinc-600' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400'
            }`}
          />
        </div>

        {/* Botão Flutuante de Envio */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 rounded-2xl bg-red-600 hover:bg-red-700 active:scale-[0.98] transition-all text-white font-black text-sm tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Processando Laudo & Evidências...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Homologar e Salvar Checklist ({metricas.percentual}% Conforme)</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Modal de Progresso e Confirmação de Transmissão */}
      {progressModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
          <div className={`w-full max-w-md rounded-3xl border p-6 shadow-2xl space-y-5 transition-all ${
            isDark ? 'bg-zinc-900 border-zinc-700 text-zinc-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            {/* Ícone de Topo e Status */}
            <div className="flex flex-col items-center text-center space-y-2">
              {progressModal.step === 4 ? (
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-500 shadow-lg shadow-emerald-500/20 animate-bounce-subtle">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
              ) : progressModal.step === 5 ? (
                <div className="w-16 h-16 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-500 shadow-lg shadow-red-500/20">
                  <XCircle className="w-8 h-8" />
                </div>
              ) : (
                <div className="relative w-16 h-16 rounded-2xl bg-red-600/10 border border-red-600/30 flex items-center justify-center text-red-500 shadow-lg shadow-red-600/10">
                  <RefreshCw className="w-8 h-8 animate-spin" />
                </div>
              )}

              <h3 className="text-base font-black uppercase tracking-wider">
                {progressModal.step === 4
                  ? 'Checklist Homologado!'
                  : progressModal.step === 5
                    ? 'Falha na Transmissão'
                    : 'Processando Vistoria'}
              </h3>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-red-500">
                  {viatura.prefixo_frota}
                </span>
                <span className="text-xs text-zinc-500">•</span>
                <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full font-bold ${
                  metricas.statusAprovacao === 'INTERDITADO'
                    ? 'bg-red-600 text-white'
                    : metricas.statusAprovacao === 'ATENCAO'
                      ? 'bg-amber-500 text-zinc-950'
                      : 'bg-emerald-600 text-white'
                }`}>
                  {metricas.statusAprovacao} ({metricas.percentual}%)
                </span>
              </div>
            </div>

            {/* Barra de Progresso Animada */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-mono font-bold">
                <span className={isDark ? 'text-zinc-400' : 'text-slate-500'}>Progresso</span>
                <span className="text-red-500 font-black">{progressModal.percent}%</span>
              </div>
              <div className={`w-full h-3 rounded-full overflow-hidden p-0.5 border ${
                isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-100 border-slate-300'
              }`}>
                <div 
                  className={`h-full rounded-full transition-all duration-300 ${
                    progressModal.step === 4
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-sm shadow-emerald-500/50'
                      : progressModal.step === 5
                        ? 'bg-red-600'
                        : 'bg-gradient-to-r from-amber-500 via-red-500 to-red-600 animate-pulse'
                  }`}
                  style={{ width: `${progressModal.percent}%` }}
                />
              </div>
              <p className={`text-xs text-center font-medium ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                {progressModal.statusText}
              </p>
            </div>

            {/* Etapas Visuais */}
            <div className={`p-3.5 rounded-2xl border text-xs space-y-2.5 ${
              isDark ? 'bg-zinc-950/60 border-zinc-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center gap-2.5">
                {progressModal.step >= 2 ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-red-500 border-t-transparent animate-spin shrink-0" />
                )}
                <span className={`text-xs ${progressModal.step >= 2 ? (isDark ? 'text-zinc-300 font-semibold' : 'text-slate-700 font-semibold') : 'text-zinc-500'}`}>
                  1. Validação de regras e telemetria GPS
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                {progressModal.step >= 3 ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : progressModal.step === 2 ? (
                  <div className="w-4 h-4 rounded-full border-2 border-red-500 border-t-transparent animate-spin shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-zinc-700 shrink-0" />
                )}
                <span className={`text-xs ${progressModal.step >= 3 ? (isDark ? 'text-zinc-300 font-semibold' : 'text-slate-700 font-semibold') : progressModal.step === 2 ? 'text-red-500 font-semibold' : 'text-zinc-500'}`}>
                  2. Otimização de fotos e evidências
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                {progressModal.step >= 4 ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : progressModal.step === 3 ? (
                  <div className="w-4 h-4 rounded-full border-2 border-red-500 border-t-transparent animate-spin shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-zinc-700 shrink-0" />
                )}
                <span className={`text-xs ${progressModal.step >= 4 ? (isDark ? 'text-zinc-300 font-semibold' : 'text-slate-700 font-semibold') : progressModal.step === 3 ? 'text-red-500 font-semibold' : 'text-zinc-500'}`}>
                  3. Transmissão para a Central e Nuvem
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                {progressModal.step === 4 ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-zinc-700 shrink-0" />
                )}
                <span className={`text-xs ${progressModal.step === 4 ? 'text-emerald-500 font-bold' : 'text-zinc-500'}`}>
                  4. Registro e geração de laudo oficial
                </span>
              </div>
            </div>

            {/* Alerta de Ordem de Serviço Gerada Automaticamente */}
            {progressModal.osId && (
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-500 shrink-0">
                  <Wrench className="w-5 h-5" />
                </div>
                <div className="text-left space-y-0.5">
                  <span className="text-[10px] font-mono uppercase text-amber-500 font-black">
                    Ordem de Serviço Automática
                  </span>
                  <p className="text-xs font-mono font-bold text-zinc-200">
                    O.S. ID: {progressModal.osId.slice(0, 8)}...
                  </p>
                </div>
              </div>
            )}

            {/* Mensagem de Erro se houver */}
            {progressModal.error && (
              <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{progressModal.error}</span>
              </div>
            )}

            {/* Botões de Ação */}
            {progressModal.step === 4 && (
              <button
                type="button"
                onClick={() => {
                  setProgressModal(prev => ({ ...prev, isOpen: false }));
                  if (onSuccess && lastPayload) {
                    onSuccess(lastPayload);
                  } else {
                    onBack();
                  }
                }}
                className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] transition-all text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Concluir e Voltar ao Hub</span>
              </button>
            )}

            {progressModal.step === 5 && (
              <button
                type="button"
                onClick={() => setProgressModal(prev => ({ ...prev, isOpen: false }))}
                className="w-full py-3.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 active:scale-[0.98] transition-all text-zinc-200 font-bold text-xs uppercase tracking-wider cursor-pointer"
              >
                Fechar e Tentar Novamente
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
