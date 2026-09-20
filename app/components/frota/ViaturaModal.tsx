'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Viatura, 
  TipoVeiculo, 
  TipoCombustivel, 
  StatusOperacionalViatura 
} from '@/lib/types/frota';
import { saveViaturaAction } from '@/app/actions/frotaActions';
import { soundNotificationService } from '@/lib/soundNotificationService';
import { Truck, Minus, Maximize2, Minimize2, X, Save, AlertCircle } from 'lucide-react';

interface ViaturaModalProps {
  isOpen: boolean;
  viaturaToEdit?: Viatura | null;
  contratoId: string;
  onClose: () => void;
  onMinimize: () => void;
  onSuccess: (saved: Viatura) => void;
}

export const ViaturaModal: React.FC<ViaturaModalProps> = ({
  isOpen,
  viaturaToEdit,
  contratoId,
  onClose,
  onMinimize,
  onSuccess
}) => {
  const [isMaximized, setIsMaximized] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states
  const [prefixo, setPrefixo] = useState('');
  const [placa, setPlaca] = useState('');
  const [chassi, setChassi] = useState('');
  const [renavam, setRenavam] = useState('');
  const [tipoVeiculo, setTipoVeiculo] = useState<TipoVeiculo>('CAMINHONETE');
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [anoFabricacao, setAnoFabricacao] = useState<number | ''>(new Date().getFullYear());
  const [tipoCombustivel, setTipoCombustivel] = useState<TipoCombustivel>('DIESEL_S10');
  const [odometro, setOdometro] = useState<string>('0');
  const [status, setStatus] = useState<StatusOperacionalViatura>('DISPONIVEL');
  
  // Documentos & Seguros
  const [vencimentoCrlv, setVencimentoCrlv] = useState('');
  const [seguradora, setSeguradora] = useState('');
  const [apolice, setApolice] = useState('');
  const [vencimentoSeguro, setVencimentoSeguro] = useState('');
  const [validadeGarantia, setValidadeGarantia] = useState('');
  const [limiteGarantiaKm, setLimiteGarantiaKm] = useState<string>('');
  const [observacoes, setObservacoes] = useState('');

  useEffect(() => {
    if (viaturaToEdit) {
      setPrefixo(viaturaToEdit.prefixo_frota || '');
      setPlaca(viaturaToEdit.placa || '');
      setChassi(viaturaToEdit.chassi || '');
      setRenavam(viaturaToEdit.renavam || '');
      setTipoVeiculo(viaturaToEdit.tipo_veiculo || 'CAMINHONETE');
      setMarca(viaturaToEdit.marca || '');
      setModelo(viaturaToEdit.modelo || '');
      setAnoFabricacao(viaturaToEdit.ano_fabricacao || new Date().getFullYear());
      setTipoCombustivel(viaturaToEdit.tipo_combustivel || 'DIESEL_S10');
      setOdometro(String(viaturaToEdit.odometro_atual_km || 0));
      setStatus(viaturaToEdit.status_operacional || 'DISPONIVEL');
      setVencimentoCrlv(viaturaToEdit.vencimento_crlv || '');
      setSeguradora(viaturaToEdit.seguradora || '');
      setApolice(viaturaToEdit.apolice_seguro || '');
      setVencimentoSeguro(viaturaToEdit.vencimento_seguro || '');
      setValidadeGarantia(viaturaToEdit.validade_garantia_data || '');
      setLimiteGarantiaKm(viaturaToEdit.limite_garantia_km ? String(viaturaToEdit.limite_garantia_km) : '');
      setObservacoes(viaturaToEdit.observacoes || '');
    } else {
      setPrefixo('');
      setPlaca('');
      setChassi('');
      setRenavam('');
      setTipoVeiculo('CAMINHONETE');
      setMarca('');
      setModelo('');
      setAnoFabricacao(new Date().getFullYear());
      setTipoCombustivel('DIESEL_S10');
      setOdometro('0');
      setStatus('DISPONIVEL');
      setVencimentoCrlv('');
      setSeguradora('');
      setApolice('');
      setVencimentoSeguro('');
      setValidadeGarantia('');
      setLimiteGarantiaKm('');
      setObservacoes('');
    }
    setErrorMsg(null);
  }, [viaturaToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!prefixo.trim() || !placa.trim() || !marca.trim() || !modelo.trim()) {
      setErrorMsg('Prefixo, Placa, Marca e Modelo são obrigatórios.');
      return;
    }

    setIsSaving(true);
    try {
      const payload: Partial<Viatura> = {
        id: viaturaToEdit?.id,
        contrato_id: contratoId || 'ONÇA PUMA',
        prefixo_frota: prefixo,
        placa: placa,
        chassi: chassi || null,
        renavam: renavam || null,
        tipo_veiculo: tipoVeiculo,
        marca: marca,
        modelo: modelo,
        ano_fabricacao: anoFabricacao ? Number(anoFabricacao) : null,
        tipo_combustivel: tipoCombustivel,
        odometro_atual_km: parseFloat(odometro) || 0,
        status_operacional: status,
        vencimento_crlv: vencimentoCrlv || null,
        seguradora: seguradora || null,
        apolice_seguro: apolice || null,
        vencimento_seguro: vencimentoSeguro || null,
        validade_garantia_data: validadeGarantia || null,
        limite_garantia_km: limiteGarantiaKm ? parseFloat(limiteGarantiaKm) : null,
        observacoes: observacoes || null
      };

      const res = await saveViaturaAction(payload);
      if (res.success && res.data) {
        soundNotificationService.playSuccessSound();
        onSuccess(res.data);
        onClose();
      } else {
        setErrorMsg(res.error || 'Falha ao salvar dados da viatura.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erro inesperado na gravação.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-3 sm:p-5 select-none font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl flex flex-col overflow-hidden transition-all duration-200 ${
          isMaximized ? 'w-full h-full rounded-none' : 'w-full max-w-3xl max-h-[92vh]'
        }`}
      >
        {/* Barra Superior de Controles (Minimizar / Maximizar / Fechar) */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-600/10 border border-red-600/20 flex items-center justify-center text-red-600">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-100">
                {viaturaToEdit ? `Editar Viatura: ${viaturaToEdit.prefixo_frota}` : 'Cadastrar Nova Viatura'}
              </h3>
              <p className="text-[10px] text-slate-500 font-mono">
                Contrato Operacional: <strong>{contratoId}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onMinimize}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all cursor-pointer border-none bg-transparent"
              title="Minimizar para Dock"
            >
              <Minus className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setIsMaximized(!isMaximized)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all cursor-pointer border-none bg-transparent"
              title={isMaximized ? 'Restaurar Tamanho' : 'Maximizar'}
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

        {/* Formulário com Scroll Suave */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Seção 1: Identificação Operacional */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-1.5">
              1. Identificação Operacional & Placa
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                  Prefixo da Frota *
                </label>
                <input
                  type="text"
                  placeholder="Ex: VTR-01, AMB-02"
                  value={prefixo}
                  onChange={(e) => setPrefixo(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs font-bold uppercase outline-none focus:border-red-600"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                  Placa do Veículo *
                </label>
                <input
                  type="text"
                  placeholder="Ex: BRA2E19"
                  value={placa}
                  onChange={(e) => setPlaca(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs font-bold uppercase outline-none focus:border-red-600"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                  Tipo de Veículo *
                </label>
                <select
                  value={tipoVeiculo}
                  onChange={(e) => setTipoVeiculo(e.target.value as TipoVeiculo)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs font-bold outline-none cursor-pointer focus:border-red-600"
                  required
                >
                  <option value="CAMINHONETE">CAMINHONETE (4x4 Operacional)</option>
                  <option value="AMBULANCIA">AMBULÂNCIA (Resgate / UTI)</option>
                  <option value="CAMINHAO_INCENDIO">CAMINHÃO DE INCÊNDIO / ABT</option>
                  <option value="UTILITARIO">UTILITÁRIO / VAN</option>
                  <option value="OUTRO">OUTRO VEÍCULO</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                  Chassi
                </label>
                <input
                  type="text"
                  placeholder="Ex: 9BWZZZ377VT004251"
                  value={chassi}
                  onChange={(e) => setChassi(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs font-bold uppercase outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                  RENAVAM
                </label>
                <input
                  type="text"
                  placeholder="Ex: 00123456789"
                  value={renavam}
                  onChange={(e) => setRenavam(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs font-bold uppercase outline-none"
                />
              </div>
            </div>
          </div>

          {/* Seção 2: Especificações Mecânicas & Telemetria */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-1.5">
              2. Ficha Técnica & Telemetria
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                  Marca *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Toyota, Mercedes-Benz, Ford"
                  value={marca}
                  onChange={(e) => setMarca(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs font-bold outline-none focus:border-red-600"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                  Modelo *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Hilux CD 4x4, Sprinter 415"
                  value={modelo}
                  onChange={(e) => setModelo(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs font-bold outline-none focus:border-red-600"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                  Ano de Fabricação
                </label>
                <input
                  type="number"
                  min="1990"
                  max="2035"
                  value={anoFabricacao}
                  onChange={(e) => setAnoFabricacao(e.target.value ? Number(e.target.value) : '')}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs font-bold outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                  Combustível *
                </label>
                <select
                  value={tipoCombustivel}
                  onChange={(e) => setTipoCombustivel(e.target.value as TipoCombustivel)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs font-bold outline-none cursor-pointer"
                >
                  <option value="DIESEL_S10">Diesel S-10</option>
                  <option value="GASOLINA">Gasolina Comum</option>
                  <option value="FLEX">Flex (Etanol/Gasolina)</option>
                  <option value="ETANOL">Etanol</option>
                  <option value="ELETRICO">100% Elétrico</option>
                  <option value="HIBRIDO">Híbrido</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                  Odômetro Atual (KM) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={odometro}
                  onChange={(e) => setOdometro(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs font-bold outline-none focus:border-red-600"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                  Status Operacional *
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as StatusOperacionalViatura)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs font-bold outline-none cursor-pointer"
                >
                  <option value="DISPONIVEL">Disponível na Base</option>
                  <option value="EM_DESLOCAMENTO">Em Deslocamento / Ronda</option>
                  <option value="EM_MANUTENCAO_INTERNA">Manutenção Interna</option>
                  <option value="EM_OFICINA_EXTERNA">Oficina Credenciada Externa</option>
                  <option value="BAIXADO">Baixado / Fora de Operação</option>
                </select>
              </div>
            </div>
          </div>

          {/* Seção 3: Documentação & Seguradora */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-1.5">
              3. Documentação, Seguro & Garantia
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                  Vencimento CRLV
                </label>
                <input
                  type="date"
                  value={vencimentoCrlv}
                  onChange={(e) => setVencimentoCrlv(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs font-bold outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                  Seguradora
                </label>
                <input
                  type="text"
                  placeholder="Ex: Porto Seguro, Tokio Marine"
                  value={seguradora}
                  onChange={(e) => setSeguradora(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs font-bold outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                  Vencimento do Seguro
                </label>
                <input
                  type="date"
                  value={vencimentoSeguro}
                  onChange={(e) => setVencimentoSeguro(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs font-bold outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                  Apólice de Seguro
                </label>
                <input
                  type="text"
                  placeholder="Nº da Apólice"
                  value={apolice}
                  onChange={(e) => setApolice(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs font-bold outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                  Garantia de Fábrica (Limite KM)
                </label>
                <input
                  type="number"
                  placeholder="Ex: 100000"
                  value={limiteGarantiaKm}
                  onChange={(e) => setLimiteGarantiaKm(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs font-bold outline-none"
                />
              </div>
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
              Observações Operacionais
            </label>
            <textarea
              rows={2}
              placeholder="Acessórios instalados (giroflex, sirene, rádio VHF, engate)..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs font-medium outline-none"
            />
          </div>

          {/* Footer Ações */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
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
              className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Salvando Viatura...' : 'Salvar Viatura'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
