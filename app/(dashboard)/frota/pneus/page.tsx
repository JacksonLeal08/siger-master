'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSpci } from '@/app/context/SpciContext';
import { Viatura, InspecaoRodagemPneus, StatusTwi } from '@/lib/types/frota';
import { listViaturasAction } from '@/app/actions/frotaActions';
import { listHistoricoInspecoesRodagemAction } from '@/app/actions/pneuActions';
import { MapeamentoPneusModal } from '@/app/components/frota/MapeamentoPneusModal';
import { LaudoPneusPDFModal } from '@/app/components/frota/LaudoPneusPDFModal';
import { generateLaudoPneusPDF } from '@/lib/pdfLaudoPneusGenerator';
import { 
  Disc, 
  Truck, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  FileText, 
  Printer, 
  Plus, 
  Search, 
  ArrowLeft, 
  Gauge, 
  Scale, 
  Clock, 
  Eye 
} from 'lucide-react';

export default function GestaoPneusPage() {
  const router = useRouter();
  const { activeSite, userProfile, triggerSuccessNotification } = useSpci();

  const currentContratoId = useMemo(() => {
    if (activeSite && !activeSite.startsWith('TODOS') && activeSite !== 'GLOBAL') {
      return activeSite;
    }
    return userProfile?.site && !userProfile.site.startsWith('TODOS') ? userProfile.site : 'ONÇA PUMA';
  }, [activeSite, userProfile]);

  const [viaturas, setViaturas] = useState<Viatura[]>([]);
  const [inspecoes, setInspecoes] = useState<InspecaoRodagemPneus[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [termoBusca, setTermoBusca] = useState<string>('');
  const [filtroStatus, setFiltroStatus] = useState<string>('TODOS');

  // Modais
  const [modalInspecaoOpen, setModalInspecaoOpen] = useState<boolean>(false);
  const [viaturaParaInspecao, setViaturaParaInspecao] = useState<Viatura | null>(null);

  const [modalPdfOpen, setModalPdfOpen] = useState<boolean>(false);
  const [inspecaoParaPdf, setInspecaoParaPdf] = useState<InspecaoRodagemPneus | null>(null);
  const [viaturaParaPdf, setViaturaParaPdf] = useState<Viatura | null>(null);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const [vRes, iRes] = await Promise.all([
        listViaturasAction(currentContratoId),
        listHistoricoInspecoesRodagemAction(currentContratoId)
      ]);

      if (vRes.success && vRes.data) setViaturas(vRes.data);
      if (iRes.success && iRes.data) setInspecoes(iRes.data);
    } catch (err) {
      console.error('Erro ao carregar dados de pneus:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, [currentContratoId]);

  // KPIs de Rodagem
  const kpis = useMemo(() => {
    let criticos = 0;
    let atencao = 0;
    let conformes = 0;

    inspecoes.forEach((i) => {
      if (i.status_geral_twi === 'CRITICO_PROIBIDO') criticos++;
      else if (i.status_geral_twi === 'ATENCAO') atencao++;
      else conformes++;
    });

    const total = inspecoes.length;
    const taxaConformidade = total > 0 ? ((conformes / total) * 100).toFixed(1) : '100.0';

    return { criticos, atencao, conformes, total, taxaConformidade };
  }, [inspecoes]);

  // Filtro de Viaturas
  const viaturasFiltradas = useMemo(() => {
    return viaturas.filter((v) => {
      const matchTexto = 
        v.prefixo_frota.toLowerCase().includes(termoBusca.toLowerCase()) ||
        v.placa.toLowerCase().includes(termoBusca.toLowerCase()) ||
        v.modelo.toLowerCase().includes(termoBusca.toLowerCase()) ||
        (v.marca_modelo_crlv || '').toLowerCase().includes(termoBusca.toLowerCase());

      return matchTexto;
    });
  }, [viaturas, termoBusca]);

  // Abertura de modal de inspeção
  const handleAbrirInspecao = (viatura: Viatura) => {
    setViaturaParaInspecao(viatura);
    setModalInspecaoOpen(true);
  };

  // Disparo de Laudo Pericial em PDF
  const handleAbrirPdf = (inspecao: InspecaoRodagemPneus) => {
    const v = viaturas.find((x) => x.id === inspecao.viatura_id) || {
      id: inspecao.viatura_id,
      contrato_id: currentContratoId,
      prefixo_frota: 'VTR-FROTA',
      placa: 'BRA2E19',
      tipo_veiculo: 'CAMINHONETE',
      marca: 'TOYOTA',
      modelo: 'HILUX 2.8',
      tipo_combustivel: 'DIESEL_S10',
      odometro_atual_km: inspecao.odometro_km,
      status_operacional: 'DISPONIVEL'
    } as Viatura;

    setInspecaoParaPdf(inspecao);
    setViaturaParaPdf(v);
    setModalPdfOpen(true);
  };

  return (
    <div className="space-y-6 select-none font-sans pb-16">
      {/* Header Cockpit Executivo */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <button
              onClick={() => router.push('/viaturas')}
              className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-slate-500 hover:text-red-500 transition-colors cursor-pointer bg-transparent border-none p-0"
            >
              <ArrowLeft className="w-3 h-3" /> Gestão de Frota
            </button>
            <span className="text-slate-400">•</span>
            <span className="text-[10px] bg-red-600/10 text-red-600 border border-red-600/20 px-2 py-0.5 rounded-full font-mono font-bold uppercase">
              METROLOGIA & RODAGEM
            </span>
            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded font-mono font-bold">
              Site: {currentContratoId}
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Disc className="w-6 h-6 text-red-600" />
            Metrologia e Gestão de Rodagem Veicular
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-sans">
            Auditoria normativa de desgaste de banda de rodagem, projeção de quilometragem e laudos periciais (CONTRAN nº 558/80)
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => {
              if (viaturas.length > 0) {
                handleAbrirInspecao(viaturas[0]);
              } else {
                alert('Nenhuma viatura cadastrada para este contrato.');
              }
            }}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-mono font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer border-none"
          >
            <Plus className="w-4 h-4" /> Nova Aferição de Pneus
          </button>
        </div>
      </div>

      {/* Cards de Métricas e KPIs Metrológicos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total de Inspeções */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase text-slate-400">Total Vistorias</span>
            <Scale className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-2 font-mono">
            {kpis.total}
          </p>
          <p className="text-[10px] text-slate-500 mt-1 font-mono">
            {viaturas.length} viaturas monitoradas
          </p>
        </div>

        {/* Card 2: Críticos TWI */}
        <div className="bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/60 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase text-red-500">Críticos TWI (≤ 1.6 mm)</span>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-2xl font-black text-red-500 mt-2 font-mono">
            {kpis.criticos}
          </p>
          <p className="text-[10px] text-red-400 mt-1 font-mono">
            Infração CONTRAN / Troca Imediata
          </p>
        </div>

        {/* Card 3: Atenção Preventiva */}
        <div className="bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/60 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase text-amber-500">Atenção (1.7 a 2.9 mm)</span>
            <ShieldAlert className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-500 mt-2 font-mono">
            {kpis.atencao}
          </p>
          <p className="text-[10px] text-amber-500 mt-1 font-mono">
            Planejamento de Substituição
          </p>
        </div>

        {/* Card 4: Taxa de Conformidade */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase text-slate-400">Conformidade Frota</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-500 mt-2 font-mono">
            {kpis.taxaConformidade}%
          </p>
          <p className="text-[10px] text-slate-500 mt-1 font-mono">
            {kpis.conformes} viaturas plenamente conformes
          </p>
        </div>
      </div>

      {/* Catálogo de Viaturas & Aferição Direta */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
          <div>
            <h3 className="text-base font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Truck className="w-4 h-4 text-red-600" />
              Viaturas Disponíveis para Mapeamento de Pneus
            </h3>
            <p className="text-xs text-slate-500">
              Selecione a viatura para abrir o diagrama do chassi com memória de cálculo em tempo real
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por prefixo, placa ou modelo..."
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-mono outline-none focus:border-red-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 font-mono text-xs">
            Carregando viaturas e telemetria metrológica...
          </div>
        ) : viaturasFiltradas.length === 0 ? (
          <div className="py-12 text-center text-slate-400 font-mono text-xs">
            Nenhuma viatura encontrada no contrato {currentContratoId}.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {viaturasFiltradas.map((v) => (
              <div
                key={v.id}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 hover:border-red-500/50 transition-all flex flex-col justify-between gap-3 shadow-2xs group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono font-black text-sm text-slate-900 dark:text-slate-100">
                      {v.prefixo_frota}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                      {v.placa}
                    </span>
                  </div>

                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {v.marca_modelo_crlv || `${v.marca} ${v.modelo}`}
                  </p>

                  <div className="flex items-center gap-3 text-[11px] font-mono text-slate-500 mt-2">
                    <span className="flex items-center gap-1">
                      <Gauge className="w-3 h-3 text-red-500" />
                      {(v.odometro_atual_km || 0).toLocaleString('pt-BR')} km
                    </span>
                    <span>•</span>
                    <span>{v.tipo_combustivel}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleAbrirInspecao(v)}
                    className="flex-1 py-2 px-3 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border-none shadow-sm"
                  >
                    <Disc className="w-3.5 h-3.5" />
                    <span>Inspecionar Pneus</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Histórico Recente de Laudos de Rodagem */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
          <div>
            <h3 className="text-base font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-500" />
              Histórico de Vistorias e Laudos Emitidos
            </h3>
            <p className="text-xs text-slate-500">
              Registros históricos de metrologia com suporte à emissão de Laudo Pericial em PDF
            </p>
          </div>
        </div>

        {inspecoes.length === 0 ? (
          <div className="py-8 text-center text-slate-400 font-mono text-xs">
            Nenhuma vistoria de rodagem registrada até o momento. Realize a primeira medição acima.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] text-slate-400 uppercase">
                  <th className="py-2.5 px-3">Data / Hora</th>
                  <th className="py-2.5 px-3">Viatura</th>
                  <th className="py-2.5 px-3">Odômetro</th>
                  <th className="py-2.5 px-3">Status TWI</th>
                  <th className="py-2.5 px-3">Calibração</th>
                  <th className="py-2.5 px-3">Técnico Inspetor</th>
                  <th className="py-2.5 px-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody>
                {inspecoes.map((item) => (
                  <tr 
                    key={item.id}
                    className="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-3 text-slate-400">
                      {new Date(item.data_hora).toLocaleString('pt-BR')}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-slate-100">
                      {item.viatura?.prefixo_frota || 'VTR'} ({item.viatura?.placa || 'PLACA'})
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      {(item.odometro_km || 0).toLocaleString('pt-BR')} km
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.status_geral_twi === 'CRITICO_PROIBIDO'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : item.status_geral_twi === 'ATENCAO'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}>
                        {item.status_geral_twi}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      {item.houve_calibracao ? '✅ Sim' : '❌ Não'}
                    </td>
                    <td className="py-3 px-3 text-slate-400">
                      {item.tecnico_nome}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleAbrirPdf(item)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-bold flex items-center gap-1.5 ml-auto transition-colors cursor-pointer border border-slate-700"
                        title="Visualizar e Imprimir Laudo em PDF"
                      >
                        <FileText className="w-3.5 h-3.5 text-red-400" />
                        <span>Laudo PDF</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Mapeamento Interativo de Pneus */}
      {modalInspecaoOpen && viaturaParaInspecao && (
        <MapeamentoPneusModal
          isOpen={modalInspecaoOpen}
          viatura={viaturaParaInspecao}
          contratoId={currentContratoId}
          onClose={() => {
            setModalInspecaoOpen(false);
            setViaturaParaInspecao(null);
          }}
          onSuccess={() => {
            carregarDados();
            triggerSuccessNotification('Inspeção Metrológica Concluída!', 'Medições de rodagem salvas com sucesso.');
          }}
          tecnicoPadrao={userProfile?.nome || 'Jackson Leal - Inspetor'}
        />
      )}

      {/* Modal Laudo Pericial de Rodagem em PDF */}
      {modalPdfOpen && inspecaoParaPdf && viaturaParaPdf && (
        <LaudoPneusPDFModal
          isOpen={modalPdfOpen}
          inspecao={inspecaoParaPdf}
          viatura={viaturaParaPdf}
          onClose={() => {
            setModalPdfOpen(false);
            setInspecaoParaPdf(null);
            setViaturaParaPdf(null);
          }}
          responsavelNome={userProfile?.nome || 'Jackson Leal - Engenheiro Responsável'}
        />
      )}
    </div>
  );
}
