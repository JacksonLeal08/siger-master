import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const getSupabaseAdmin = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase credenciais não configuradas.');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contratoId = searchParams.get('contrato_id') || searchParams.get('contratoId');
    const viaturaId = searchParams.get('viatura_id') || searchParams.get('viaturaId');

    const supabase = getSupabaseAdmin();

    let query = supabase
      .from('abastecimentos')
      .select(`
        id,
        data_hora,
        motorista_nome,
        condutor_nome,
        nome_posto,
        posto,
        tipo_combustivel,
        litros,
        valor_litro,
        valor_total,
        variacao_preco_litro,
        percentual_variacao,
        houve_calibracao_pneus,
        created_at,
        viatura:viaturas!inner (
          id,
          prefixo_frota,
          placa,
          tipo_veiculo
        )
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
      console.error('[API GET /api/abastecimentos] Erro Supabase:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Formata o retorno para a estrutura padronizada solicitada
    const formatted = (data || []).map((row: any) => {
      const v = Array.isArray(row.viatura) ? row.viatura[0] : row.viatura;
      return {
        id: row.id,
        data_hora: row.data_hora,
        prefixo_frota: v?.prefixo_frota || 'VTR',
        placa: v?.placa || '',
        tipo_veiculo: v?.tipo_veiculo || 'UTILITARIO',
        motorista_nome: row.motorista_nome || row.condutor_nome || 'Não informado',
        nome_posto: row.nome_posto || row.posto || 'Posto Convencionado',
        tipo_combustivel: row.tipo_combustivel,
        litros: row.litros,
        valor_litro: row.valor_litro,
        valor_total: row.valor_total,
        variacao_preco_litro: row.variacao_preco_litro,
        percentual_variacao: row.percentual_variacao,
        houve_calibracao_pneus: row.houve_calibracao_pneus,
        created_at: row.created_at,
        viatura: v
      };
    });

    return NextResponse.json({ success: true, data: formatted });
  } catch (err: any) {
    console.error('[API GET /api/abastecimentos] Erro inesperado:', err);
    return NextResponse.json({ success: false, error: err?.message || 'Erro interno' }, { status: 500 });
  }
}
