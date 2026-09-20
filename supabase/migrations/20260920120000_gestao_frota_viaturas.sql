-- ==============================================================================
-- MIGRAÇÃO CORPORATIVA: GESTÃO DE VIATURAS & FROTA OPERACIONAL (SPCI MASTER)
-- Data: 2026-09-20
-- Autor: Equipe de Engenharia de Software SPCI Master
-- Escopo: Modelagem Relacional, Isolamento Multi-Tenant por Contrato,
--         Auditoria de Telemetria, Oficinas Credenciadas e Gestão Normativa TWI
-- ==============================================================================

-- 0. FUNÇÃO AUXILIAR PARA ATUALIZAÇÃO DE TIMESTAMPS
CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- 1. TABELA DE VIATURAS (FROTA OPERACIONAL & EMERGÊNCIA)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.viaturas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contrato_id VARCHAR(100) NOT NULL DEFAULT 'ONÇA PUMA',
    prefixo_frota VARCHAR(50) NOT NULL,
    placa VARCHAR(10) NOT NULL,
    chassi VARCHAR(50),
    renavam VARCHAR(50),
    tipo_veiculo VARCHAR(50) NOT NULL CHECK (tipo_veiculo IN ('CAMINHONETE', 'AMBULANCIA', 'CAMINHAO_INCENDIO', 'UTILITARIO', 'OUTRO')),
    marca VARCHAR(100) NOT NULL,
    modelo VARCHAR(100) NOT NULL,
    ano_fabricacao INT,
    tipo_combustivel VARCHAR(30) NOT NULL DEFAULT 'DIESEL_S10' CHECK (tipo_combustivel IN ('DIESEL_S10', 'GASOLINA', 'ETANOL', 'FLEX', 'ELETRICO', 'HIBRIDO')),
    odometro_atual_km NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    status_operacional VARCHAR(30) NOT NULL DEFAULT 'DISPONIVEL' CHECK (status_operacional IN ('DISPONIVEL', 'EM_DESLOCAMENTO', 'EM_MANUTENCAO_INTERNA', 'EM_OFICINA_EXTERNA', 'BAIXADO')),
    
    -- Documentação Legal & Seguros
    vencimento_crlv DATE,
    seguradora VARCHAR(100),
    apolice_seguro VARCHAR(100),
    vencimento_seguro DATE,
    validade_garantia_data DATE,
    limite_garantia_km NUMERIC(10, 2),
    
    -- Mídia & Observações
    foto_veiculo_url TEXT,
    foto_documento_url TEXT,
    observacoes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

    -- Restrições de unicidade por Contrato/Site
    CONSTRAINT uq_viaturas_contrato_placa UNIQUE (contrato_id, placa),
    CONSTRAINT uq_viaturas_contrato_prefixo UNIQUE (contrato_id, prefixo_frota)
);

-- Índices de Alta Performance para Viaturas
CREATE INDEX IF NOT EXISTS idx_viaturas_contrato_status ON public.viaturas(contrato_id, status_operacional);
CREATE INDEX IF NOT EXISTS idx_viaturas_contrato_tipo ON public.viaturas(contrato_id, tipo_veiculo);
CREATE INDEX IF NOT EXISTS idx_viaturas_placa ON public.viaturas(placa);
CREATE INDEX IF NOT EXISTS idx_viaturas_prefixo ON public.viaturas(prefixo_frota);

-- Trigger de updated_at para viaturas
DROP TRIGGER IF EXISTS trg_viaturas_updated_at ON public.viaturas;
CREATE TRIGGER trg_viaturas_updated_at
BEFORE UPDATE ON public.viaturas
FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- ==============================================================================
-- 2. TABELA DE OFICINAS & PRESTADORES CREDENCIADOS
-- ==============================================================================
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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

    CONSTRAINT uq_oficinas_contrato_cnpj UNIQUE (contrato_id, cnpj)
);

CREATE INDEX IF NOT EXISTS idx_oficinas_contrato_ativo ON public.oficinas_prestadores(contrato_id, ativo);

DROP TRIGGER IF EXISTS trg_oficinas_updated_at ON public.oficinas_prestadores;
CREATE TRIGGER trg_oficinas_updated_at
BEFORE UPDATE ON public.oficinas_prestadores
FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- ==============================================================================
-- 3. TABELA DE ORDENS DE SERVIÇO (MANUTENÇÃO DA FROTA)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.ordens_servico_frota (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contrato_id VARCHAR(100) NOT NULL DEFAULT 'ONÇA PUMA',
    numero_os VARCHAR(50) NOT NULL,
    viatura_id UUID NOT NULL REFERENCES public.viaturas(id) ON DELETE RESTRICT,
    oficina_id UUID REFERENCES public.oficinas_prestadores(id) ON DELETE RESTRICT,
    tipo_os VARCHAR(20) NOT NULL DEFAULT 'INTERNA' CHECK (tipo_os IN ('INTERNA', 'EXTERNA')),
    natureza_manutencao VARCHAR(20) NOT NULL DEFAULT 'PREVENTIVA' CHECK (natureza_manutencao IN ('PREVENTIVA', 'CORRETIVA', 'EMERGENCIAL')),
    odometro_km NUMERIC(10, 2) NOT NULL,
    descricao_servico TEXT NOT NULL,
    custo_pecas NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    custo_mao_de_obra NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    custo_total NUMERIC(12, 2) GENERATED ALWAYS AS (custo_pecas + custo_mao_de_obra) STORED,
    status VARCHAR(30) NOT NULL DEFAULT 'ABERTA' CHECK (status IN ('ABERTA', 'EM_ANDAMENTO', 'AGUARDANDO_PECAS', 'CONCLUIDA', 'CANCELADA')),
    itens_checklist JSONB NOT NULL DEFAULT '[]'::jsonb,
    romaneio_pdf_url TEXT,
    responsavel_abertura VARCHAR(100),
    data_abertura TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    data_conclusao TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

    CONSTRAINT uq_os_contrato_numero UNIQUE (contrato_id, numero_os)
);

