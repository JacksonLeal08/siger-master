'use server';

import { createClient } from '@supabase/supabase-js';
import { 
  Viatura, 
  Abastecimento, 
  InspecaoPneu, 
  OrdemServicoFrota, 
  OficinaPrestador, 
  FrotaKpisSummary,
  classificarSulcoTwi,
  RankingPostoInfo,
  ViaturaTrackingTelemetry
} from '@/lib/types/frota';
import { FuelAuditService } from '@/lib/fuelAuditService';
import { FuelPricingService } from '@/lib/services/FuelPricingService';
import { FleetTrackingAdapter } from '@/lib/adapters/FleetTrackingAdapter';

const getSupabaseAdminClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Configuração ausente: NEXT_PUBLIC_SUPABASE_URL ou credenciais do Supabase não configuradas no servidor.'
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

// ==============================================================================
// 1. VIATURAS
// ==============================================================================

export async function listViaturasAction(contratoId?: string): Promise<{ success: boolean; data?: Viatura[]; error?: string }> {
  try {
    const supabase = getSupabaseAdminClient();
    let query = supabase.from('vw_viaturas_cockpit').select('*').order('prefixo_frota', { ascending: true });

    if (contratoId && contratoId !== 'TODOS' && contratoId !== 'GLOBAL') {
      query = query.eq('contrato_id', contratoId);
    }

    const { data, error } = await query;
    if (error) {
      // Fallback para tabela direta caso a view ainda não tenha sido executada
      const fallbackQuery = supabase.from('viaturas').select('*').order('prefixo_frota', { ascending: true });
      if (contratoId && contratoId !== 'TODOS' && contratoId !== 'GLOBAL') {
        fallbackQuery.eq('contrato_id', contratoId);
      }
      const fallbackRes = await fallbackQuery;
      if (fallbackRes.error) throw fallbackRes.error;
      return { success: true, data: fallbackRes.data as Viatura[] };
    }

    return { success: true, data: (data || []) as Viatura[] };
  } catch (err: any) {
    console.error('[frotaActions] Erro ao listar viaturas:', err);
    return { success: false, error: err?.message || 'Erro ao carregar lista de viaturas' };
  }
}

export async function saveViaturaAction(viatura: Partial<Viatura>): Promise<{ success: boolean; data?: Viatura; error?: string }> {
  try {
    const supabase = getSupabaseAdminClient();
    
    const kmPrev = viatura.km_ultima_preventiva !== undefined && viatura.km_ultima_preventiva !== null
      ? Number(viatura.km_ultima_preventiva)
      : (viatura.odometro_ultima_preventiva_km !== undefined && viatura.odometro_ultima_preventiva_km !== null
          ? Number(viatura.odometro_ultima_preventiva_km)
          : null);

    const intervalo = viatura.intervalo_revisao_km ? Number(viatura.intervalo_revisao_km) : 10000;

    const payload = {
      ...viatura,
      prefixo_frota: viatura.prefixo_frota?.trim().toUpperCase(),
      placa: viatura.placa?.trim().toUpperCase(),
      contrato_id: viatura.contrato_id || 'ONÇA PUMA',
      data_ultima_preventiva: viatura.data_ultima_preventiva || null,
      km_ultima_preventiva: kmPrev,
      odometro_ultima_preventiva_km: kmPrev,
      intervalo_revisao_km: intervalo
    };

    const { data, error } = await supabase
      .from('viaturas')
      .upsert(payload)
      .select('*')
      .single();

    if (error) throw error;
    return { success: true, data: data as Viatura };
  } catch (err: any) {
    console.error('[frotaActions] Erro ao salvar viatura:', err);
    return { success: false, error: err?.message || 'Falha ao salvar dados da viatura' };
  }
}

export async function updateViaturaFotoAction(viaturaId: string, fotoUrl: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseAdminClient();
    const { error } = await supabase
      .from('viaturas')
      .update({ foto_veiculo_url: fotoUrl })
      .eq('id', viaturaId);

    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error('[frotaActions] Erro ao atualizar foto da viatura:', err);
    return { success: false, error: err?.message || 'Falha ao salvar foto da viatura' };
  }
}

// ==============================================================================
// 2. ABASTECIMENTOS & AUDITORIA
// ==============================================================================

