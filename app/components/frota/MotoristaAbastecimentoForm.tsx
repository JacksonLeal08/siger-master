'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Viatura, TipoCombustivel } from '@/lib/types/frota';
import { listViaturasAction, registrarAbastecimentoAction } from '@/app/actions/frotaActions';
import { FuelPricingService } from '@/lib/services/FuelPricingService';
import { soundNotificationService } from '@/lib/soundNotificationService';
import { 
  Fuel, 
  MapPin, 
  Camera, 
  AlertTriangle, 
  CheckCircle2, 
  Gauge, 
  DollarSign, 
  UploadCloud,
  Car,
  Clock,
  Sparkles
} from 'lucide-react';

interface MotoristaAbastecimentoFormProps {
  contratoId?: string;
  condutorPadrao?: string;
}

export default function MotoristaAbastecimentoForm({
  contratoId = 'ONÇA PUMA',
  condutorPadrao = ''
}: MotoristaAbastecimentoFormProps) {
  const [viaturas, setViaturas] = useState<Viatura[]>([]);
  const [selectedViaturaId, setSelectedViaturaId] = useState<string>('');
  const [isLoadingViaturas, setIsLoadingViaturas] = useState(true);

  // Form states
  const [condutor, setCondutor] = useState(condutorPadrao || 'Motorista Operacional');
  const [posto, setPosto] = useState('Posto Ipiranga - Rota Sul');
  const [tipoCombustivel, setTipoCombustivel] = useState<TipoCombustivel>('DIESEL_S10');
  const [litros, setLitros] = useState<string>('50');
  const [valorLitro, setValorLitro] = useState<string>('5.99');
  const [odometro, setOdometro] = useState<string>('');
  
  // Geolocation
  const [geoLoc, setGeoLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [geoStatus, setGeoStatus] = useState<string>('Obtendo GPS...');

  // Calibração e Fotos
  const [houveCalibracao, setHouveCalibracao] = useState(false);
  const [fotoCalibrador, setFotoCalibrador] = useState<string | null>(null);
  const [fotoCupom, setFotoCupom] = useState<string | null>(null);

  // Estados de envio e feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Carrega Viaturas do Contrato
  useEffect(() => {
    async function load() {
      setIsLoadingViaturas(true);
      try {
        const res = await listViaturasAction(contratoId);
        if (res.success && res.data) {
          setViaturas(res.data);
          if (res.data.length > 0) {
            setSelectedViaturaId(res.data[0].id);
            setOdometro(String(res.data[0].odometro_atual_km + 150));
            setTipoCombustivel(res.data[0].tipo_combustivel || 'DIESEL_S10');
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoadingViaturas(false);
      }
    }
    load();
  }, [contratoId]);

  // Captura GPS
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGeoLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setGeoStatus('GPS Capturado com Alta Precisão ✓');
        },
        (err) => {
          console.warn('GPS não capturado:', err.message);
          setGeoStatus('GPS Offline / Modo Manual');
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, []);

  const viaturaSelecionada = useMemo(() => {
    return viaturas.find((v) => v.id === selectedViaturaId);
  }, [viaturas, selectedViaturaId]);

  const statusCalibracao = useMemo(() => {
    return FuelPricingService.validarCalibracaoPneus(viaturaSelecionada?.data_ultima_calibracao, 15);
  }, [viaturaSelecionada]);

  // Altera odômetro inicial ao trocar viatura
  const handleViaturaChange = (id: string) => {
    setSelectedViaturaId(id);
    const v = viaturas.find((item) => item.id === id);
    if (v) {
      setOdometro(String((v.odometro_atual_km || 0) + 150));
      setTipoCombustivel(v.tipo_combustivel || 'DIESEL_S10');
    }
  };

  const isBloqueadoPorPneu = statusCalibracao.bloqueioObrigatorio && (!houveCalibracao || !fotoCalibrador);

  const valorTotalCalculado = useMemo(() => {
    const l = parseFloat(litros) || 0;
    const v = parseFloat(valorLitro) || 0;
    return (l * v).toFixed(2);
  }, [litros, valorLitro]);

  const handleFotoCalibrador = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setFotoCalibrador(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleFotoCupom = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setFotoCupom(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!selectedViaturaId) {
      setErrorMsg('Selecione uma viatura.');
      return;
    }

    if (isBloqueadoPorPneu) {
      soundNotificationService.playFuelAnomalyAlert();
      setErrorMsg('Bloqueio Quinzenal: Pneus estão há mais de 15 dias sem calibrar. Calibre os pneus e anexe a foto do manômetro.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await registrarAbastecimentoAction({
        contrato_id: contratoId,
        viatura_id: selectedViaturaId,
        posto,
        nome_posto: posto,
        tipo_combustivel: tipoCombustivel,
        litros: parseFloat(litros) || 0,
        valor_litro: parseFloat(valorLitro) || 0,
        valor_total: parseFloat(valorTotalCalculado) || 0,
        odometro_km: parseFloat(odometro) || 0,
        condutor_nome: condutor,
        houve_calibracao_pneus: houveCalibracao,
        foto_calibracao_url: fotoCalibrador,
        foto_cupom_url: fotoCupom,
        latitude_posto: geoLoc?.lat,
        longitude_posto: geoLoc?.lng
      }, viaturaSelecionada?.tipo_veiculo);

      if (res.success) {
        soundNotificationService.playSuccessSound();
        setSuccessMsg('Abastecimento registrado com sucesso e transmitido para a central!');
        setFotoCalibrador(null);
        setFotoCupom(null);
        setHouveCalibracao(false);
      } else {
        setErrorMsg(res.error || 'Falha ao registrar abastecimento.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erro inesperado ao transmitir dados.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-3 sm:p-5 font-sans">
      <div className="bg-white border border-slate-200 shadow-xl rounded-2xl overflow-hidden">
        {/* Linha vermelha gradiente superior SPCI */}
        <div className="h-1.5 w-full bg-gradient-to-r from-red-600 via-rose-600 to-red-600 shrink-0" />

        {/* Header Mobile */}
        <div className="p-4 sm:p-6 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-red-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                <Fuel className="w-4 h-4" /> REGISTRO DE ABASTECIMENTO
              </span>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 uppercase">
                {contratoId}
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-black text-slate-900 mt-1 uppercase">
              Terminal Operacional do Condutor
            </h1>
            <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              <span>{geoStatus}</span>
            </div>
          </div>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          
          {/* Alertas */}
          {errorMsg && (
            <div className="p-3 bg-red-100 border border-red-300 rounded-xl text-xs text-red-800 font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-100 border border-emerald-300 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* TRAVA DE CALIBRAÇÃO SE VENCIDA */}
          {statusCalibracao.bloqueioObrigatorio && (
            <div className="bg-red-50 border-2 border-red-500 rounded-2xl p-4 space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5 animate-bounce" />
                <div>
                  <h3 className="text-xs font-black text-red-900 uppercase">
                    Trava Quinzenal Ativa: Pneus há {statusCalibracao.diasDesdeCalibracao} dias sem calibrar
                  </h3>
                  <p className="text-[11px] text-red-800 mt-0.5">
                    É obrigatório calibrar os pneus neste abastecimento e anexar a foto do manômetro.
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-red-200 flex flex-col gap-2.5">
                <label className="flex items-center gap-2 text-xs font-bold text-red-950 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={houveCalibracao}
                    onChange={(e) => setHouveCalibracao(e.target.checked)}
                    className="w-4 h-4 text-red-600 rounded border-red-300"
                  />
                  Calibrei todos os pneus agora
                </label>

                <label className="inline-flex items-center justify-center gap-2 py-2 px-3 bg-white border border-red-300 text-red-700 rounded-xl text-xs font-bold cursor-pointer hover:bg-red-50">
                  <Camera className="w-4 h-4" />
                  {fotoCalibrador ? 'Foto do Calibrador Anexada ✓' : 'Tirar Foto do Manômetro / Calibrador *'}
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFotoCalibrador}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}

          {/* Seleção da Viatura */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              Viatura Operacional *
            </label>
            <select
              value={selectedViaturaId}
              onChange={(e) => handleViaturaChange(e.target.value)}
              className="w-full p-2.5 text-xs font-bold border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-slate-900"
            >
              {viaturas.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.prefixo_frota} • {v.placa} ({v.modelo})
                </option>
              ))}
            </select>
          </div>

          {/* Nome do Posto & Condutor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Posto de Combustível
              </label>
              <input
                type="text"
                value={posto}
                onChange={(e) => setPosto(e.target.value)}
                className="w-full p-2.5 text-xs font-semibold border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Nome do Condutor
              </label>
              <input
                type="text"
                value={condutor}
                onChange={(e) => setCondutor(e.target.value)}
                className="w-full p-2.5 text-xs font-semibold border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          {/* Combustível, Preço, Litros e Odômetro */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Combustível
              </label>
              <select
                value={tipoCombustivel}
                onChange={(e) => setTipoCombustivel(e.target.value as any)}
                className="w-full p-2.5 text-xs font-bold border border-slate-200 rounded-xl bg-white"
              >
                <option value="DIESEL_S10">DIESEL S10</option>
                <option value="GASOLINA">GASOLINA COMUM</option>
                <option value="ETANOL">ETANOL</option>
                <option value="FLEX">FLEX</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Odômetro Atual (KM) *
              </label>
              <input
                type="number"
                value={odometro}
                onChange={(e) => setOdometro(e.target.value)}
                className="w-full p-2.5 text-xs font-bold font-mono border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Preço por Litro (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                value={valorLitro}
                onChange={(e) => setValorLitro(e.target.value)}
                className="w-full p-2.5 text-xs font-bold font-mono border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Litros Abastecidos *
              </label>
              <input
                type="number"
                step="0.1"
                value={litros}
                onChange={(e) => setLitros(e.target.value)}
                className="w-full p-2.5 text-xs font-bold font-mono border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          {/* Total */}
          <div className="p-3 bg-slate-900 text-white rounded-xl flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-400">Total a Pagar</span>
            <span className="text-lg font-black font-mono text-emerald-400">
              R$ {valorTotalCalculado}
            </span>
          </div>

          {/* Cupom Fiscal */}
          <div>
            <label className="inline-flex items-center justify-center w-full gap-2 py-2 px-3 bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer hover:bg-slate-200">
              <UploadCloud className="w-4 h-4" />
              {fotoCupom ? 'Foto do Cupom Fiscal Anexada ✓' : 'Tirar Foto do Cupom Fiscal'}
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFotoCupom}
                className="hidden"
              />
            </label>
          </div>

          {/* Botão de Envio */}
          <button
            type="submit"
            disabled={isSubmitting || isBloqueadoPorPneu}
            className={`w-full py-3 text-xs font-black uppercase tracking-wider text-white rounded-xl shadow-md transition-all cursor-pointer ${
              isBloqueadoPorPneu
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                : 'bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 active:scale-[0.99]'
            }`}
          >
            {isSubmitting ? 'Transmitindo...' : 'Transmitir Abastecimento'}
          </button>
        </form>
      </div>
    </div>
  );
}
