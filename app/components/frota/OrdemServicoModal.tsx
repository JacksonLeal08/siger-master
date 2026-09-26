'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Viatura, 
  OrdemServicoFrota, 
  OficinaPrestador, 
  TipoOrdemServico, 
  NaturezaManutencao, 
  StatusOrdemServico,
  ItemChecklistOs,
  NotaFiscalAnexo,
  DocumentoAnexo
} from '@/lib/types/frota';
import { saveOrdemServicoAction, listOficinasAction } from '@/app/actions/frotaActions';
import { soundNotificationService } from '@/lib/soundNotificationService';
import { compressImage } from '@/lib/imageCompressor';
import { 
  Wrench, 
  Minus, 
  Maximize2, 
  Minimize2, 
  X, 
  Plus, 
  Trash2, 
  Printer, 
  CheckCircle2, 
  DollarSign,
  FileText,
  Upload,
  ExternalLink,
  Receipt,
  FileSpreadsheet,
  AlertCircle,
  Truck,
  Disc,
  Clock,
  Check,
  ChevronRight,
  Camera,
  Sparkles,
  Paperclip,
  Layers
} from 'lucide-react';
import { VehicleAnatomySelector } from './VehicleAnatomySelector';
import { SubcomponenteSelecionado, formatarResumoAnatomico } from '@/lib/types/vehicleAnatomy';
import { CriticidadeOS } from '@/lib/types/osWorkflow';

interface OrdemServicoModalProps {
  isOpen: boolean;
  viatura?: Viatura | null;
  viaturas?: Viatura[];
  contratoId: string;
  osToEdit?: OrdemServicoFrota | null;
  onClose: () => void;
  onMinimize?: () => void;
  onSuccess: (saved: OrdemServicoFrota) => void;
}