export async function listAbastecimentosAction(viaturaId?: string, contratoId?: string): Promise<{ success: boolean; data?: Abastecimento[]; error?: string }> {
  try {
    const supabase = getSupabaseAdminClient();
    let query = supabase
      .from('abastecimentos')
      .select(`
        *,
        viatura:viaturas (
          id,
          prefixo_frota,
          placa,
          tipo_veiculo
        )
      `)
      .order('data_hora', { ascending: false });

    if (viaturaId) {
      query = query.eq('viatura_id', viaturaId);
    }
    if (contratoId && contratoId !== 'TODOS' && contratoId !== 'GLOBAL') {
      query = query.eq('contrato_id', contratoId);
    }

    const { data, error } = await query;
    if (error) {
      // Fallback em caso de erro no join
      console.warn('[frotaActions] Fallback query abastecimentos sem join:', error);
      const fallbackQuery = supabase.from('abastecimentos').select('*').order('data_hora', { ascending: false });
      if (viaturaId) fallbackQuery.eq('viatura_id', viaturaId);
      if (contratoId && contratoId !== 'TODOS' && contratoId !== 'GLOBAL') fallbackQuery.eq('contrato_id', contratoId);
      const fbRes = await fallbackQuery;
      if (fbRes.error) throw fbRes.error;
      return { success: true, data: (fbRes.data || []) as Abastecimento[] };
    }
    return { success: true, data: (data || []) as Abastecimento[] };
  } catch (err: any) {
    console.error('[frotaActions] Erro ao listar abastecimentos:', err);
    return { success: false, error: err?.message || 'Erro ao carregar abastecimentos' };
  }
}

export async function saveAbastecimentoAction(
  abastecimento: Partial<Abastecimento>, 
  tipoVeiculo: any = 'CAMINHONETE'
): Promise<{ success: boolean; data?: Abastecimento; error?: string }> {
  return registrarAbastecimentoAction(abastecimento, tipoVeiculo);
}