CREATE INDEX IF NOT EXISTS idx_os_contrato_status ON public.ordens_servico_frota(contrato_id, status);
CREATE INDEX IF NOT EXISTS idx_os_viatura ON public.ordens_servico_frota(viatura_id);
CREATE INDEX IF NOT EXISTS idx_os_oficina ON public.ordens_servico_frota(oficina_id);

DROP TRIGGER IF EXISTS trg_os_updated_at ON public.ordens_servico_frota;
CREATE TRIGGER trg_os_updated_at
BEFORE UPDATE ON public.ordens_servico_frota
FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- ==============================================================================
-- 4. TABELA DE ABASTECIMENTOS & TELEMETRIA DE CONSUMO
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.abastecimentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contrato_id VARCHAR(100) NOT NULL DEFAULT 'ONÇA PUMA',
    viatura_id UUID NOT NULL REFERENCES public.viaturas(id) ON DELETE RESTRICT,
    data_hora TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    posto VARCHAR(100) NOT NULL,
    tipo_combustivel VARCHAR(30) NOT NULL,
    litros NUMERIC(8, 2) NOT NULL CHECK (litros > 0),
    valor_litro NUMERIC(8, 3) NOT NULL CHECK (valor_litro > 0),
    valor_total NUMERIC(10, 2) NOT NULL,
    odometro_km NUMERIC(10, 2) NOT NULL,
    condutor_nome VARCHAR(100) NOT NULL,
    
    -- Cálculos de Telemetria e Auditoria Antifraude
    km_rodados NUMERIC(10, 2),
    km_por_litro NUMERIC(6, 2),
    is_discrepante BOOLEAN NOT NULL DEFAULT false,
    motivo_discrepancia TEXT,
    comprovante_foto_url TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_abastecimentos_viatura_data ON public.abastecimentos(viatura_id, data_hora DESC);
CREATE INDEX IF NOT EXISTS idx_abastecimentos_contrato_discrepante ON public.abastecimentos(contrato_id, is_discrepante);

-- ==============================================================================
-- 5. TABELA DE INSPEÇÕES DE PNEUS (PADRÃO TWI CONTRAN 558/80)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.inspecoes_pneus (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contrato_id VARCHAR(100) NOT NULL DEFAULT 'ONÇA PUMA',
    viatura_id UUID NOT NULL REFERENCES public.viaturas(id) ON DELETE RESTRICT,
    data_hora TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    posicao_pneu VARCHAR(30) NOT NULL CHECK (posicao_pneu IN (
        'DIANTEIRO_ESQUERDO', 
        'DIANTEIRO_DIREITO', 
        'TRASEIRO_ESQUERDO', 
        'TRASEIRO_DIREITO', 
        'ESTEPE', 
        'TRASEIRO_DUPLO_ESQ_EXT', 
        'TRASEIRO_DUPLO_ESQ_INT', 
        'TRASEIRO_DUPLO_DIR_EXT', 
        'TRASEIRO_DUPLO_DIR_INT'
    )),
    sulco_mm NUMERIC(4, 2) NOT NULL CHECK (sulco_mm >= 0),
    pressao_psi NUMERIC(5, 1) NOT NULL CHECK (pressao_psi >= 0),
    status_twi VARCHAR(30) NOT NULL CHECK (status_twi IN ('CONFORME', 'ATENCAO', 'CRITICO_PROIBIDO')),
    precisa_rodizio BOOLEAN NOT NULL DEFAULT false,
    marca_pneu VARCHAR(50),
    dot_pneu VARCHAR(30),
    observacoes TEXT,
    inspetor_nome VARCHAR(100) NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_inspecoes_pneus_viatura_data ON public.inspecoes_pneus(viatura_id, data_hora DESC);
CREATE INDEX IF NOT EXISTS idx_inspecoes_pneus_contrato_twi ON public.inspecoes_pneus(contrato_id, status_twi);

-- ==============================================================================
-- 6. VIEW CONSOLIDADA DE AUDITORIA DE FROTA EM TEMPO REAL
-- ==============================================================================
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
