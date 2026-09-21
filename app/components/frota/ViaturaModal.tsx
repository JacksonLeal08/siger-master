'use client';

import React, { useState, useEffect } from 'react';
import { 
  Viatura, 
  TipoVeiculo, 
  TipoCombustivel, 
  StatusOperacionalViatura 
} from '@/lib/types/frota';
import { saveViaturaAction } from '@/app/actions/frotaActions';
import { soundNotificationService } from '@/lib/soundNotificationService';
import ModalBaseCorporativo from '@/app/components/ui/ModalBaseCorporativo';
import { 
  Truck, 
  Camera, 
  Calendar, 
  Shield, 
  AlertCircle, 
  UploadCloud, 
  Car, 
  FileText,
  Clock,
  Gauge
} from 'lucide-react';

interface ViaturaModalProps {
  isOpen: boolean;
  viaturaToEdit?: Viatura | null;
  contratoId: string;
  onClose: () => void;
  onMinimize?: () => void;
  onSuccess: (saved: Viatura) => void;
}

export const ViaturaModal: React.FC<ViaturaModalProps> = ({
  isOpen,
  viaturaToEdit,
  contratoId,
  onClose,
  onSuccess
}) => {
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
  const [dataUltimaCalibracao, setDataUltimaCalibracao] = useState<string>('');
  const [dataUltimaPreventiva, setDataUltimaPreventiva] = useState<string>('');
  const [odometroUltimaPreventiva, setOdometroUltimaPreventiva] = useState<string>('');
  const [intervaloRevisaoKm, setIntervaloRevisaoKm] = useState<string>('10000');
  const [fotoVeiculoUrl, setFotoVeiculoUrl] = useState<string | null>(null);
  
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
      setDataUltimaCalibracao(
        viaturaToEdit.data_ultima_calibracao ? viaturaToEdit.data_ultima_calibracao.split('T')[0] : ''
      );
      setDataUltimaPreventiva(
        viaturaToEdit.data_ultima_preventiva ? viaturaToEdit.data_ultima_preventiva.split('T')[0] : ''
      );
      const kmPrevInit = viaturaToEdit.km_ultima_preventiva !== undefined && viaturaToEdit.km_ultima_preventiva !== null
        ? String(viaturaToEdit.km_ultima_preventiva)
        : (viaturaToEdit.odometro_ultima_preventiva_km ? String(viaturaToEdit.odometro_ultima_preventiva_km) : '');
      setOdometroUltimaPreventiva(kmPrevInit);
      setIntervaloRevisaoKm(
        viaturaToEdit.intervalo_revisao_km ? String(viaturaToEdit.intervalo_revisao_km) : '10000'
      );
      setFotoVeiculoUrl(viaturaToEdit.foto_veiculo_url || null);
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
      setDataUltimaCalibracao('');
      setDataUltimaPreventiva('');
      setOdometroUltimaPreventiva('');
      setIntervaloRevisaoKm('10000');
      setFotoVeiculoUrl(null);
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

  // Upload simulado / base64 para Foto do Veículo
  const handleFotoVeiculoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setFotoVeiculoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!prefixo.trim() || !placa.trim() || !marca.trim() || !modelo.trim()) {
      setErrorMsg('Prefixo, Placa, Marca e Modelo são obrigatórios.');
      return;
    }

    setIsSaving(true);
    try {
      const kmPrevParsed = odometroUltimaPreventiva ? parseFloat(odometroUltimaPreventiva) : null;
      const intervaloParsed = intervaloRevisaoKm ? parseFloat(intervaloRevisaoKm) : 10000;

      const payload: Partial<Viatura> = {
        id: viaturaToEdit?.id,
        contrato_id: contratoId || viaturaToEdit?.contrato_id || 'ONÇA PUMA',
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
        foto_veiculo_url: fotoVeiculoUrl,
        data_ultima_calibracao: dataUltimaCalibracao ? new Date(dataUltimaCalibracao).toISOString() : null,
        data_ultima_preventiva: dataUltimaPreventiva ? dataUltimaPreventiva : null,
        km_ultima_preventiva: kmPrevParsed,
        odometro_ultima_preventiva_km: kmPrevParsed,
        intervalo_revisao_km: intervaloParsed,
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
    <ModalBaseCorporativo
      isOpen={isOpen}
      onClose={onClose}
      modalId="modal-viatura-form"
      badgeSistema="SPCI FROTA OPERACIONAL"
      badgeContrato={contratoId || 'ONÇA PUMA'}
      titulo={viaturaToEdit ? `EDITAR VIATURA • ${viaturaToEdit.prefixo_frota}` : 'CADASTRAR NOVA VIATURA'}
      subtitulo="Rastreabilidade veicular, conformidade de CRLV, seguro de frota e gestão de hodômetro"
      icon={Truck}
      maxWidthClass="max-w-4xl"
      footer={
        <div className="flex w-full items-center justify-between">
          <div className="text-xs text-slate-500 font-sans">
            Prefixo: <strong className="text-slate-800">{prefixo || 'Não informado'}</strong> | Placa: <strong className="text-slate-800">{placa || 'Não informada'}</strong>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100 transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSaving}
              className="px-5 py-2 text-xs font-bold text-white rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800"
            >
              {isSaving ? 'Gravando...' : 'Salvar Viatura'}
            </button>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5 font-sans">
        {errorMsg && (
          <div className="p-3 bg-red-100 border border-red-300 rounded-xl text-xs text-red-800 font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* SEÇÃO 1: FOTO OFICIAL & IDENTIFICAÇÃO PRINCIPAL */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
            <div className="w-7 h-7 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
              <Car className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
              1. Identificação Operacional & Foto Oficial
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
            {/* Box da Foto Oficial */}
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-2xl p-3 bg-slate-50/50 hover:bg-slate-50 transition-all text-center">
              {fotoVeiculoUrl ? (
                <div className="relative group w-full">
                  <img
                    src={fotoVeiculoUrl}
                    alt="Foto da Viatura"
                    className="w-full h-36 object-cover rounded-xl shadow-xs"
                  />
                  <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 rounded-xl flex items-center justify-center text-white text-xs font-bold cursor-pointer transition-all">
                    <Camera className="w-4 h-4 mr-1.5" /> Trocar Foto
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFotoVeiculoChange}
                      className="hidden"
                    />
                  </label>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-36 cursor-pointer text-slate-500 hover:text-slate-800">
                  <Camera className="w-8 h-8 mb-2 text-slate-400" />
                  <span className="text-xs font-bold text-slate-700">Foto Oficial do Veículo</span>
                  <span className="text-[10px] text-slate-400">Usada no mapa GIS e relatórios</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFotoVeiculoChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Campos Principais */}
            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Prefixo da Frota *
                </label>
                <input
                  type="text"
                  value={prefixo}
                  onChange={(e) => setPrefixo(e.target.value.toUpperCase())}
                  placeholder="Ex: VTR-04 ou AMB-01"
                  className="w-full text-xs font-black uppercase px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Placa do Veículo *
                </label>
                <input
                  type="text"
                  value={placa}
                  onChange={(e) => setPlaca(e.target.value.toUpperCase())}
                  placeholder="Ex: FVZ3H91"
                  className="w-full text-xs font-black uppercase px-3 py-2 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Tipo de Viatura
                </label>
                <select
                  value={tipoVeiculo}
                  onChange={(e) => setTipoVeiculo(e.target.value as TipoVeiculo)}
                  className="w-full text-xs font-semibold px-3 py-2 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
                >
                  <option value="CAMINHONETE">CAMINHONETE 4X4</option>
                  <option value="AMBULANCIA">AMBULÂNCIA DE RESGATE 4X2</option>
                  <option value="CAMINHAO_INCENDIO">CAMINHÃO AUTO BOMBA TANQUE (ABT)</option>
                  <option value="UTILITARIO">UTILITÁRIO / VAN</option>
                  <option value="OUTRO">OUTRO</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Status Operacional
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as StatusOperacionalViatura)}
                  className="w-full text-xs font-semibold px-3 py-2 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
                >
                  <option value="DISPONIVEL">DISPONÍVEL</option>
                  <option value="EM_DESLOCAMENTO">EM DESLOCAMENTO</option>
                  <option value="EM_MANUTENCAO_INTERNA">EM MANUTENÇÃO INTERNA</option>
                  <option value="EM_OFICINA_EXTERNA">EM OFICINA EXTERNA</option>
                  <option value="BAIXADO">BAIXADO / INATIVO</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* SEÇÃO 2: DETALHES TÉCNICOS & MOTORIZAÇÃO */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <Gauge className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
              2. Ficha Mecânica & Calibragem
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Marca / Montadora *
              </label>
              <input
                type="text"
                value={marca}
                onChange={(e) => setMarca(e.target.value.toUpperCase())}
                placeholder="Ex: TOYOTA, FORD, MERCEDES"
                className="w-full text-xs font-semibold uppercase px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Modelo *
              </label>
              <input
                type="text"
                value={modelo}
                onChange={(e) => setModelo(e.target.value.toUpperCase())}
                placeholder="Ex: HILUX 2.8 4X4 ou SPRINTER"
                className="w-full text-xs font-semibold uppercase px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Tipo de Combustível
              </label>
              <select
                value={tipoCombustivel}
                onChange={(e) => setTipoCombustivel(e.target.value as TipoCombustivel)}
                className="w-full text-xs font-semibold px-3 py-2 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
              >
                <option value="DIESEL_S10">DIESEL S10</option>
                <option value="GASOLINA">GASOLINA COMUM</option>
                <option value="ETANOL">ETANOL</option>
                <option value="FLEX">FLEX</option>
                <option value="ELETRICO">ELÉTRICO</option>
                <option value="HIBRIDO">HÍBRIDO</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Odômetro Atual (KM)
              </label>
              <input
                type="number"
                value={odometro}
                onChange={(e) => setOdometro(e.target.value)}
                className="w-full text-xs font-bold font-mono px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                KM Última Preventiva (Revisão)
              </label>
              <input
                type="number"
                value={odometroUltimaPreventiva}
                onChange={(e) => setOdometroUltimaPreventiva(e.target.value)}
                placeholder="Ex: 80000"
                className="w-full text-xs font-bold font-mono px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Data da Última Preventiva
              </label>
              <input
                type="date"
                value={dataUltimaPreventiva}
                onChange={(e) => setDataUltimaPreventiva(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Intervalo de Revisão (KM)
              </label>
              <input
                type="number"
                value={intervaloRevisaoKm}
                onChange={(e) => setIntervaloRevisaoKm(e.target.value)}
                placeholder="Padrão: 10000"
                className="w-full text-xs font-bold font-mono px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Última Calibragem de Pneus
              </label>
              <input
                type="date"
                value={dataUltimaCalibracao}
                onChange={(e) => setDataUltimaCalibracao(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Ano de Fabricação
              </label>
              <input
                type="number"
                value={anoFabricacao}
                onChange={(e) => setAnoFabricacao(e.target.value ? Number(e.target.value) : '')}
                className="w-full text-xs font-semibold px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* SEÇÃO 3: DOCUMENTAÇÃO & SEGURO */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
              3. Documentação, Seguro & CRLV
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Vencimento do CRLV
              </label>
              <input
                type="date"
                value={vencimentoCrlv}
                onChange={(e) => setVencimentoCrlv(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Seguradora
              </label>
              <input
                type="text"
                value={seguradora}
                onChange={(e) => setSeguradora(e.target.value)}
                placeholder="Ex: PORTO SEGURO, AZUL"
                className="w-full text-xs font-semibold px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Vencimento do Seguro
              </label>
              <input
                type="date"
                value={vencimentoSeguro}
                onChange={(e) => setVencimentoSeguro(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

      </form>
    </ModalBaseCorporativo>
  );
};