export async function registrarAbastecimentoAction(
  abastecimento: Partial<Abastecimento>, 
  tipoVeiculo: any = 'CAMINHONETE'
): Promise<{ success: boolean; data?: Abastecimento; error?: string }> {
  try {
    const supabase = getSupabaseAdminClient();
    if (!abastecimento.viatura_id) {
      throw new Error('Viatura ID é obrigatório para registrar abastecimento.');
    }

    // 1. Busca dados da viatura para validar trava de 15 dias de pneus e odômetro
    const { data: vtr } = await supabase
      .from('viaturas')
      .select('id, data_ultima_calibracao, contrato_id, odometro_atual_km, tipo_veiculo')
      .eq('id', abastecimento.viatura_id)
      .single();

    const veiculoTipoFinal = vtr?.tipo_veiculo || tipoVeiculo || 'CAMINHONETE';

    // 2. Trava de 15 Dias de Calibração de Pneus
    const statusCalibracao = FuelPricingService.validarCalibracaoPneus(vtr?.data_ultima_calibracao);
    if (statusCalibracao.bloqueioObrigatorio && !abastecimento.houve_calibracao_pneus) {
      return {
        success: false,
        error: statusCalibracao.mensagem
      };
    }

    if (abastecimento.houve_calibracao_pneus && !abastecimento.foto_calibracao_url) {
      return {
        success: false,
        error: 'É obrigatório anexar a foto do manômetro/calibrador para validar o registro de calibragem.'
      };
    }

    // 3. Busca o último abastecimento para calcular autonomia
    const { data: ultimos } = await supabase
      .from('abastecimentos')
      .select('odometro_km')
      .eq('viatura_id', abastecimento.viatura_id)
      .order('data_hora', { ascending: false })
      .limit(1);

    const odometroAnterior = ultimos && ultimos.length > 0 ? Number(ultimos[0].odometro_km) : null;

    // 4. Busca último abastecimento do mesmo combustível para calcular Delta Valor e % Variação
    let queryPreco = supabase
      .from('abastecimentos')
      .select('valor_litro')
      .eq('tipo_combustivel', abastecimento.tipo_combustivel || 'DIESEL_S10')
      .order('data_hora', { ascending: false })
      .limit(1);

    if (abastecimento.contrato_id && abastecimento.contrato_id !== 'TODOS' && abastecimento.contrato_id !== 'GLOBAL') {
      queryPreco = queryPreco.eq('contrato_id', abastecimento.contrato_id);
    }

    const { data: ultPrecoData } = await queryPreco;
    const ultimoValorLitro = ultPrecoData && ultPrecoData.length > 0 ? Number(ultPrecoData[0].valor_litro) : null;
    const variacaoPreco = FuelPricingService.calcularVariacaoPreco(
      Number(abastecimento.valor_litro || 0),
      ultimoValorLitro
    );

    // 5. Executa auditoria antifraude de consumo
    const analise = FuelAuditService.analyze({
      odometroAtualKm: Number(abastecimento.odometro_km || 0),
      odometroAnteriorKm: odometroAnterior,
      litros: Number(abastecimento.litros || 0),
      tipoVeiculo: veiculoTipoFinal,
      tipoCombustivel: abastecimento.tipo_combustivel
    });

    const motoristaFinal = abastecimento.motorista_nome || abastecimento.condutor_nome || 'Condutor Operacional';

    const dbPayload = {
      contrato_id: abastecimento.contrato_id || vtr?.contrato_id || 'ONÇA PUMA',
      viatura_id: abastecimento.viatura_id,
      data_hora: abastecimento.data_hora || new Date().toISOString(),
      posto: (abastecimento.nome_posto || abastecimento.posto || 'Posto Convencionado').trim(),
      nome_posto: (abastecimento.nome_posto || abastecimento.posto || 'Posto Convencionado').trim(),
      tipo_combustivel: abastecimento.tipo_combustivel || 'DIESEL_S10',
      litros: Number(abastecimento.litros || 0),
      valor_litro: Number(abastecimento.valor_litro || 0),
      valor_total: Number(abastecimento.valor_total || 0),
      odometro_km: Number(abastecimento.odometro_km || 0),
      condutor_nome: motoristaFinal,
      motorista_nome: motoristaFinal,
      variacao_preco_litro: variacaoPreco.deltaValor,
      percentual_variacao: variacaoPreco.percentualVariacao,
      km_rodados: analise.kmRodados,
      km_por_litro: analise.kmPorLitro,
      is_discrepante: analise.isDiscrepante,
      motivo_discrepancia: analise.motivoDiscrepancia,
      houve_calibracao_pneus: Boolean(abastecimento.houve_calibracao_pneus),
      foto_calibracao_url: abastecimento.foto_calibracao_url || null,
      foto_cupom_url: abastecimento.foto_cupom_url || abastecimento.comprovante_foto_url || null,
      comprovante_foto_url: abastecimento.comprovante_foto_url || abastecimento.foto_cupom_url || null,
      latitude_posto: abastecimento.latitude_posto ? Number(abastecimento.latitude_posto) : null,
      longitude_posto: abastecimento.longitude_posto ? Number(abastecimento.longitude_posto) : null
    };

    const { data, error } = await supabase
      .from('abastecimentos')
      .insert(dbPayload)
      .select('*')
      .single();

    if (error) throw error;

    // 6. Atualiza viatura: odômetro e calibragem se aplicável
    const updatesViatura: Record<string, any> = {};
    if (abastecimento.odometro_km && (!vtr?.odometro_atual_km || abastecimento.odometro_km > vtr.odometro_atual_km)) {
      updatesViatura.odometro_atual_km = abastecimento.odometro_km;
    }
    if (abastecimento.houve_calibracao_pneus) {
      updatesViatura.data_ultima_calibracao = abastecimento.data_hora || new Date().toISOString();
    }

    if (Object.keys(updatesViatura).length > 0) {
      await supabase
        .from('viaturas')
        .update(updatesViatura)
        .eq('id', abastecimento.viatura_id);
    }

    return { success: true, data: data as Abastecimento };
  } catch (err: any) {
    console.error('[frotaActions] Erro ao salvar abastecimento:', err);
    return { success: false, error: err?.message || 'Falha ao registrar abastecimento' };
  }
}

export async function getRankingPostosAction(
  contratoId?: string, 
  tipoCombustivel?: string
): Promise<{ success: boolean; data?: RankingPostoInfo[]; postoMaisEconomico?: RankingPostoInfo | null; error?: string }> {
  try {
    const supabase = getSupabaseAdminClient();
    let query = supabase.from('abastecimentos').select('*').order('data_hora', { ascending: false }).limit(200);

    if (contratoId && contratoId !== 'TODOS' && contratoId !== 'GLOBAL') {
      query = query.eq('contrato_id', contratoId);
    }

    const { data, error } = await query;
    if (error) throw error;

    const res = FuelPricingService.getPostoMaisEconomico(data || [], tipoCombustivel);
    return { success: true, data: res.ranking, postoMaisEconomico: res.postoMaisEconomico };
  } catch (err: any) {
    console.error('[frotaActions] Erro ao calcular ranking de postos:', err);
    return { success: false, error: err?.message || 'Falha ao obter ranking de postos' };
  }
}

// ==============================================================================
// 3. INSPEÇÃO DE PNEUS (TWI CONTRAN 558/80)
// ==============================================================================

