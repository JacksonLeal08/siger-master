-- ==============================================================================
-- SPCI MASTER / SIGER MASTER - MIGRATION: GESTÃO DE O.S., ANEXOS & RATEIO DE CUSTOS
-- Arquivo: 20260921190000_ordens_servico_gestao_custos.sql
-- ==============================================================================

-- 1. Adiciona colunas para gestão de orçamentos, notas fiscais e rateio de custos
ALTER TABLE IF EXISTS public.ordens_servico_frota
    ADD COLUMN IF NOT EXISTS orcamentos_json JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS notas_fiscais_json JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS custo_pneus NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS custo_total NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS data_aprovacao TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS responsavel_aprovacao VARCHAR(100);

-- 2. Atualiza custo_total para registros existentes caso esteja zerado ou nulo
UPDATE public.ordens_servico_frota
SET custo_total = COALESCE(custo_pecas, 0) + COALESCE(custo_mao_de_obra, 0) + COALESCE(custo_pneus, 0)
WHERE custo_total IS NULL OR custo_total = 0;

-- 3. Índices para consultas por status da O.S. e data de conclusão
CREATE INDEX IF NOT EXISTS idx_os_status_geral ON public.ordens_servico_frota(status_os, data_abertura DESC);
CREATE INDEX IF NOT EXISTS idx_os_data_conclusao ON public.ordens_servico_frota(data_conclusao);

-- 4. Documentação de colunas
COMMENT ON COLUMN public.ordens_servico_frota.orcamentos_json IS 'Array JSON contendo propostas e orçamentos anexados (PDFs e imagens)';
COMMENT ON COLUMN public.ordens_servico_frota.notas_fiscais_json IS 'Array JSON contendo notas fiscais de peças, serviços e pneus anexadas';
COMMENT ON COLUMN public.ordens_servico_frota.custo_pneus IS 'Custo específico com troca ou reparo de pneus/desgaste (R$)';
COMMENT ON COLUMN public.ordens_servico_frota.custo_total IS 'Custo consolidado da O.S.: peças + mão de obra + pneus (R$)';
