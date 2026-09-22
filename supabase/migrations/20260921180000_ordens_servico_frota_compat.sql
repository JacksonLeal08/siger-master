-- ==============================================================================
-- SPCI MASTER / SIGER MASTER - MIGRATION: ORDENS DE SERVIÇO & HISTÓRICO DA FROTA
-- Arquivo: 20260921180000_ordens_servico_frota_compat.sql
-- ==============================================================================

-- 1. Garante colunas de compatibilidade na tabela ordens_servico_frota
ALTER TABLE IF EXISTS public.ordens_servico_frota
    ADD COLUMN IF NOT EXISTS tipo_manutencao VARCHAR(20) DEFAULT 'PREVENTIVA',
    ADD COLUMN IF NOT EXISTS origem_execucao VARCHAR(30) DEFAULT 'INTERNA_BRIGADA',
    ADD COLUMN IF NOT EXISTS descricao_motivo TEXT,
    ADD COLUMN IF NOT EXISTS servicos_executados TEXT,
    ADD COLUMN IF NOT EXISTS pecas_substituidas_json JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS comprovantes_urls TEXT[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS status_os VARCHAR(20) DEFAULT 'ABERTA';

-- 2. Sincroniza dados legados onde as colunas correspondentes já existiam
UPDATE public.ordens_servico_frota
SET 
    tipo_manutencao = COALESCE(tipo_manutencao, natureza_manutencao, 'PREVENTIVA'),
    origem_execucao = COALESCE(origem_execucao, CASE WHEN tipo_os = 'EXTERNA' THEN 'EXTERNA_CREDENCIADA' ELSE 'INTERNA_BRIGADA' END),
    descricao_motivo = COALESCE(descricao_motivo, descricao_servico, 'Manutenção preventiva de rotina'),
    status_os = COALESCE(status_os, status, 'ABERTA')
WHERE tipo_manutencao IS NULL OR descricao_motivo IS NULL OR status_os IS NULL;

-- 3. Índices de alta performance para consulta de histórico por viatura
CREATE INDEX IF NOT EXISTS idx_os_viatura_data ON public.ordens_servico_frota(viatura_id, data_abertura DESC);
CREATE INDEX IF NOT EXISTS idx_os_contrato_status_os ON public.ordens_servico_frota(contrato_id, status_os);

-- 4. Comentários documentais
COMMENT ON TABLE public.ordens_servico_frota IS 'Registro detalhado de Ordens de Serviço (Preventivas e Corretivas) da frota operacional SPCI/SIGER';
COMMENT ON COLUMN public.ordens_servico_frota.pecas_substituidas_json IS 'Array JSON contendo peças, quantidades e valores unitários substituídos na OS';
COMMENT ON COLUMN public.ordens_servico_frota.comprovantes_urls IS 'URLs de notas fiscais, ordens de compra e laudos de bancada em anexo';