export async function listInspecoesPneusAction(viaturaId?: string, contratoId?: string): Promise<{ success: boolean; data?: InspecaoPneu[]; error?: string }> {
  try {
    const supabase = getSupabaseAdminClient();
    let query = supabase.from('inspecoes_pneus').select('*').order('data_hora', { ascending: false });

    if (viaturaId) {
      query = query.eq('viatura_id', viaturaId);
    }
    if (contratoId && contratoId !== 'TODOS' && contratoId !== 'GLOBAL') {
      query = query.eq('contrato_id', contratoId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return { success: true, data: (data || []) as InspecaoPneu[] };
  } catch (err: any) {
    console.error('[frotaActions] Erro ao listar inspeções de pneus:', err);
    return { success: false, error: err?.message || 'Erro ao carregar medições de pneus' };
  }
}

export async function saveInspecaoPneuAction(inspecao: Partial<InspecaoPneu>): Promise<{ success: boolean; data?: InspecaoPneu; error?: string }> {
  try {
    const supabase = getSupabaseAdminClient();
    const sulco = Number(inspecao.sulco_mm || 0);
    const statusTwi = classificarSulcoTwi(sulco);

    const payload = {
      ...inspecao,
      sulco_mm: sulco,
      status_twi: statusTwi
    };

    const { data, error } = await supabase
      .from('inspecoes_pneus')
      .insert(payload)
      .select('*')
      .single();

    if (error) throw error;
    return { success: true, data: data as InspecaoPneu };
  } catch (err: any) {
    console.error('[frotaActions] Erro ao salvar inspeção de pneu:', err);
    return { success: false, error: err?.message || 'Falha ao gravar inspeção de pneu' };
  }
}

// ==============================================================================
// 4. ORDENS DE SERVIÇO & OFICINAS
// ==============================================================================

export async function listOrdensServicoAction(contratoId?: string): Promise<{ success: boolean; data?: OrdemServicoFrota[]; error?: string }> {
  try {
    const supabase = getSupabaseAdminClient();
    let query = supabase.from('ordens_servico_frota').select('*, viatura:viaturas(*), oficina:oficinas_prestadores(*)').order('data_abertura', { ascending: false });

    if (contratoId && contratoId !== 'TODOS' && contratoId !== 'GLOBAL') {
      query = query.eq('contrato_id', contratoId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return { success: true, data: (data || []) as OrdemServicoFrota[] };
  } catch (err: any) {
    console.error('[frotaActions] Erro ao listar ordens de serviço:', err);
    return { success: false, error: err?.message || 'Erro ao carregar ordens de serviço' };
  }
}

export async function saveOrdemServicoAction(os: Partial<OrdemServicoFrota>): Promise<{ success: boolean; data?: OrdemServicoFrota; error?: string }> {
  try {
    const supabase = getSupabaseAdminClient();
    const payload = {
      ...os,
      numero_os: os.numero_os || `OS-${Date.now().toString().slice(-6)}`,
      contrato_id: os.contrato_id || 'ONÇA PUMA'
    };

    const { data, error } = await supabase
      .from('ordens_servico_frota')
      .upsert(payload)
      .select('*')
      .single();

    if (error) throw error;

    // Atualiza status da viatura se em oficina externa ou manutenção
    if (os.viatura_id && os.status === 'EM_ANDAMENTO') {
      const novoStatus = os.tipo_os === 'EXTERNA' ? 'EM_OFICINA_EXTERNA' : 'EM_MANUTENCAO_INTERNA';
      await supabase.from('viaturas').update({ status_operacional: novoStatus }).eq('id', os.viatura_id);
    } else if (os.viatura_id && os.status === 'CONCLUIDA') {
      await supabase.from('viaturas').update({ status_operacional: 'DISPONIVEL' }).eq('id', os.viatura_id);
    }

    return { success: true, data: data as OrdemServicoFrota };
  } catch (err: any) {
    console.error('[frotaActions] Erro ao salvar OS:', err);
    return { success: false, error: err?.message || 'Falha ao processar Ordem de Serviço' };
  }
}

export async function listOficinasAction(contratoId?: string): Promise<{ success: boolean; data?: OficinaPrestador[]; error?: string }> {
  try {
    const supabase = getSupabaseAdminClient();
    let query = supabase.from('oficinas_prestadores').select('*').eq('ativo', true).order('razao_social', { ascending: true });

    if (contratoId && contratoId !== 'TODOS' && contratoId !== 'GLOBAL') {
      query = query.eq('contrato_id', contratoId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return { success: true, data: (data || []) as OficinaPrestador[] };
  } catch (err: any) {
    console.error('[frotaActions] Erro ao listar oficinas:', err);
    return { success: false, error: err?.message || 'Erro ao carregar oficinas credenciadas' };
  }
}

export async function saveOficinaAction(oficina: Partial<OficinaPrestador>): Promise<{ success: boolean; data?: OficinaPrestador; error?: string }> {
  try {
    const supabase = getSupabaseAdminClient();
    const payload = {
      ...oficina,
      razao_social: oficina.razao_social?.trim().toUpperCase(),
      contrato_id: oficina.contrato_id || 'ONÇA PUMA',
      ativo: oficina.ativo !== undefined ? oficina.ativo : true
    };

    const { data, error } = await supabase
      .from('oficinas_prestadores')
      .upsert(payload)
      .select('*')
      .single();

    if (error) throw error;
    return { success: true, data: data as OficinaPrestador };
  } catch (err: any) {
    console.error('[frotaActions] Erro ao salvar oficina:', err);
    return { success: false, error: err?.message || 'Falha ao salvar oficina credenciada' };
  }
}

// ==============================================================================
// 5. TELEMETRIA & RASTREAMENTO GIS (LEAFLET)
// ==============================================================================

export async function getFrotaTrackingAction(contratoId?: string): Promise<{
  success: boolean;
  viaturas: ViaturaTrackingTelemetry[];
  postos: any[];
  error?: string;
}> {
  try {
    const listRes = await listViaturasAction(contratoId);
    const telemetry = FleetTrackingAdapter.getTelemetryPositions(listRes.data || []);
    const postos = FleetTrackingAdapter.getPostosGeorreferenciados();
    return { success: true, viaturas: telemetry, postos };
  } catch (err: any) {
    console.error('[frotaActions] Erro ao carregar telemetria:', err);
    return { success: false, viaturas: [], postos: [], error: err?.message || 'Erro ao carregar telemetria da frota' };
  }
}

// ==============================================================================
// 5. KPIS DO COCKPIT EXECUTIVO
// ==============================================================================

export async function getFrotaKpisAction(contratoId?: string): Promise<{ success: boolean; data?: FrotaKpisSummary; error?: string }> {
  try {
    const supabase = getSupabaseAdminClient();
    
    // Contagem de Viaturas
    let queryV = supabase.from('viaturas').select('status_operacional, vencimento_crlv, vencimento_seguro');
    if (contratoId && contratoId !== 'TODOS' && contratoId !== 'GLOBAL') {
      queryV = queryV.eq('contrato_id', contratoId);
    }
    const { data: viaturas } = await queryV;

    // Contagem de Abastecimentos Suspeitos
    let queryA = supabase.from('abastecimentos').select('id', { count: 'exact', head: true }).eq('is_discrepante', true);
    if (contratoId && contratoId !== 'TODOS' && contratoId !== 'GLOBAL') {
      queryA = queryA.eq('contrato_id', contratoId);
    }
    const { count: countAbastecimentosSuspeitos } = await queryA;

    // Contagem de Pneus Críticos TWI
    let queryP = supabase.from('inspecoes_pneus').select('id', { count: 'exact', head: true }).eq('status_twi', 'CRITICO_PROIBIDO');
    if (contratoId && contratoId !== 'TODOS' && contratoId !== 'GLOBAL') {
      queryP = queryP.eq('contrato_id', contratoId);
    }
    const { count: countPneusCriticos } = await queryP;

    const list = viaturas || [];
    const hoje = new Date();
    const em30Dias = new Date();
    em30Dias.setDate(em30Dias.getDate() + 30);

    const crlvAVencerOuVencido = list.filter(v => {
      if (!v.vencimento_crlv) return false;
      const d = new Date(v.vencimento_crlv);
      return d <= em30Dias;
    }).length;

    const segurosAVencerOuVencido = list.filter(v => {
      if (!v.vencimento_seguro) return false;
      const d = new Date(v.vencimento_seguro);
      return d <= em30Dias;
    }).length;

    const kpis: FrotaKpisSummary = {
      totalViaturas: list.length,
      disponiveis: list.filter(v => v.status_operacional === 'DISPONIVEL').length,
      emDeslocamento: list.filter(v => v.status_operacional === 'EM_DESLOCAMENTO').length,
      emManutencao: list.filter(v => v.status_operacional === 'EM_MANUTENCAO_INTERNA' || v.status_operacional === 'EM_OFICINA_EXTERNA').length,
      pneusCriticosTwi: countPneusCriticos || 0,
      abastecimentosSuspeitos: countAbastecimentosSuspeitos || 0,
      crlvAVencerOuVencido,
      segurosAVencerOuVencido
    };

    return { success: true, data: kpis };
  } catch (err: any) {
    console.error('[frotaActions] Erro ao calcular KPIs de frota:', err);
    return { success: false, error: err?.message || 'Falha no cálculo dos KPIs' };
  }
}
