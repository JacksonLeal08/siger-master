'use server';

import { createClient } from '@supabase/supabase-js';
import { 
  Viatura, 
  Abastecimento, 
  InspecaoPneu, 
  OrdemServicoFrota, 
  OficinaPrestador, 
  FrotaKpisSummary,
  classificarSulcoTwi 
} from '@/lib/types/frota';
import { FuelAuditService } from '@/lib/fuelAuditService';

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
    const payload = {
      ...viatura,
      prefixo_frota: viatura.prefixo_frota?.trim().toUpperCase(),
      placa: viatura.placa?.trim().toUpperCase(),
      contrato_id: viatura.contrato_id || 'ONÇA PUMA'
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

// ==============================================================================
// 2. ABASTECIMENTOS & AUDITORIA
// ==============================================================================

export async function listAbastecimentosAction(viaturaId?: string, contratoId?: string): Promise<{ success: boolean; data?: Abastecimento[]; error?: string }> {
  try {
    const supabase = getSupabaseAdminClient();
    let query = supabase.from('abastecimentos').select('*').order('data_hora', { ascending: false });

    if (viaturaId) {
      query = query.eq('viatura_id', viaturaId);
    }
    if (contratoId && contratoId !== 'TODOS' && contratoId !== 'GLOBAL') {
      query = query.eq('contrato_id', contratoId);
    }

    const { data, error } = await query;
    if (error) throw error;
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
  try {
    const supabase = getSupabaseAdminClient();
    if (!abastecimento.viatura_id) {
      throw new Error('Viatura ID é obrigatório para registrar abastecimento.');
    }

    // Busca o último abastecimento para calcular autonomia
    const { data: ultimos } = await supabase
      .from('abastecimentos')
      .select('odometro_km')
      .eq('viatura_id', abastecimento.viatura_id)
      .order('data_hora', { ascending: false })
      .limit(1);

    const odometroAnterior = ultimos && ultimos.length > 0 ? Number(ultimos[0].odometro_km) : null;

    // Executa auditoria antifraude de consumo
    const analise = FuelAuditService.analyze({
      odometroAtualKm: Number(abastecimento.odometro_km || 0),
      odometroAnteriorKm: odometroAnterior,
      litros: Number(abastecimento.litros || 0),
      tipoVeiculo,
      tipoCombustivel: abastecimento.tipo_combustivel
    });

    const payload = {
      ...abastecimento,
      km_rodados: analise.kmRodados,
      km_por_litro: analise.kmPorLitro,
      is_discrepante: analise.isDiscrepante,
      motivo_discrepancia: analise.motivoDiscrepancia
    };

    const { data, error } = await supabase
      .from('abastecimentos')
      .insert(payload)
      .select('*')
      .single();

    if (error) throw error;

    // Atualiza odômetro atual da viatura se o novo for maior
    if (abastecimento.odometro_km) {
      await supabase
        .from('viaturas')
        .update({ odometro_atual_km: abastecimento.odometro_km })
        .eq('id', abastecimento.viatura_id)
        .lt('odometro_atual_km', abastecimento.odometro_km);
    }

    return { success: true, data: data as Abastecimento };
  } catch (err: any) {
    console.error('[frotaActions] Erro ao salvar abastecimento:', err);
    return { success: false, error: err?.message || 'Falha ao registrar abastecimento' };
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