const ETAPAS_STATUS: { id: StatusOrdemServico; label: string; desc: string; icon: any; color: string }[] = [
  { id: 'ABERTA', label: 'Aberta', desc: 'Triagem inicial', icon: Clock, color: 'text-amber-500 bg-amber-500/10 border-amber-500/30' },
  { id: 'EM_ORCAMENTO', label: 'Em Orçamento', desc: 'Coleta de cotações', icon: FileSpreadsheet, color: 'text-blue-500 bg-blue-500/10 border-blue-500/30' },
  { id: 'APROVADA', label: 'Aprovada', desc: 'Autorizada p/ execução', icon: CheckCircle2, color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/30' },
  { id: 'EM_EXECUCAO', label: 'Em Execução', desc: 'Na oficina / base', icon: Wrench, color: 'text-orange-500 bg-orange-500/10 border-orange-500/30' },
  { id: 'CONCLUIDA', label: 'Concluída', desc: 'Notas e rateio ok', icon: Receipt, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30' },
];

export const OrdemServicoModal: React.FC<OrdemServicoModalProps> = ({
  isOpen,
  viatura,
  viaturas = [],
  contratoId,
  osToEdit,
  onClose,
  onMinimize,
  onSuccess
}) => {
  const [isMaximized, setIsMaximized] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [oficinas, setOficinas] = useState<OficinaPrestador[]>([]);
  const [modalTab, setModalTab] = useState<'DADOS' | 'ORCAMENTOS' | 'RATEIO_NOTAS'>('DADOS');

  // Viatura Selecionada
  const [selectedViaturaId, setSelectedViaturaId] = useState<string>('');

  // Form states
  const [numeroOs, setNumeroOs] = useState(`OS-${Date.now().toString().slice(-6)}`);
  const [tipoOs, setTipoOs] = useState<TipoOrdemServico>('EXTERNA');
  const [oficinaId, setOficinaId] = useState<string>('');
  const [natureza, setNatureza] = useState<NaturezaManutencao>('PREVENTIVA');
  const [odometro, setOdometro] = useState<string>('0');
  const [descricao, setDescricao] = useState('');
  const [status, setStatus] = useState<StatusOrdemServico>('ABERTA');
  
  // Governança, Criticidade e Anatomia Veicular
  const [prioridade, setPrioridade] = useState<CriticidadeOS>('NORMAL');
  const [subcomponentes, setSubcomponentes] = useState<SubcomponenteSelecionado[]>([]);
  const [resumoAnatomico, setResumoAnatomico] = useState<string>('');

  // Rateio de Custos
  const [custoPecas, setCustoPecas] = useState<string>('0');
  const [custoMaoObra, setCustoMaoObra] = useState<string>('0');
  const [custoPneus, setCustoPneus] = useState<string>('0');

  // Anexos
  const [orcamentos, setOrcamentos] = useState<DocumentoAnexo[]>([]);
  const [notasFiscais, setNotasFiscais] = useState<NotaFiscalAnexo[]>([]);
  const [comprovantesUrls, setComprovantesUrls] = useState<string[]>([]);
  const fotoEvidenciaRef = useRef<HTMLInputElement>(null);

  // Novo Orçamento Form
  const [novoOrcTitulo, setNovoOrcTitulo] = useState('');
  const [novoOrcValor, setNovoOrcValor] = useState('');
  const orcFileInputRef = useRef<HTMLInputElement>(null);

  // Nova NF Form
  const [novaNfTipo, setNovaNfTipo] = useState<'SERVICO' | 'PECA' | 'PNEU' | 'GERAL'>('SERVICO');
  const [novaNfNumero, setNovaNfNumero] = useState('');
  const [novaNfValor, setNovaNfValor] = useState('');
  const nfFileInputRef = useRef<HTMLInputElement>(null);

  // Checklist de itens
  const [checklist, setChecklist] = useState<ItemChecklistOs[]>([
    { id: '1', descricao: 'Substituição de óleo lubrificante e filtros', concluido: true },
    { id: '2', descricao: 'Revisão das pastilhas e discos de freio', concluido: false },
    { id: '3', descricao: 'Verificação do sistema elétrico e iluminação de emergência', concluido: false }
  ]);
  const [novoItemDesc, setNovoItemDesc] = useState('');

  // Viatura ativa efetiva
  const activeViatura = useMemo(() => {
    if (viatura) return viatura;
    return viaturas.find(v => v.id === selectedViaturaId) || null;
  }, [viatura, viaturas, selectedViaturaId]);

  useEffect(() => {
    listOficinasAction(contratoId).then(res => {
      if (res.success && res.data) {
        setOficinas(res.data);
        if (res.data.length > 0 && !oficinaId) {
          setOficinaId(res.data[0].id);
        }
      }
    });
  }, [contratoId]);

  useEffect(() => {
    if (osToEdit) {
      setNumeroOs(osToEdit.numero_os);
      setSelectedViaturaId(osToEdit.viatura_id);
      setTipoOs(osToEdit.tipo_os || 'EXTERNA');
      setOficinaId(osToEdit.oficina_id || '');
      setNatureza(osToEdit.natureza_manutencao || 'PREVENTIVA');
      setPrioridade(((osToEdit.prioridade || 'NORMAL').toUpperCase()) as CriticidadeOS);
      setSubcomponentes((osToEdit as any).itens_componentes_json || []);
      setResumoAnatomico(osToEdit.resumo_anatomico || '');
      setOdometro(String(osToEdit.odometro_km || 0));
      setDescricao(osToEdit.descricao_servico || osToEdit.descricao_motivo || '');
      setCustoPecas(String(osToEdit.custo_pecas || 0));
      setCustoMaoObra(String(osToEdit.custo_mao_de_obra || 0));
      setCustoPneus(String(osToEdit.custo_pneus || 0));
      
      const s = (osToEdit.status_os || osToEdit.status || 'ABERTA') as StatusOrdemServico;
      setStatus(s === 'EM_ANDAMENTO' ? 'EM_EXECUCAO' : s);
      setChecklist(osToEdit.itens_checklist || []);
      setOrcamentos(osToEdit.orcamentos_json || []);
      setNotasFiscais(osToEdit.notas_fiscais_json || []);
      setComprovantesUrls(osToEdit.comprovantes_urls || []);
    } else {
      setNumeroOs(`OS-${Date.now().toString().slice(-6)}`);
      setSelectedViaturaId(viatura?.id || (viaturas.length > 0 ? viaturas[0].id : ''));
      setTipoOs('EXTERNA');
      setNatureza('PREVENTIVA');
      setPrioridade('NORMAL');
      setSubcomponentes([]);
      setResumoAnatomico('');
      setOdometro(String(viatura?.odometro_atual_km || 0));
      setDescricao('');
      setCustoPecas('0');
      setCustoMaoObra('0');
      setCustoPneus('0');
      setStatus('ABERTA');
      setOrcamentos([]);
      setNotasFiscais([]);
      setComprovantesUrls([]);
    }
  }, [osToEdit, isOpen, viatura, viaturas]);

  const custoTotal = useMemo(() => {
    const p = parseFloat(custoPecas) || 0;
    const m = parseFloat(custoMaoObra) || 0;
    const pn = parseFloat(custoPneus) || 0;
    return (p + m + pn).toFixed(2);
  }, [custoPecas, custoMaoObra, custoPneus]);

  if (!isOpen) return null;

  // Processamento de Upload de Documentos (PDF ou Imagem)
  const processFileUpload = async (file: File): Promise<string> => {
    if (file.type.startsWith('image/')) {
      const res = await compressImage(file, { maxWidth: 1280, quality: 0.75 });
      return res.base64;
    }
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Adicionar Orçamento
  const handleAddOrcamento = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    try {
      const dataUrl = await processFileUpload(file);
      const novoOrc: DocumentoAnexo = {
        id: Date.now().toString(),
        tipo: 'ORCAMENTO',
        titulo: novoOrcTitulo.trim() || file.name,
        valor_estimado: parseFloat(novoOrcValor) || undefined,
        url: dataUrl,
        nome_arquivo: file.name,
        data_upload: new Date().toISOString()
      };
      setOrcamentos(prev => [...prev, novoOrc]);
      setNovoOrcTitulo('');
      setNovoOrcValor('');
      if (orcFileInputRef.current) orcFileInputRef.current.value = '';
      soundNotificationService.playSuccessSound();
    } catch (err) {
      console.error(err);
      alert('Falha ao processar arquivo do orçamento.');
    }
  };

  // Adicionar Foto de Evidência / Avaria
  const handleAddEvidenciaFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      const dataUrl = await processFileUpload(files[0]);
      setComprovantesUrls(prev => [...prev, dataUrl]);
      if (fotoEvidenciaRef.current) fotoEvidenciaRef.current.value = '';
      soundNotificationService.playSuccessSound();
    } catch (err) {
      console.error(err);
      alert('Falha ao processar foto de evidência.');
    }
  };

  // Adicionar Nota Fiscal
  const handleAddNotaFiscal = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    if (!novaNfNumero.trim()) {
      alert('Informe o Número da Nota Fiscal antes de anexar o documento.');
      if (nfFileInputRef.current) nfFileInputRef.current.value = '';
      return;
    }

    try {
      const dataUrl = await processFileUpload(file);
      const novaNf: NotaFiscalAnexo = {
        id: Date.now().toString(),
        tipo: novaNfTipo,
        numero_nf: novaNfNumero.trim(),
        valor: parseFloat(novaNfValor) || 0,
        url: dataUrl,
        nome_arquivo: file.name,
        data_upload: new Date().toISOString()
      };
      setNotasFiscais(prev => [...prev, novaNf]);
      setNovaNfNumero('');
      setNovaNfValor('');
      if (nfFileInputRef.current) nfFileInputRef.current.value = '';
      soundNotificationService.playSuccessSound();
    } catch (err) {
      console.error(err);
      alert('Falha ao processar arquivo da Nota Fiscal.');
    }
  };

  // Sincronizar Rateio a partir das Notas Fiscais
  const handleSincronizarRateioComNfs = () => {
    let totServicos = 0;
    let totPecas = 0;
    let totPneus = 0;

    notasFiscais.forEach(nf => {
      const val = Number(nf.valor) || 0;
      if (nf.tipo === 'SERVICO') totServicos += val;
      else if (nf.tipo === 'PECA') totPecas += val;
      else if (nf.tipo === 'PNEU') totPneus += val;
      else totPecas += val; // Geral aloca em peças por padrão
    });

    setCustoMaoObra(totServicos.toFixed(2));
    setCustoPecas(totPecas.toFixed(2));
    setCustoPneus(totPneus.toFixed(2));
    soundNotificationService.playSuccessSound();
  };

  const handleAddItem = () => {
    if (!novoItemDesc.trim()) return;
    setChecklist([
      ...checklist,
      { id: Date.now().toString(), descricao: novoItemDesc.trim(), concluido: false }
    ]);
    setNovoItemDesc('');
  };

  const handleToggleItem = (id: string) => {
    setChecklist(checklist.map(item => item.id === id ? { ...item, concluido: !item.concluido } : item));
  };

  const handleRemoveItem = (id: string) => {
    setChecklist(checklist.filter(item => item.id !== id));
  };

  const handlePrintRomaneio = () => {
    window.print();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricao.trim()) {
      alert('Informe a descrição do serviço a ser realizado.');
      return;
    }

    const viatId = activeViatura?.id || selectedViaturaId;
    if (!viatId) {
      alert('Selecione uma viatura para vincular a esta Ordem de Serviço.');
      return;
    }

    // Validação suave para conclusão da OS
    if (status === 'CONCLUIDA') {
      const totalNum = parseFloat(custoTotal) || 0;
      if (totalNum === 0) {
        const prosseguir = confirm('Atenção: Nenhum valor de custo foi rateado nesta O.S. (Custo Total R$ 0,00). Deseja concluir a O.S. mesmo assim?');
        if (!prosseguir) {
          setModalTab('RATEIO_NOTAS');
          return;
        }
      }
      if (notasFiscais.length === 0) {
        const prosseguirNf = confirm('Atenção: Nenhuma cópia de Nota Fiscal foi anexada para esta O.S. concluída. Recomendamos anexar as NFS-e / NF-e para auditoria. Deseja prosseguir?');
        if (!prosseguirNf) {
          setModalTab('RATEIO_NOTAS');
          return;
        }
      }
    }

    setIsSaving(true);
    try {
      const res = await saveOrdemServicoAction({
        id: osToEdit?.id,
        contrato_id: contratoId || activeViatura?.contrato_id || 'ONÇA PUMA',
        numero_os: numeroOs,
        viatura_id: viatId,
        oficina_id: tipoOs === 'EXTERNA' ? (oficinaId || null) : null,
        tipo_os: tipoOs,
        natureza_manutencao: natureza,
        tipo_manutencao: natureza === 'PREVENTIVA' ? 'PREVENTIVA' : 'CORRETIVA',
        prioridade: prioridade,
        resumo_anatomico: resumoAnatomico,
        itens_componentes_json: subcomponentes as any,
        valor_estimado: parseFloat(custoTotal) || 0,
        odometro_km: parseFloat(odometro) || 0,
        descricao_servico: descricao,
        custo_pecas: parseFloat(custoPecas) || 0,
        custo_mao_de_obra: parseFloat(custoMaoObra) || 0,
        custo_pneus: parseFloat(custoPneus) || 0,
        custo_total: parseFloat(custoTotal) || 0,
        status: status,
        status_os: status,
        itens_checklist: checklist,
        orcamentos_json: orcamentos,
        notas_fiscais_json: notasFiscais,
        comprovantes_urls: comprovantesUrls,
        data_abertura: osToEdit?.data_abertura || new Date().toISOString(),
        data_conclusao: status === 'CONCLUIDA' ? (osToEdit?.data_conclusao || new Date().toISOString()) : null
      });

      if (res.success && res.data) {
        soundNotificationService.playSuccessSound();
        onSuccess(res.data);
        onClose();
      } else {
        alert(res.error || 'Falha ao gravar Ordem de Serviço.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro inesperado ao salvar OS.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-2 sm:p-4 select-none font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl flex flex-col overflow-hidden transition-all duration-200 ${
          isMaximized ? 'w-full h-full rounded-none' : 'w-full max-w-4xl max-h-[94vh]'
        }`}
      >
        {/* ==================================================================== */}
        {/* CABEÇALHO DO MODAL */}
        {/* ==================================================================== */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-600/10 border border-red-600/20 flex items-center justify-center text-red-600">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-100">
                  Ordem de Serviço: {numeroOs}
                </h3>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                  prioridade === 'EMERGENCIA' 
                    ? 'bg-red-600 text-white shadow-[0_0_10px_#ef4444] animate-pulse' 
                    : prioridade === 'URGENTE' 
                      ? 'bg-amber-500 text-white font-black' 
                      : 'bg-[#1C4E26] text-[#B7F365] border border-[#68D346]'
                }`}>
                  {prioridade}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                  {status.replace('_', ' ')}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                <Truck className="w-3 h-3 text-slate-400" />
                {activeViatura ? (
                  <span>
                    Viatura: <strong>{activeViatura.prefixo_frota}</strong> • {activeViatura.modelo} ({activeViatura.placa})
                  </span>
                ) : (
                  <span className="text-amber-500">Selecione uma viatura abaixo</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handlePrintRomaneio}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all cursor-pointer border-none bg-transparent flex items-center gap-1 text-[10px] font-bold uppercase mr-1"
              title="Imprimir Romaneio de Encaminhamento"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Romaneio</span>
            </button>
            {onMinimize && (
              <button
                type="button"
                onClick={onMinimize}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all cursor-pointer border-none bg-transparent"
                title="Minimizar"
              >
                <Minus className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsMaximized(!isMaximized)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all cursor-pointer border-none bg-transparent"
              title={isMaximized ? 'Restaurar' : 'Maximizar'}
            >
              {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-all cursor-pointer border-none bg-transparent"
              title="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* STEPPER VISUAL DO STATUS DA OS */}
        {/* ==================================================================== */}
        <div className="bg-slate-50 dark:bg-slate-950/80 px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-1 overflow-x-auto no-scrollbar">
          {ETAPAS_STATUS.map((step, idx) => {
            const isCurrent = status === step.id;
            const Icon = step.icon;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => setStatus(step.id)}
                className={`flex-1 min-w-[120px] p-2 rounded-xl border flex items-center gap-2 transition-all cursor-pointer text-left ${
                  isCurrent 
                    ? `${step.color} shadow-xs font-black ring-1 ring-offset-1 ring-current`
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${isCurrent ? 'bg-current/10' : 'bg-slate-100 dark:bg-slate-800'}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase truncate leading-tight">
                    {idx + 1}. {step.label}
                  </p>
                  <p className="text-[9px] text-slate-400 truncate leading-tight">
                    {step.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* ==================================================================== */}
        {/* SUB-ABAS DE NAVEGAÇÃO DO MODAL */}
        {/* ==================================================================== */}
        <div className="flex items-center gap-2 px-5 pt-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <button
            type="button"
            onClick={() => setModalTab('DADOS')}
            className={`pb-2 text-xs font-bold uppercase tracking-wider border-b-2 flex items-center gap-1.5 transition-all cursor-pointer ${
              modalTab === 'DADOS'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Dados da O.S. & Escopo
          </button>

          <button
            type="button"
            onClick={() => setModalTab('ORCAMENTOS')}
            className={`pb-2 text-xs font-bold uppercase tracking-wider border-b-2 flex items-center gap-1.5 transition-all cursor-pointer ${
              modalTab === 'ORCAMENTOS'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Paperclip className="w-3.5 h-3.5" />
            Orçamentos & Cotações ({orcamentos.length})
          </button>

          <button
            type="button"
            onClick={() => setModalTab('RATEIO_NOTAS')}
            className={`pb-2 text-xs font-bold uppercase tracking-wider border-b-2 flex items-center gap-1.5 transition-all cursor-pointer ${
              modalTab === 'RATEIO_NOTAS'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            Rateio de Custos & Notas Fiscais ({notasFiscais.length})
          </button>
        </div>

        {/* ==================================================================== */}
        {/* CORPO DO FORMULÁRIO */}
        {/* ==================================================================== */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* ================= ABA 1: DADOS GERAIS & ESCOPO ================= */}
          {modalTab === 'DADOS' && (
            <div className="space-y-4">
              {/* Seleção de Viatura (se não pré-fixada) */}
              {!viatura && (
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                    Viatura Vinculada *
                  </label>
                  <select
                    value={selectedViaturaId}
                    onChange={(e) => {
                      setSelectedViaturaId(e.target.value);
                      const v = viaturas.find(x => x.id === e.target.value);
                      if (v) setOdometro(String(v.odometro_atual_km || 0));
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs font-bold outline-none cursor-pointer focus:border-red-600"
                    required
                  >
                    <option value="">Selecione o Veículo...</option>
                    {viaturas.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.prefixo_frota} • {v.modelo} (Placa: {v.placa})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Classificação da OS */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                    Origem da Execução *
                  </label>
                  <select
                    value={tipoOs}
                    onChange={(e) => setTipoOs(e.target.value as TipoOrdemServico)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs font-bold outline-none cursor-pointer"
                  >
                    <option value="EXTERNA">Oficina Externa Credenciada</option>
                    <option value="INTERNA">Oficina Interna da Base SIGER</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                    Natureza da Manutenção *
                  </label>
                  <select
                    value={natureza}
                    onChange={(e) => setNatureza(e.target.value as NaturezaManutencao)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs font-bold outline-none cursor-pointer"
                  >
                    <option value="PREVENTIVA">Preventiva Programada</option>
                    <option value="CORRETIVA">Corretiva</option>
                    <option value="EMERGENCIAL">Emergencial / Socorro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                    Odômetro de Entrada (KM) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={odometro}
                    onChange={(e) => setOdometro(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs font-mono font-bold outline-none focus:border-red-600"
                    required
                  />
                </div>
              </div>

              {/* Oficina Credenciada */}
              {tipoOs === 'EXTERNA' ? (
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                    Oficina Credenciada Vinculada *
                  </label>
                  <select
                    value={oficinaId}
                    onChange={(e) => setOficinaId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs font-bold outline-none cursor-pointer focus:border-red-600"
                    required
                  >
                    <option value="">Selecione a Oficina Credenciada...</option>
                    {oficinas.map(o => (
                      <option key={o.id} value={o.id}>
                        {o.razao_social} {o.cnpj ? `(${o.cnpj})` : ''} - {o.especialidades?.join(', ') || 'Geral'}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                    Local de Execução
                  </label>
                  <input
                    type="text"
                    value="Base / Oficina Mecânica Interna da Brigada SIGER"
                    disabled
                    className="w-full bg-slate-100 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs font-bold text-slate-500"
                  />
                </div>
              )}

              {/* Seletor Anatômico de Componentes Principais e Subcomponentes */}
              <div className="pt-2">
                <VehicleAnatomySelector
                  natureza={natureza === 'PREVENTIVA' ? 'PREVENTIVA' : 'CORRETIVA'}
                  onNaturezaChange={(novaNatureza) => setNatureza(novaNatureza)}
                  selectedItems={subcomponentes}
                  onItemsChange={(newItems, valorTotal, prioridadeSugerida) => {
                    setSubcomponentes(newItems);
                    setPrioridade(prioridadeSugerida);
                    const resumo = formatarResumoAnatomico(newItems);
                    setResumoAnatomico(resumo);
                    if (valorTotal > 0) {
                      setCustoPecas(valorTotal.toFixed(2));
                    }
                    // Se a descrição estiver vazia, pré-preenche com o resumo dos itens
                    if (!descricao.trim() && newItems.length > 0) {
                      setDescricao(`Manutenção veicular: ${newItems.map(i => i.nome_subcomponente).join(', ')}`);
                    }
                  }}
                />
              </div>

              {/* Escopo dos Serviços */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                  Escopo e Descrição dos Serviços Solicitados *
                </label>
                <textarea
                  rows={3}
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Descreva minuciosamente os sintomas, serviços e peças a serem revisados nesta O.S..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs font-medium outline-none focus:border-red-600"
                  required
                />
              </div>

              {/* Checklist de Itens da Manutenção */}
              <div className="space-y-2.5 bg-slate-50 dark:bg-slate-950/60 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Checklist Operacional de Serviços e Peças
                  </h4>
                  <span className="text-[9px] font-mono text-slate-400">
                    {checklist.filter(c => c.concluido).length} de {checklist.length} concluídos
                  </span>
                </div>

                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {checklist.map((item) => (
                    <div 
                      key={item.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs"
                    >
                      <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={item.concluido}
                          onChange={() => handleToggleItem(item.id)}
                          className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                        />
                        <span className={`truncate text-[11px] ${item.concluido ? 'line-through text-slate-400' : 'font-bold text-slate-700 dark:text-slate-200'}`}>
                          {item.descricao}
                        </span>
                      </label>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-slate-400 hover:text-red-500 p-1 border-none bg-transparent cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Adicionar serviço (ex: Troca do filtro de ar do motor)"
                    value={novoItemDesc}
                    onChange={(e) => setNovoItemDesc(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddItem(); } }}
                    className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2 text-xs font-medium outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer border-none"
                  >
                    <Plus className="w-3.5 h-3.5" /> Adicionar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================= ABA 2: ORÇAMENTOS & COTAÇÕES ================= */}
          {modalTab === 'ORCAMENTOS' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900/50 space-y-3">
                <h4 className="text-xs font-bold text-blue-900 dark:text-blue-300 flex items-center gap-2">
                  <Paperclip className="w-4 h-4" />
                  Anexar Novo Orçamento ou Proposta Comercial
                </h4>
                <p className="text-[11px] text-blue-700/80 dark:text-blue-400">
                  Faça o upload do documento em PDF ou foto (JPEG/PNG) enviado pela oficina para fins de aprovação prévia.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                      Identificação / Oficina
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Orçamento Inicial - Oficina Salobo"
                      value={novoOrcTitulo}
                      onChange={(e) => setNovoOrcTitulo(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2 text-xs font-medium outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                      Valor Estimado (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Ex: 1450.00"
                      value={novoOrcValor}
                      onChange={(e) => setNovoOrcValor(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2 text-xs font-mono font-bold outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <input
                    ref={orcFileInputRef}
                    type="file"
                    accept="application/pdf,image/png,image/jpeg,image/webp"
                    onChange={handleAddOrcamento}
                    className="hidden"
                    id="orc-file-input"
                  />
                  <label
                    htmlFor="orc-file-input"
                    className="w-full py-3 px-4 border-2 border-dashed border-blue-300 dark:border-blue-800 hover:border-blue-500 rounded-xl flex items-center justify-center gap-2 cursor-pointer bg-white/50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-900 transition-all text-xs font-bold text-blue-600 dark:text-blue-400"
                  >
                    <Upload className="w-4 h-4" />
                    Selecionar Arquivo de Orçamento (PDF ou Foto)
                  </label>
                </div>
              </div>

              {/* Lista de Orçamentos Anexados */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Orçamentos Anexados ({orcamentos.length})
                </h4>

                {orcamentos.length === 0 ? (
                  <div className="p-6 text-center rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800">
                    <FileSpreadsheet className="w-7 h-7 text-slate-400 mx-auto mb-1" />
                    <p className="text-xs text-slate-500">Nenhum orçamento anexado a esta O.S.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {orcamentos.map((orc) => (
                      <div
                        key={orc.id}
                        className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shadow-2xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                              {orc.titulo}
                            </p>
                            <p className="text-[10px] text-slate-500 font-mono flex items-center gap-2">
                              <span>{orc.nome_arquivo}</span>
                              {orc.valor_estimado && (
                                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                  R$ {orc.valor_estimado.toFixed(2)}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <a
                            href={orc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold flex items-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3" /> Ver
                          </a>
                          <button
                            type="button"
                            onClick={() => setOrcamentos(orcamentos.filter(x => x.id !== orc.id))}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Fotos e Evidências Fotográficas de Avaria */}
              <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-orange-500" />
                      Evidências Fotográficas & Avarias ({comprovantesUrls.length})
                    </h4>
                    <p className="text-[10px] text-slate-500">
                      Fotos do defeito enviadas pelo operador ou registradas durante vistoria
                    </p>
                  </div>
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      ref={fotoEvidenciaRef}
                      onChange={handleAddEvidenciaFoto}
                      className="hidden"
                      id="evidencia-foto-input"
                    />
                    <label
                      htmlFor="evidencia-foto-input"
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" /> Adicionar Foto
                    </label>
                  </div>
                </div>

                {comprovantesUrls.length === 0 ? (
                  <div className="p-4 text-center rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800">
                    <p className="text-xs text-slate-400">Nenhuma foto anexada a esta ordem de serviço.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {comprovantesUrls.map((url, idx) => (
                      <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900 aspect-video flex items-center justify-center">
                        <img src={url} alt={`Evidência ${idx + 1}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 bg-white text-slate-900 rounded-lg shadow-xs hover:scale-105 transition-transform"
                            title="Visualizar em tamanho real"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                          <button
                            type="button"
                            onClick={() => setComprovantesUrls(prev => prev.filter((_, i) => i !== idx))}
                            className="p-1.5 bg-red-600 text-white rounded-lg shadow-xs hover:scale-105 transition-transform border-none cursor-pointer"
                            title="Remover foto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= ABA 3: RATEIO DE CUSTOS & NOTAS FISCAIS ================= */}
          {modalTab === 'RATEIO_NOTAS' && (
            <div className="space-y-4">
              {/* Cards de Rateio Contábil */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-emerald-500" />
                    Rateio Contábil de Custos da Ordem de Serviço
                  </h4>
                  {notasFiscais.length > 0 && (
                    <button
                      type="button"
                      onClick={handleSincronizarRateioComNfs}
                      className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                    >
                      <Sparkles className="w-3 h-3" />
                      Preencher com base nas NFs
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                      Mão de Obra / Serviços (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={custoMaoObra}
                      onChange={(e) => setCustoMaoObra(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs font-mono font-bold outline-none focus:border-red-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                      Peças Trocadas (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={custoPecas}
                      onChange={(e) => setCustoPecas(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs font-mono font-bold outline-none focus:border-red-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                      Pneus / Desgaste (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={custoPneus}
                      onChange={(e) => setCustoPneus(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs font-mono font-bold outline-none focus:border-red-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                      Custo Total Consolidado
                    </label>
                    <div className="w-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl p-2.5 text-xs font-mono font-black text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
                      <span>R$</span>
                      <span>{custoTotal}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Seção de Anexo de Notas Fiscais */}
              <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/50 space-y-3">
                <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
                  <Receipt className="w-4 h-4" />
                  Anexar Nota Fiscal (NFS-e de Serviços ou NF-e de Peças/Pneus)
                </h4>
                <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400">
                  Vincule a cópia do documento fiscal para auditoria e composição do relatório financeiro consolidado.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                      Tipo de Nota
                    </label>
                    <select
                      value={novaNfTipo}
                      onChange={(e) => setNovaNfTipo(e.target.value as any)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2 text-xs font-bold outline-none cursor-pointer"
                    >
                      <option value="SERVICO">NFS-e (Mão de Obra / Serviço)</option>
                      <option value="PECA">NF-e (Peças e Componentes)</option>
                      <option value="PNEU">NF-e (Pneus e Borracharia)</option>
                      <option value="GERAL">NF Conjugada (Peças + Serviço)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                      Número da NF *
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: 001.428"
                      value={novaNfNumero}
                      onChange={(e) => setNovaNfNumero(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2 text-xs font-mono font-bold outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                      Valor da Nota (R$) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Ex: 850.00"
                      value={novaNfValor}
                      onChange={(e) => setNovaNfValor(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2 text-xs font-mono font-bold outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <input
                    ref={nfFileInputRef}
                    type="file"
                    accept="application/pdf,image/png,image/jpeg,image/webp"
                    onChange={handleAddNotaFiscal}
                    className="hidden"
                    id="nf-file-input"
                  />
                  <label
                    htmlFor="nf-file-input"
                    className="w-full py-3 px-4 border-2 border-dashed border-emerald-300 dark:border-emerald-800 hover:border-emerald-500 rounded-xl flex items-center justify-center gap-2 cursor-pointer bg-white/50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-900 transition-all text-xs font-bold text-emerald-600 dark:text-emerald-400"
                  >
                    <Upload className="w-4 h-4" />
                    Carregar Arquivo da Nota Fiscal (PDF ou Foto)
                  </label>
                </div>
              </div>

              {/* Lista de Notas Fiscais Anexadas */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Notas Fiscais Homologadas ({notasFiscais.length})
                </h4>

                {notasFiscais.length === 0 ? (
                  <div className="p-6 text-center rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800">
                    <Receipt className="w-7 h-7 text-slate-400 mx-auto mb-1" />
                    <p className="text-xs text-slate-500">Nenhuma Nota Fiscal anexada até o momento.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {notasFiscais.map((nf) => (
                      <div
                        key={nf.id}
                        className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shadow-2xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 font-black text-xs">
                            NF
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                              NF Nº {nf.numero_nf} • <span className="text-slate-500">{nf.tipo}</span>
                            </p>
                            <p className="text-[10px] text-slate-500 font-mono flex items-center gap-2">
                              <span>{nf.nome_arquivo}</span>
                              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                R$ {Number(nf.valor || 0).toFixed(2)}
                              </span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <a
                            href={nf.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold flex items-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3" /> Ver
                          </a>
                          <button
                            type="button"
                            onClick={() => setNotasFiscais(notasFiscais.filter(x => x.id !== nf.id))}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================================================================== */}
          {/* RODAPÉ E BOTÕES DE AÇÃO */}
          {/* ==================================================================== */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-slate-500">
                Total: <strong className="text-emerald-600 dark:text-emerald-400 font-bold">R$ {custoTotal}</strong>
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="text-[11px] text-slate-500">
                {orcamentos.length} orçamento(s) • {notasFiscais.length} NF(s)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 uppercase tracking-wider"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
              >
                <Wrench className="w-4 h-4" />
                {isSaving ? 'Gravando O.S...' : 'Salvar Alterações'}
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
