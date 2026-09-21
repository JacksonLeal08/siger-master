-- ==============================================================================
-- MIGRAÇÃO CORPORATIVA: TELEMETRIA DE ABASTECIMENTO, GIS & MANUTENÇÃO EXTERNA
-- Data: 2026-09-20
-- Autor: Equipe DBA & Engenharia de Dados SPCI Master
-- Escopo: Adição de colunas de calibração, fotos oficiais, tabelas de telemetria
--         de postos georreferenciados e cadastro completo de oficinas credenciadas
-- ==============================================================================

-- 1. ATUALIZAÇÃO DA TABELA DE VIATURAS
ALTER TABLE public.viaturas 
ADD COLUMN IF NOT EXISTS foto_veiculo_url TEXT,
ADD COLUMN IF NOT EXISTS data_ultima_calibracao DATE DEFAULT CURRENT_DATE;

-- 2. TABELA DE OFICINAS & PRESTADORES CREDENCIADOS
CREATE TABLE IF NOT EXISTS public.oficinas_prestadores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contrato_id VARCHAR(64) NOT NULL DEFAULT 'ONÇA PUMA',
    razao_social VARCHAR(150) NOT NULL,
    nome_fantasia VARCHAR(150),
    cnpj VARCHAR(20) UNIQUE NOT NULL,
    especialidades TEXT[] NOT NULL DEFAULT '{}',
    contato_responsavel VARCHAR(100),
    telefone_plantao VARCHAR(25) NOT NULL,
    email VARCHAR(100),
    endereco TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'ATIVO',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices de Alta Performance para Oficinas
CREATE INDEX IF NOT EXISTS idx_oficinas_contrato ON public.oficinas_prestadores(contrato_id);
CREATE INDEX IF NOT EXISTS idx_oficinas_cnpj ON public.oficinas_prestadores(cnpj);
CREATE INDEX IF NOT EXISTS idx_oficinas_status ON public.oficinas_prestadores(contrato_id, status);

-- 3. TABELA DE ABASTECIMENTOS COM COORDENADAS E AUDITORIA FINANCEIRA
CREATE TABLE IF NOT EXISTS public.abastecimentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contrato_id VARCHAR(64) NOT NULL DEFAULT 'ONÇA PUMA',
    viatura_id UUID NOT NULL REFERENCES public.viaturas(id) ON DELETE RESTRICT,
    data_hora TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    km_registro NUMERIC(10, 2) NOT NULL,
    nome_posto VARCHAR(120) NOT NULL,
    latitude_posto NUMERIC(10, 7) NOT NULL,
    longitude_posto NUMERIC(10, 7) NOT NULL,
    tipo_combustivel VARCHAR(30) NOT NULL,
    litros NUMERIC(8, 2) NOT NULL CHECK (litros > 0),
    valor_litro NUMERIC(8, 3) NOT NULL CHECK (valor_litro > 0),
    valor_total NUMERIC(10, 2) NOT NULL,
    variacao_preco_litro NUMERIC(8, 3),
    percentual_variacao NUMERIC(6, 2),
    motorista_nome VARCHAR(100) NOT NULL,
    foto_cupom_url TEXT NOT NULL,
    houve_calibracao_pneus BOOLEAN DEFAULT FALSE,
    foto_calibracao_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices de Alta Performance para Abastecimentos e Rastreamento GIS
CREATE INDEX IF NOT EXISTS idx_abastecimentos_viatura ON public.abastecimentos(viatura_id);
CREATE INDEX IF NOT EXISTS idx_abastecimentos_contrato ON public.abastecimentos(contrato_id);
CREATE INDEX IF NOT EXISTS idx_abastecimentos_data ON public.abastecimentos(data_hora DESC);
CREATE INDEX IF NOT EXISTS idx_abastecimentos_geo ON public.abastecimentos(latitude_posto, longitude_posto);

-- 4. VIEW CONSOLIDADA DE POSTOS DE COMBUSTÍVEL PARA MAPAS GIS
CREATE OR REPLACE VIEW public.vw_postos_georreferenciados AS
SELECT 
    nome_posto,
    contrato_id,
    latitude_posto,
    longitude_posto,
    COUNT(*) as total_abastecimentos,
    ROUND(AVG(valor_litro), 3) as preco_medio_litro,
    MIN(valor_litro) as menor_preco_litro,
    MAX(valor_litro) as maior_preco_litro,
    MAX(data_hora) as ultimo_abastecimento_em
FROM public.abastecimentos
GROUP BY nome_posto, contrato_id, latitude_posto, longitude_posto;
