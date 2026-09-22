-- ==============================================================================
-- MIGRATION: 20260922110000_metrologia_rodagem_pneus.sql
-- SPCI MASTER - Ecossistema de Metrologia e Gestão de Rodagem Veicular
-- Normatização CONTRAN nº 558/80 (Banda de Rodagem e TWI 1.6mm)
-- ==============================================================================

-- 1. Catálogo Mestre de Pneus Homologados de Fábrica
CREATE TABLE IF NOT EXISTS public.catalogo_pneus_referencia (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    marca VARCHAR(50) NOT NULL,
    modelo VARCHAR(80) NOT NULL,
    medida VARCHAR(30) NOT NULL,
    profundidade_original_mm NUMERIC(4, 2) NOT NULL,
    pressao_recomendada_psi NUMERIC(4, 1) NOT NULL DEFAULT 32.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unq_pneu_ref UNIQUE (marca, modelo, medida)
);

-- Seed de Pneus de Referência Homologados
INSERT INTO public.catalogo_pneus_referencia (marca, modelo, medida, profundidade_original_mm, pressao_recomendada_psi)
VALUES 
    ('MICHELIN', 'LTX FORCE', '265/65 R17', 9.50, 32.0),
    ('PIRELLI', 'SCORPION ALL TERRAIN PLUS', '265/65 R17', 10.00, 32.0),
    ('BRIDGESTONE', 'DUELER A/T 693', '265/65 R17', 9.00, 30.0),
    ('CONTINENTAL', 'VANCONTACT AP', '225/75 R16C', 10.50, 55.0),
    ('GOODYEAR', 'WRANGLER DURATRAC', '265/70 R17', 12.00, 35.0)
ON CONFLICT (marca, modelo, medida) DO NOTHING;

-- 2. Tabela Mestre de Inspeções de Pneus
CREATE TABLE IF NOT EXISTS public.inspecoes_rodagem_pneus (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contrato_id VARCHAR(64) NOT NULL,
    viatura_id UUID NOT NULL REFERENCES public.viaturas(id) ON DELETE RESTRICT,
    data_hora TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    odometro_km NUMERIC(10, 2) NOT NULL,
    status_geral_twi VARCHAR(30) NOT NULL DEFAULT 'CONFORME',
    houve_calibracao BOOLEAN NOT NULL DEFAULT FALSE,
    tecnico_nome VARCHAR(120) NOT NULL,
    observacoes_gerais TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Detalhamento por Roda com Métricas Metrológicas
CREATE TABLE IF NOT EXISTS public.itens_afericao_pneus (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inspecao_id UUID NOT NULL REFERENCES public.inspecoes_rodagem_pneus(id) ON DELETE CASCADE,
    posicao_pneu VARCHAR(20) NOT NULL, -- 'DE', 'DD', 'TE', 'TD', 'ESTEPE'
    pneu_referencia_id UUID REFERENCES public.catalogo_pneus_referencia(id) ON DELETE SET NULL,
    profundidade_original_mm NUMERIC(4, 2) NOT NULL,
    profundidade_sulco_mm NUMERIC(4, 2) NOT NULL,
    desgaste_acumulado_mm NUMERIC(4, 2) NOT NULL,
    percentual_vida_util NUMERIC(5, 2) NOT NULL,
    pressao_psi NUMERIC(5, 1) NOT NULL,
    status_twi VARCHAR(30) NOT NULL,
    foto_medicao_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Índices Compostos de Alta Performance
CREATE INDEX IF NOT EXISTS idx_inspecoes_pneus_viatura ON public.inspecoes_rodagem_pneus(viatura_id);
CREATE INDEX IF NOT EXISTS idx_inspecoes_pneus_contrato ON public.inspecoes_rodagem_pneus(contrato_id);
CREATE INDEX IF NOT EXISTS idx_inspecoes_pneus_data ON public.inspecoes_rodagem_pneus(data_hora DESC);
CREATE INDEX IF NOT EXISTS idx_itens_afericao_inspecao ON public.itens_afericao_pneus(inspecao_id);
CREATE INDEX IF NOT EXISTS idx_itens_afericao_posicao ON public.itens_afericao_pneus(posicao_pneu);

-- 5. Habilitação de RLS e Políticas de Segurança Multi-Tenant
ALTER TABLE public.catalogo_pneus_referencia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspecoes_rodagem_pneus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itens_afericao_pneus ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir leitura geral no catalogo_pneus_referencia" ON public.catalogo_pneus_referencia;
CREATE POLICY "Permitir leitura geral no catalogo_pneus_referencia"
    ON public.catalogo_pneus_referencia FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Permitir mutações no catalogo_pneus_referencia para autenticados" ON public.catalogo_pneus_referencia;
CREATE POLICY "Permitir mutações no catalogo_pneus_referencia para autenticados"
    ON public.catalogo_pneus_referencia FOR ALL
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir acesso completo em inspecoes_rodagem_pneus" ON public.inspecoes_rodagem_pneus;
CREATE POLICY "Permitir acesso completo em inspecoes_rodagem_pneus"
    ON public.inspecoes_rodagem_pneus FOR ALL
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir acesso completo em itens_afericao_pneus" ON public.itens_afericao_pneus;
CREATE POLICY "Permitir acesso completo em itens_afericao_pneus"
    ON public.itens_afericao_pneus FOR ALL
    USING (true)
    WITH CHECK (true);
