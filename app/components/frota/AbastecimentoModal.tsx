'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Viatura, Abastecimento, RankingPostoInfo } from '@/lib/types/frota';
import { registrarAbastecimentoAction, getRankingPostosAction, listAbastecimentosAction } from '@/app/actions/frotaActions';
import { FuelAuditService } from '@/lib/fuelAuditService';
import { FuelPricingService } from '@/lib/services/FuelPricingService';
import { soundNotificationService } from '@/lib/soundNotificationService';
import ModalBaseCorporativo from '@/app/components/ui/ModalBaseCorporativo';
import { 
  Fuel, 
  AlertTriangle, 
  CheckCircle2, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Minus as MinusIcon, 
  Camera, 
  Gauge, 
  Building2, 
  MapPin, 
  Sparkles,
  UploadCloud,
  FileCheck
} from 'lucide-react';

interface AbastecimentoModalProps {
  isOpen: boolean;
  viatura: Viatura;
  contratoId: string;
  onClose: () => void;
  onMinimize?: () => void;
  onSuccess: (saved: Abastecimento) => void;
  condutorPadrao?: string;
}

export const AbastecimentoModal: React.FC<AbastecimentoModalProps> = ({
  isOpen,
  viatura,
  contratoId,
  onClose,
  onSuccess,
  condutorPadrao = ''
}) => {
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states
  const [posto, setPosto] = useState('Posto Ipiranga - Rota Sul');
  const [tipoCombustivel, setTipoCombustivel] = useState(viatura.tipo_combustivel || 'DIESEL_S10');
  const [litros, setLitros] = useState<string>('50');
  const [valorLitro, setValorLitro] = useState<string>('5.99');
  const [novoOdometro, setNovoOdometro] = useState<string>(
    viatura.odometro_atual_km ? String(viatura.odometro_atual_km + 450) : '450'
  );
  const [condutor, setCondutor] = useState(condutorPadrao || 'Motorista Operacional SIGER');

  // Estados de Telemetria e Trava de Calibração
  const [ultimoPrecoRegistrado, setUltimoPrecoRegistrado] = useState<number | null>(null);
  const [postoMaisEconomico, setPostoMaisEconomico] = useState<RankingPostoInfo | null>(null);
  const [houveCalibracao, setHouveCalibracao] = useState<boolean>(false);
  const [fotoCalibradorUrl, setFotoCalibradorUrl] = useState<string | null>(null);
  const [fotoCupomUrl, setFotoCupomUrl] = useState<string | null>(null);

  // Carrega histórico para cálculo de variação de preço e ranking de postos
  useEffect(() => {
    if (!isOpen) return;

    async function loadPricingContext() {
      try {
        const [rankingRes, abastRes] = await Promise.all([
          getRankingPostosAction(contratoId, tipoCombustivel),
          listAbastecimentosAction(viatura.id, contratoId)
        ]);

        if (rankingRes.success && rankingRes.postoMaisEconomico) {
          setPostoMaisEconomico(rankingRes.postoMaisEconomico);
        }

        if (abastRes.success && abastRes.data && abastRes.data.length > 0) {
          const mesmoComb = abastRes.data.filter((a) => a.tipo_combustivel === tipoCombustivel);
          if (mesmoComb.length > 0) {
            setUltimoPrecoRegistrado(Number(mesmoComb[0].valor_litro));
          } else {
            setUltimoPrecoRegistrado(Number(abastRes.data[0].valor_litro));
          }
        }
      } catch (e) {
        console.warn('Erro ao carregar contexto de precificação:', e);
      }
    }

    loadPricingContext();
  }, [isOpen, contratoId, tipoCombustivel, viatura.id]);

  // Status da trava de 15 dias de pneus
  const statusCalibracao = useMemo(() => {
    return FuelPricingService.validarCalibracaoPneus(viatura.data_ultima_calibracao, 15);
  }, [viatura.data_ultima_calibracao]);

  // Alerta sonoro quando a calibração está bloqueada
  useEffect(() => {
    if (isOpen && statusCalibracao.bloqueioObrigatorio) {
      soundNotificationService.playFuelAnomalyAlert();
    }
  }, [isOpen, statusCalibracao.bloqueioObrigatorio]);

  // Cálculo da variação de preço em tempo real
  const variacaoPreco = useMemo(() => {
    return FuelPricingService.calcularVariacaoPreco(parseFloat(valorLitro) || 0, ultimoPrecoRegistrado);
  }, [valorLitro, ultimoPrecoRegistrado]);

  // Cálculo do valor total
  const valorTotal = useMemo(() => {
    const l = parseFloat(litros) || 0;
    const v = parseFloat(valorLitro) || 0;
    return (l * v).toFixed(2);
  }, [litros, valorLitro]);

  // Auditoria Antifraude em Tempo Real
  const liveAudit = useMemo(() => {
    const l = parseFloat(litros) || 0;
    const odo = parseFloat(novoOdometro) || 0;

    return FuelAuditService.analyze({
      odometroAtualKm: odo,
      odometroAnteriorKm: viatura.odometro_atual_km,
      litros: l,
      tipoVeiculo: viatura.tipo_veiculo,
      tipoCombustivel
    });
  }, [litros, novoOdometro, viatura.odometro_atual_km, viatura.tipo_veiculo, tipoCombustivel]);

  // Upload simulado / base64 para Foto do Calibrador
  const handleFotoCalibradorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setFotoCalibradorUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Upload simulado / base64 para Cupom Fiscal
  const handleFotoCupomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setFotoCupomUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const isFormBloqueadoPorPneu = statusCalibracao.bloqueioObrigatorio && (!houveCalibracao || !fotoCalibradorUrl);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const l = parseFloat(litros);
    const vl = parseFloat(valorLitro);
    const odo = parseFloat(novoOdometro);

    if (isNaN(l) || l <= 0) {
      setErrorMsg('Informe uma quantidade válida de litros.');
      return;
    }

    if (isNaN(odo) || odo <= 0) {
      setErrorMsg('Informe um odômetro válido.');
      return;
    }

    if (isFormBloqueadoPorPneu) {
      setErrorMsg('Atenção: Calibre os pneus e anexe a foto do manômetro para liberar o abastecimento.');
      soundNotificationService.playFuelAnomalyAlert();
      return;
    }

    if (liveAudit.isDiscrepante) {
      soundNotificationService.playFuelAnomalyAlert();
    } else {
      soundNotificationService.playSuccessSound();
    }

    setIsSaving(true);
    try {
      const res = await registrarAbastecimentoAction(
        {
          contrato_id: contratoId || viatura.contrato_id || 'ONÇA PUMA',
          viatura_id: viatura.id,
          posto,
          nome_posto: posto,
          tipo_combustivel: tipoCombustivel,
          litros: l,
          valor_litro: vl,
          valor_total: parseFloat(valorTotal),
          odometro_km: odo,
          condutor_nome: condutor,
          houve_calibracao_pneus: houveCalibracao,
          foto_calibracao_url: fotoCalibradorUrl,
          foto_cupom_url: fotoCupomUrl,
          comprovante_foto_url: fotoCupomUrl
        },
        viatura.tipo_veiculo
      );

      if (res.success && res.data) {
        onSuccess(res.data);
        onClose();
      } else {
        setErrorMsg(res.error || 'Falha ao registrar abastecimento.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erro inesperado.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ModalBaseCorporativo
      isOpen={isOpen}
      onClose={onClose}
      modalId="modal-frota-abastecimento"
      badgeSistema="TELEMETRIA SIGER & FROTA"
      badgeContrato={contratoId || viatura.contrato_id || 'ONÇA PUMA'}
      titulo={`ABASTECIMENTO • ${viatura.prefixo_frota} (${viatura.placa})`}
      subtitulo="Rastreamento de preços médios, conformidade de consumo e trava de segurança quinzenal de pneus"
      icon={Fuel}
      maxWidthClass="max-w-4xl"
      footer={
        <div className="flex w-full items-center justify-between">
          <div className="text-[11px] text-slate-500 font-sans">
            {isFormBloqueadoPorPneu ? (
              <span className="text-red-600 font-bold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Trava quinzenal de pneus ativa
              </span>
            ) : (
              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Calibração em conformidade
              </span>
            )}
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
              disabled={isSaving || isFormBloqueadoPorPneu}
              className={`px-5 py-2 text-xs font-bold text-white rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer ${
                isFormBloqueadoPorPneu
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800'
              }`}
            >
              {isSaving ? 'Gravando...' : 'Gravar Abastecimento'}
            </button>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5 font-sans">
        
        {/* BANNER 1: TRAVA CRÍTICA DOS 15 DIAS DE CALIBRAÇÃO DE PNEUS */}
        {statusCalibracao.bloqueioObrigatorio && (
          <div className="bg-red-50/90 border-2 border-red-500/80 rounded-2xl p-4 shadow-sm relative overflow-hidden animate-pulse">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-red-600 text-white shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-2 flex-grow">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-red-900 uppercase tracking-wide">
                    Trava de Segurança Quinzenal: Pneus Vencidos ({statusCalibracao.diasDesdeCalibracao} dias)
                  </h3>
                  <span className="text-[10px] bg-red-600 text-white font-bold px-2 py-0.5 rounded-full uppercase">
                    Bloqueio Obrigatório
                  </span>
                </div>
                <p className="text-xs text-red-800 leading-relaxed font-medium">
                  {statusCalibracao.mensagem}
                </p>

                {/* Checklist e Upload da Foto do Calibrador */}
                <div className="pt-2 border-t border-red-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <label className="flex items-center gap-2 text-xs font-bold text-red-950 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={houveCalibracao}
                      onChange={(e) => setHouveCalibracao(e.target.checked)}
                      className="w-4 h-4 rounded border-red-400 text-red-600 focus:ring-red-500"
                    />
                    Confirmo calibração realizada agora em todos os pneus
                  </label>

                  <div className="flex items-center gap-2">
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-red-300 text-red-700 hover:bg-red-50 rounded-xl text-xs font-bold cursor-pointer transition-all shadow-2xs">
                      <Camera className="w-3.5 h-3.5" />
                      {fotoCalibradorUrl ? 'Foto Anexada ✓' : 'Foto do Manômetro / Calibrador *'}
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleFotoCalibradorChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MENSAGEM DE ERRO GERAL */}
        {errorMsg && (
          <div className="p-3 bg-red-100 border border-red-300 rounded-xl text-xs text-red-800 font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* SEÇÃO 1: TELEMETRIA DE PREÇO & RANKING DE POSTOS */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                1. Precificação e Economia em Tempo Real
              </h3>
            </div>
            {postoMaisEconomico && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Posto Recomendado: {postoMaisEconomico.nome_posto}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Variação Delta Preço */}
            <div className={`p-3 rounded-xl border flex flex-col justify-between ${
              variacaoPreco.tendencia === 'ALTA' 
                ? 'bg-rose-50/70 border-rose-200 text-rose-800' 
                : variacaoPreco.tendencia === 'BAIXA' 
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800' 
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider">Δ Variação do Litro</span>
                {variacaoPreco.tendencia === 'ALTA' && <TrendingUp className="w-4 h-4 text-rose-600" />}
                {variacaoPreco.tendencia === 'BAIXA' && <TrendingDown className="w-4 h-4 text-emerald-600" />}
                {variacaoPreco.tendencia === 'ESTAVEL' && <MinusIcon className="w-4 h-4 text-slate-400" />}
              </div>
              <div className="mt-1">
                <div className="text-lg font-black font-mono">
                  {variacaoPreco.deltaValor > 0 ? `+R$ ${variacaoPreco.deltaValor.toFixed(3)}` : `R$ ${variacaoPreco.deltaValor.toFixed(3)}`}
                </div>
                <div className="text-[10px] font-medium opacity-80">
                  {variacaoPreco.percentualVariacao > 0 ? `+${variacaoPreco.percentualVariacao}%` : `${variacaoPreco.percentualVariacao}%`} vs. anterior (R$ {variacaoPreco.valorAnterior ? variacaoPreco.valorAnterior.toFixed(2) : '--'})
                </div>
              </div>
            </div>

            {/* Posto Mais Econômico dos Últimos 30 Dias */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 flex flex-col justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Posto Mais Econômico</span>
              <div className="mt-1">
                <div className="text-xs font-black truncate text-slate-900">
                  {postoMaisEconomico?.nome_posto || 'Posto Ipiranga - Rota Sul'}
                </div>
                <div className="text-[10px] font-semibold text-emerald-600">
                  Menor preço: R$ {postoMaisEconomico?.menor_preco.toFixed(2) || '5.99'} • Economia de ~{postoMaisEconomico?.percentual_economia || 4.8}%
                </div>
              </div>
            </div>

            {/* Total Estimado */}
            <div className="p-3 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 text-white flex flex-col justify-between shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total do Abastecimento</span>
              <div className="mt-1">
                <div className="text-xl font-black font-mono text-emerald-400">
                  R$ {valorTotal}
                </div>
                <div className="text-[10px] text-slate-400">
                  {litros || 0} litros × R$ {parseFloat(valorLitro || '0').toFixed(2)}/L
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SEÇÃO 2: DADOS DA BOMBA & CONDUTOR */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Fuel className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
              2. Registro na Bomba & Odômetro
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Nome do Posto
              </label>
              <input
                type="text"
                value={posto}
                onChange={(e) => setPosto(e.target.value)}
                placeholder="Ex: Posto Ipiranga Rota Sul"
                className="w-full text-xs font-semibold px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Combustível
              </label>
              <select
                value={tipoCombustivel}
                onChange={(e) => setTipoCombustivel(e.target.value as any)}
                className="w-full text-xs font-semibold px-3 py-2 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
              >
                <option value="DIESEL_S10">DIESEL S10</option>
                <option value="GASOLINA">GASOLINA COMUM</option>
                <option value="ETANOL">ETANOL</option>
                <option value="FLEX">FLEX</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Preço por Litro (R$)
              </label>
              <input
                type="number"
                step="0.01"
                value={valorLitro}
                onChange={(e) => setValorLitro(e.target.value)}
                className="w-full text-xs font-bold px-3 py-2 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Quantidade de Litros
              </label>
              <input
                type="number"
                step="0.1"
                value={litros}
                onChange={(e) => setLitros(e.target.value)}
                className="w-full text-xs font-bold px-3 py-2 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Odômetro Atual (KM)
              </label>
              <input
                type="number"
                value={novoOdometro}
                onChange={(e) => setNovoOdometro(e.target.value)}
                className="w-full text-xs font-bold px-3 py-2 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Último registrado: {viatura.odometro_atual_km} KM
              </span>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Condutor / Motorista
              </label>
              <input
                type="text"
                value={condutor}
                onChange={(e) => setCondutor(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Upload de Comprovante / Cupom Fiscal */}
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="text-xs text-slate-600 font-medium">
              Comprovante / Cupom Fiscal (Opcional para Prestação de Contas)
            </div>
            <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold cursor-pointer transition-all">
              <UploadCloud className="w-3.5 h-3.5 text-slate-500" />
              {fotoCupomUrl ? 'Cupom Anexado ✓' : 'Anexar Foto do Cupom'}
              <input
                type="file"
                accept="image/*"
                onChange={handleFotoCupomChange}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* SEÇÃO 3: AUDITORIA ANTIFRAUDE & AUTONOMIA */}
        <div className={`border rounded-2xl p-4 transition-all ${
          liveAudit.isDiscrepante 
            ? 'bg-amber-50/80 border-amber-300 text-amber-900' 
            : 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
        }`}>
          <div className="flex items-center gap-2.5">
            {liveAudit.isDiscrepante ? (
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            )}
            <div className="flex-grow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wide">
                  {liveAudit.isDiscrepante ? 'Alerta de Consumo Incomum' : 'Auditoria de Consumo Aprovada'}
                </span>
                {liveAudit.kmPorLitro !== null && (
                  <span className="text-xs font-black font-mono">
                    {liveAudit.kmPorLitro.toFixed(2)} KM/L
                  </span>
                )}
              </div>
              <p className="text-[11px] mt-0.5 opacity-90 font-sans">
                {liveAudit.isDiscrepante 
                  ? liveAudit.motivoDiscrepancia || 'Consumo fora do padrão de autonomia do veículo.' 
                  : `Autonomia estimada regular. Foram rodados ${liveAudit.kmRodados || 0} KM desde o último registro.`
                }
              </p>
            </div>
          </div>
        </div>

      </form>
    </ModalBaseCorporativo>
  );
};
