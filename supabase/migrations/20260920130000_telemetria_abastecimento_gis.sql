-- ==============================================================================
-- MIGRAÇÃO CORPORATIVA: TELEMETRIA DE ABASTECIMENTO, GIS & MANUTENÇÃO EXTERNA
-- Data: 2026-09-20
-- Autor: Equipe DBA & Engenharia de Dados SPCI Master
-- Escopo: Atualização segura e idempotente das tabelas viaturas, oficinas_prestadores
--         e abastecimentos com colunas de telemetria GIS, calibração e view de postos.
-- ==============================================================================

-- 1. ATUALIZAÇÃO DA TABELA DE VIATURAS
ALTER TABLE public.viaturas 
ADD COLUMN IF NOT EXISTS foto_veiculo_url TEXT,
ADD COLUMN IF NOT EXISTS data_ultima_calibracao DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS data_ultima_preventiva DATE,
ADD COLUMN IF NOT EXISTS odometro_ultima_preventiva_km NUMERIC(10, 2);

-- 2. ATUALIZAÇÃO / CRIAÇÃO DA TABELA DE OFICINAS PRESTADORES
CREATE TABLE IF NOT EXISTS public.oficinas_prestadores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contrato_id VARCHAR(100) NOT NULL DEFAULT 'ONÇA PUMA',
    razao_social VARCHAR(200) NOT NULL,
    nome_fantasia VARCHAR(200),
    cnpj VARCHAR(20),
    especialidades TEXT[] DEFAULT '{}',
    responsavel VARCHAR(100),
    telefone VARCHAR(50),
    contato_emergencia VARCHAR(100),
    email VARCHAR(150),
    endereco TEXT,
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Adiciona colunas complementares caso a tabela já existisse
ALTER TABLE public.oficinas_prestadores 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'ATIVO',
ADD COLUMN IF NOT EXISTS telefone_plantao VARCHAR(25),
ADD COLUMN IF NOT EXISTS contato_responsavel VARCHAR(100);

-- Índices de Alta Performance para Oficinas
CREATE INDEX IF NOT EXISTS idx_oficinas_contrato ON public.oficinas_prestadores(contrato_id);
CREATE INDEX IF NOT EXISTS idx_oficinas_cnpj ON public.oficinas_prestadores(cnpj);
CREATE INDEX IF NOT EXISTS idx_oficinas_contrato_ativo ON public.oficinas_prestadores(contrato_id, ativo);

-- 3. ATUALIZAÇÃO / CRIAÇÃO DA TABELA DE ABASTECIMENTOS
CREATE TABLE IF NOT EXISTS public.abastecimentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contrato_id VARCHAR(100) NOT NULL DEFAULT 'ONÇA PUMA',
    viatura_id UUID NOT NULL REFERENCES public.viaturas(id) ON DELETE RESTRICT,
    data_hora TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    posto VARCHAR(120) NOT NULL,
    tipo_combustivel VARCHAR(30) NOT NULL,
    litros NUMERIC(8, 2) NOT NULL CHECK (litros > 0),
    valor_litro NUMERIC(8, 3) NOT NULL CHECK (valor_litro > 0),
    valor_total NUMERIC(10, 2) NOT NULL,
    odometro_km NUMERIC(10, 2) NOT NULL,
    condutor_nome VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Adiciona novas colunas de telemetria, georreferenciamento e calibração
ALTER TABLE public.abastecimentos 
ADD COLUMN IF NOT EXISTS nome_posto VARCHAR(120),
ADD COLUMN IF NOT EXISTS latitude_posto NUMERIC(10, 7),
ADD COLUMN IF NOT EXISTS longitude_posto NUMERIC(10, 7),
ADD COLUMN IF NOT EXISTS variacao_preco_litro NUMERIC(8, 3),
ADD COLUMN IF NOT EXISTS percentual_variacao NUMERIC(6, 2),
ADD COLUMN IF NOT EXISTS motorista_nome VARCHAR(100),
ADD COLUMN IF NOT EXISTS foto_cupom_url TEXT,
ADD COLUMN IF NOT EXISTS comprovante_foto_url TEXT,
ADD COLUMN IF NOT EXISTS houve_calibracao_pneus BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS foto_calibracao_url TEXT,
ADD COLUMN IF NOT EXISTS km_rodados NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS km_por_litro NUMERIC(6, 2),
ADD COLUMN IF NOT EXISTS is_discrepante BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS motivo_discrepancia TEXT;

-- Retroalimenta nome_posto se estiver nulo usando a coluna posto
UPDATE public.abastecimentos 
SET nome_posto = posto 
WHERE nome_posto IS NULL AND posto IS NOT NULL;

-- Índices de Alta Performance para Abastecimentos e Rastreamento GIS
CREATE INDEX IF NOT EXISTS idx_abastecimentos_viatura ON public.abastecimentos(viatura_id);
CREATE INDEX IF NOT EXISTS idx_abastecimentos_contrato ON public.abastecimentos(contrato_id);
CREATE INDEX IF NOT EXISTS idx_abastecimentos_data ON public.abastecimentos(data_hora DESC);
CREATE INDEX IF NOT EXISTS idx_abastecimentos_geo ON public.abastecimentos(latitude_posto, longitude_posto);

-- 4. VIEW CONSOLIDADA DE POSTOS DE COMBUSTÍVEL PARA MAPAS GIS
CREATE OR REPLACE VIEW public.vw_postos_georreferenciados AS
SELECT 
    COALESCE(nome_posto, posto, 'Posto Sem Identificação') as nome_posto,
    contrato_id,
    latitude_posto,
    longitude_posto,
    COUNT(*) as total_abastecimentos,
    ROUND(AVG(valor_litro), 3) as preco_medio_litro,
    MIN(valor_litro) as menor_preco_litro,
    MAX(valor_litro) as maior_preco_litro,
    MAX(data_hora) as ultimo_abastecimento_em
FROM public.abastecimentos
WHERE latitude_posto IS NOT NULL AND longitude_posto IS NOT NULL
GROUP BY COALESCE(nome_posto, posto, 'Posto Sem Identificação'), contrato_id, latitude_posto, longitude_posto;
