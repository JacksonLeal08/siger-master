'use server';

import { createClient } from '@supabase/supabase-js';
import { 
  CatalogoPneuReferencia, 
  InspecaoRodagemPneus, 
  ItemAfericaoPneu,
  StatusTwi
} from '@/lib/types/frota';
import { 
  CATALOGO_PNEUS_HOMOLOGADOS_PADRAO,
  TireWearCalculator 
} from '@/lib/services/TireWearCalculator';

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

/**
 * 1. Obter Catálogo de Pneus Homologados de Fábrica
 */
export async function getCatalogoPneusAction(): Promise<{
  success: boolean;
  data: CatalogoPneuReferencia[];
  error?: string;
}> {
  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from('catalogo_pneus_referencia')
      .select('*')
      .order('marca', { ascending: true });

    if (error || !data || data.length === 0) {
      // Retorna catálogo de fábrica padrão
      return { success: true, data: CATALOGO_PNEUS_HOMOLOGADOS_PADRAO };
    }

    return { success: true, data: data as CatalogoPneuReferencia[] };
  } catch (err: any) {
    console.warn('Usando catálogo padrão offline:', err.message);
    return { success: true, data: CATALOGO_PNEUS_HOMOLOGADOS_PADRAO };
  }
}

/**
 * 2. Salvar Inspeção Completa de Rodagem dos 5 Pneus
 */
export async function salvarInspecaoRodagemAction(payload: {
  contrato_id: string;
  viatura_id: string;
  odometro_km: number;
  houve_calibracao: boolean;
  tecnico_nome: string;
  observacoes_gerais?: string | null;
  itens: ItemAfericaoPneu[];
}): Promise<{
  success: boolean;
  data?: InspecaoRodagemPneus;
  error?: string;
}> {
  try {
    const supabase = getSupabaseAdminClient();

    // Determina o status geral mais crítico da inspeção
    let statusGeral: StatusTwi = 'CONFORME';
    for (const item of payload.itens) {
      if (item.status_twi === 'CRITICO_PROIBIDO') {
        statusGeral = 'CRITICO_PROIBIDO';
        break;
      } else if (item.status_twi === 'ATENCAO') {
        statusGeral = 'ATENCAO';
      }
    }

    // 1. Inserir registro mestre da inspeção
    const { data: inspecaoData, error: inspecaoError } = await supabase
      .from('inspecoes_rodagem_pneus')
      .insert({
        contrato_id: payload.contrato_id,
        viatura_id: payload.viatura_id,
        odometro_km: payload.odometro_km,
        status_geral_twi: statusGeral,
        houve_calibracao: payload.houve_calibracao,
        tecnico_nome: payload.tecnico_nome,
        observacoes_gerais: payload.observacoes_gerais || null
      })
      .select()
      .single();

    if (inspecaoError || !inspecaoData) {
      console.error('Erro ao salvar inspeção mestre de rodagem:', inspecaoError);
      return { success: false, error: inspecaoError?.message || 'Falha ao gravar inspeção mestre.' };
    }

    const inspecaoId = inspecaoData.id;

    // 2. Inserir itens de aferição de cada pneu
    const itensInsert = payload.itens.map((item) => ({
      inspecao_id: inspecaoId,
      posicao_pneu: item.posicao_pneu,
      pneu_referencia_id: item.pneu_referencia_id || null,
      profundidade_original_mm: item.profundidade_original_mm,
      profundidade_sulco_mm: item.profundidade_sulco_mm,
      desgaste_acumulado_mm: item.desgaste_acumulado_mm,
      percentual_vida_util: item.percentual_vida_util,
      pressao_psi: item.pressao_psi,
      status_twi: item.status_twi,
      foto_medicao_url: item.foto_medicao_url || null
    }));

    const { error: itensError } = await supabase
      .from('itens_afericao_pneus')
      .insert(itensInsert);

    if (itensError) {
      console.error('Erro ao salvar itens de aferição de pneus:', itensError);
    }

    // 3. Atualizar viatura: odômetro e data de calibração se aplicável
    const updatesViatura: any = {
      odometro_atual_km: payload.odometro_km
    };
    if (payload.houve_calibracao) {
      updatesViatura.data_ultima_calibracao = new Date().toISOString();
    }

    await supabase
      .from('viaturas')
      .update(updatesViatura)
      .eq('id', payload.viatura_id);

    return {
      success: true,
      data: {
        ...inspecaoData,
        itens: payload.itens
      } as InspecaoRodagemPneus
    };
  } catch (err: any) {
    console.error('Exceção ao gravar inspeção de rodagem:', err);
    return { success: false, error: err.message || 'Erro inesperado ao salvar medições.' };
  }
}

/**
 * 3. Listar Histórico de Inspeções de Rodagem
 */
export async function listHistoricoInspecoesRodagemAction(
  contratoId?: string,
  viaturaId?: string
): Promise<{
  success: boolean;
  data?: InspecaoRodagemPneus[];
  error?: string;
}> {
  try {
    const supabase = getSupabaseAdminClient();
    let query = supabase
      .from('inspecoes_rodagem_pneus')
      .select(`
        *,
        itens:itens_afericao_pneus(*),
        viatura:viaturas(prefixo_frota, placa, marca, modelo, chassi, odometro_atual_km, foto_veiculo_url)
      `)
      .order('data_hora', { ascending: false });

    if (contratoId && contratoId !== 'TODOS' && contratoId !== 'GLOBAL') {
      query = query.eq('contrato_id', contratoId);
    }

    if (viaturaId) {
      query = query.eq('viatura_id', viaturaId);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Erro ao consultar histórico de inspeções:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: (data || []) as InspecaoRodagemPneus[] };
  } catch (err: any) {
    console.error('Exceção ao listar inspeções de pneus:', err);
    return { success: false, error: err.message };
  }
}
