-- ==============================================================================
-- SPCI MASTER / SIGER MASTER - MÓDULO DE GESTÃO DE FROTAS & VIATURAS
-- MIGRATION: Módulo de Checklist Técnico Automotivo & Dual-Photo Evidence
-- Data: 2026-09-21
-- ==============================================================================

-- 1. Tabela Mestre de Vistorias / Checklists Veiculares
CREATE TABLE IF NOT EXISTS public.checklists_veiculares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contrato_id VARCHAR(64) NOT NULL,
    viatura_id UUID NOT NULL REFERENCES public.viaturas(id) ON DELETE RESTRICT,
    tecnico_nome VARCHAR(120) NOT NULL,
    tipo_checklist VARCHAR(30) NOT NULL DEFAULT 'DIARIO_PREVENTIVO',
    odometro_km NUMERIC(10, 2) NOT NULL,
    horimetro NUMERIC(10, 2),
    status_aprovacao VARCHAR(30) NOT NULL DEFAULT 'APROVADO', -- 'APROVADO', 'ATENCAO', 'INTERDITADO'
    percentual_conformidade NUMERIC(5, 2) NOT NULL DEFAULT 100.00,
    total_itens INTEGER NOT NULL,
    total_conformes INTEGER NOT NULL,
    total_nao_conformes INTEGER NOT NULL,
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    ordem_servico_gerada_id UUID REFERENCES public.ordens_servico_frota(id) ON DELETE SET NULL,
    observacoes_gerais TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabela de Itens de Avaliação do Checklist com Suporte a 2 Fotos por Anomalia
CREATE TABLE IF NOT EXISTS public.checklist_itens_avaliacao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    checklist_id UUID NOT NULL REFERENCES public.checklists_veiculares(id) ON DELETE CASCADE,
    sistema_grupo VARCHAR(60) NOT NULL, -- 'FREIOS', 'SUSPENSAO', 'MOTOR_CAMBIO', 'ELETRICA', 'ILUMINACAO', 'PNEUS', 'EQUIPAMENTOS', 'IMPLEMENTOS_ESPECIFICOS'
    item_nome VARCHAR(150) NOT NULL,
    parecer VARCHAR(20) NOT NULL, -- 'CONFORME', 'NAO_CONFORME', 'NA'
    gravidade_anomalia VARCHAR(20), -- 'LEVE', 'MEDIA', 'CRITICA'
    observacao_anomalia TEXT,
    foto_evidencia_1_url TEXT, -- Foto 1: Visão Geral / Contexto
    foto_evidencia_2_url TEXT, -- Foto 2: Detalhe / Macro da Avaria
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Índices de Performance
CREATE INDEX IF NOT EXISTS idx_checklists_viatura ON public.checklists_veiculares(viatura_id);
CREATE INDEX IF NOT EXISTS idx_checklists_contrato ON public.checklists_veiculares(contrato_id);
CREATE INDEX IF NOT EXISTS idx_checklists_created_at ON public.checklists_veiculares(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_itens_checklist ON public.checklist_itens_avaliacao(checklist_id);

-- 4. Habilitação de RLS (Políticas Permissivas para Aplicação e Terminal)
ALTER TABLE public.checklists_veiculares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_itens_avaliacao ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir leitura geral em checklists_veiculares" ON public.checklists_veiculares;
CREATE POLICY "Permitir leitura geral em checklists_veiculares"
    ON public.checklists_veiculares FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Permitir inserção e atualização em checklists_veiculares" ON public.checklists_veiculares;
CREATE POLICY "Permitir inserção e atualização em checklists_veiculares"
    ON public.checklists_veiculares FOR ALL
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir leitura geral em checklist_itens_avaliacao" ON public.checklist_itens_avaliacao;
CREATE POLICY "Permitir leitura geral em checklist_itens_avaliacao"
    ON public.checklist_itens_avaliacao FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Permitir inserção e atualização em checklist_itens_avaliacao" ON public.checklist_itens_avaliacao;
CREATE POLICY "Permitir inserção e atualização em checklist_itens_avaliacao"
    ON public.checklist_itens_avaliacao FOR ALL
    USING (true)
    WITH CHECK (true);
