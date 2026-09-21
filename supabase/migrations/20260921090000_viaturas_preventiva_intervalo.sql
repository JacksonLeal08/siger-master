-- ==============================================================================
-- MIGRAÇÃO CORPORATIVA: PREVENTIVAS DA FROTA, INTERVALOS E AMARRAÇÃO DE ABASTECIMENTOS
-- Data: 2026-09-21
-- Escopo: Adicionar colunas de preventiva e intervalo em viaturas, coluna motorista_nome
--         em abastecimentos e atualizar a view consolidada vw_viaturas_cockpit.
-- ==============================================================================

-- 1. COLUNAS DE MANUTENÇÃO PREVENTIVA NA TABELA VIATURAS
ALTER TABLE public.viaturas 
ADD COLUMN IF NOT EXISTS data_ultima_preventiva DATE,
ADD COLUMN IF NOT EXISTS km_ultima_preventiva NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS odometro_ultima_preventiva_km NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS intervalo_revisao_km NUMERIC(10, 2) DEFAULT 10000;

-- Sincroniza km_ultima_preventiva e odometro_ultima_preventiva_km se um deles estiver preenchido
UPDATE public.viaturas
SET km_ultima_preventiva = odometro_ultima_preventiva_km
WHERE (km_ultima_preventiva IS NULL OR km_ultima_preventiva = 0) 
  AND (odometro_ultima_preventiva_km IS NOT NULL AND odometro_ultima_preventiva_km > 0);

UPDATE public.viaturas
SET odometro_ultima_preventiva_km = km_ultima_preventiva
WHERE (odometro_ultima_preventiva_km IS NULL OR odometro_ultima_preventiva_km = 0) 
  AND (km_ultima_preventiva IS NOT NULL AND km_ultima_preventiva > 0);

UPDATE public.viaturas
SET intervalo_revisao_km = 10000
WHERE intervalo_revisao_km IS NULL OR intervalo_revisao_km <= 0;

-- 2. COLUNA MOTORISTA_NOME NA TABELA ABASTECIMENTOS
ALTER TABLE public.abastecimentos 
ADD COLUMN IF NOT EXISTS motorista_nome VARCHAR(100);

-- Sincroniza condutor_nome com motorista_nome se estiver nulo
UPDATE public.abastecimentos
SET motorista_nome = condutor_nome
WHERE motorista_nome IS NULL AND condutor_nome IS NOT NULL;

-- 3. ATUALIZAÇÃO DA VIEW CONSOLIDADA VW_VIATURAS_COCKPIT
CREATE OR REPLACE VIEW public.vw_viaturas_cockpit AS
SELECT 
    v.id,
    v.contrato_id,
    v.prefixo_frota,
    v.placa,
    v.chassi,
    v.tipo_veiculo,
    v.marca,
    v.modelo,
    v.ano_fabricacao,
    v.tipo_combustivel,
    v.odometro_atual_km,
    v.status_operacional,
    v.vencimento_crlv,
    v.seguradora,
    v.vencimento_seguro,
    v.foto_veiculo_url,
    v.data_ultima_calibracao,
    v.data_ultima_preventiva,
    v.km_ultima_preventiva,
    v.odometro_ultima_preventiva_km,
    COALESCE(v.intervalo_revisao_km, 10000) AS intervalo_revisao_km,
    v.observacoes,
    v.created_at,
    v.updated_at,
    
    -- Status de Documentação (CRLV e Seguro)
    CASE 
        WHEN v.vencimento_crlv IS NOT NULL AND v.vencimento_crlv < CURRENT_DATE THEN 'CRLV_VENCIDO'
        WHEN v.vencimento_crlv IS NOT NULL AND v.vencimento_crlv <= (CURRENT_DATE + INTERVAL '30 days') THEN 'CRLV_A_VENCER'
        ELSE 'CRLV_REGULAR'
    END AS status_crlv,

    CASE 
        WHEN v.vencimento_seguro IS NOT NULL AND v.vencimento_seguro < CURRENT_DATE THEN 'SEGURO_VENCIDO'
        WHEN v.vencimento_seguro IS NOT NULL AND v.vencimento_seguro <= (CURRENT_DATE + INTERVAL '30 days') THEN 'SEGURO_A_VENCER'
        ELSE 'SEGURO_REGULAR'
    END AS status_seguro,
    
    -- Contagem de Pneus Críticos Ativos
    COALESCE((
        SELECT COUNT(*) 
        FROM public.inspecoes_pneus ip 
        WHERE ip.viatura_id = v.id 
          AND ip.status_twi = 'CRITICO_PROIBIDO'
          AND ip.data_hora = (
              SELECT MAX(data_hora) 
              FROM public.inspecoes_pneus ip2 
              WHERE ip2.viatura_id = v.id AND ip2.posicao_pneu = ip.posicao_pneu
          )
    ), 0) AS qtd_pneus_criticos_twi,

    -- Último Abastecimento Realizado
    (
        SELECT a.km_por_litro 
        FROM public.abastecimentos a 
        WHERE a.viatura_id = v.id 
        ORDER BY a.data_hora DESC 
        LIMIT 1
    ) AS ultimo_km_litro,

    (
        SELECT a.is_discrepante 
        FROM public.abastecimentos a 
        WHERE a.viatura_id = v.id 
        ORDER BY a.data_hora DESC 
        LIMIT 1
    ) AS ultimo_abastecimento_discrepante

FROM public.viaturas v;
