-- ==============================================================================
-- SPCI MASTER / SIGER MASTER - MIGRATION: MATRIZ DE APROVADORES & WORKFLOW DE OS
-- Arquivo: 20260926110000_matriz_aprovadores_e_workflow_os.sql
-- ==============================================================================

-- 1. Tabela de Configuração de Aprovadores e Alçadas de OS
CREATE TABLE IF NOT EXISTS public.config_aprovadores_os (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contrato_id VARCHAR(64) NOT NULL DEFAULT 'GLOBAL',
    usuario_id UUID,
    nome_aprovador VARCHAR(120) NOT NULL,
    cargo VARCHAR(80) NOT NULL,
    email VARCHAR(150) NOT NULL,
    whatsapp VARCHAR(30) NOT NULL,
    nivel_alcada INTEGER NOT NULL DEFAULT 1, -- 1: Operacional (Nível 1), 2: Gerencial (Nível 2), 3: Diretoria (Nível 3)
    valor_minimo NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    valor_maximo NUMERIC(12, 2) NOT NULL DEFAULT 5000.00,
    is_aprovador_imediato BOOLEAN NOT NULL DEFAULT FALSE,
    receber_emergencia_24h BOOLEAN NOT NULL DEFAULT TRUE,
    notificar_in_app BOOLEAN NOT NULL DEFAULT TRUE,
    notificar_email BOOLEAN NOT NULL DEFAULT TRUE,
    notificar_whatsapp BOOLEAN NOT NULL DEFAULT TRUE,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para pesquisa rápida de aprovadores por contrato e alçada de valor
CREATE INDEX IF NOT EXISTS idx_aprovadores_contrato_alcada 
    ON public.config_aprovadores_os(contrato_id, ativo, valor_minimo, valor_maximo);
CREATE INDEX IF NOT EXISTS idx_aprovadores_imediato 
    ON public.config_aprovadores_os(contrato_id, is_aprovador_imediato, ativo);

-- 2. Evolução da Tabela ordens_servico_frota com os novos campos de governança e etapas
ALTER TABLE IF EXISTS public.ordens_servico_frota
    ADD COLUMN IF NOT EXISTS prioridade VARCHAR(20) NOT NULL DEFAULT 'NORMAL', -- 'NORMAL', 'URGENTE', 'EMERGENCIA'
    ADD COLUMN IF NOT EXISTS etapa_atual VARCHAR(40) NOT NULL DEFAULT '1_ABERTURA_TRIAGEM',
    ADD COLUMN IF NOT EXISTS numero_etapa INTEGER NOT NULL DEFAULT 1, -- 1 a 6
    ADD COLUMN IF NOT EXISTS data_abertura TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS valor_estimado NUMERIC(12, 2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS aprovador_imediato_id UUID REFERENCES public.config_aprovadores_os(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS status_aprovacao VARCHAR(30) NOT NULL DEFAULT 'PENDENTE', -- 'PENDENTE', 'APROVADA', 'REJEITADA', 'EM_REVISAO'
    ADD COLUMN IF NOT EXISTS data_aprovacao TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS responsavel_aprovacao VARCHAR(100),
    ADD COLUMN IF NOT EXISTS origem_abertura VARCHAR(40) DEFAULT 'MANUAL'; -- 'MANUAL', 'CHECKLIST_8_SISTEMAS', 'LAUDO_TWI_PNEUS'

CREATE INDEX IF NOT EXISTS idx_os_prioridade_etapa 
    ON public.ordens_servico_frota(contrato_id, prioridade, etapa_atual);

-- Criação de View ou Tabela ordens_servico para compatibilidade total
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'ordens_servico') THEN
        CREATE OR REPLACE VIEW public.ordens_servico AS 
        SELECT * FROM public.ordens_servico_frota;
    END IF;
END $$;

-- 3. Histórico Imutável de Mudança de Etapas e Status da OS (Audit Trail)
CREATE TABLE IF NOT EXISTS public.os_historico_etapas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    os_id UUID NOT NULL,
    etapa_anterior VARCHAR(40),
    etapa_nova VARCHAR(40) NOT NULL,
    status_anterior VARCHAR(40),
    status_novo VARCHAR(40) NOT NULL,
    tipo_transicao VARCHAR(20) NOT NULL DEFAULT 'AUTOMATICA', -- 'AUTOMATICA', 'SEMI_AUTOMATICA', 'MANUAL'
    responsavel_nome VARCHAR(120) NOT NULL,
    observacao TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_os_historico_os_id 
    ON public.os_historico_etapas(os_id, created_at DESC);

-- 4. Central de Notificações e Log de Disparos (In-App, E-mail, WhatsApp)
CREATE TABLE IF NOT EXISTS public.os_notificacoes_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contrato_id VARCHAR(64) NOT NULL DEFAULT 'GLOBAL',
    os_id UUID NOT NULL,
    aprovador_id UUID REFERENCES public.config_aprovadores_os(id) ON DELETE SET NULL,
    viatura_prefixo VARCHAR(40) NOT NULL,
    viatura_placa VARCHAR(15) NOT NULL,
    prioridade_os VARCHAR(20) NOT NULL,
    status_os VARCHAR(40) NOT NULL,
    etapa_os VARCHAR(40) NOT NULL,
    canal VARCHAR(20) NOT NULL, -- 'IN_APP', 'EMAIL', 'WHATSAPP'
    titulo VARCHAR(200) NOT NULL,
    mensagem TEXT NOT NULL,
    lida BOOLEAN NOT NULL DEFAULT FALSE,
    data_leitura TIMESTAMP WITH TIME ZONE,
    status_envio VARCHAR(20) NOT NULL DEFAULT 'ENVIADO', -- 'FILA', 'ENVIADO', 'FALHA'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notificacoes_in_app_nao_lidas 
    ON public.os_notificacoes_log(aprovador_id, lida, canal);
CREATE INDEX IF NOT EXISTS idx_notificacoes_os_id 
    ON public.os_notificacoes_log(os_id, created_at DESC);

-- 5. Seed de Aprovadores Iniciais por Alçada
INSERT INTO public.config_aprovadores_os (
    contrato_id, nome_aprovador, cargo, email, whatsapp, nivel_alcada, valor_minimo, valor_maximo, is_aprovador_imediato, receber_emergencia_24h, notificar_in_app, notificar_email, notificar_whatsapp, ativo
)
SELECT 'GLOBAL', 'Eng. Carlos Mendes', 'Coord. de Frota e Emergência', 'carlos.mendes@siger.com.br', '+55 (94) 99123-4567', 1, 0.00, 5000.00, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM public.config_aprovadores_os WHERE email = 'carlos.mendes@siger.com.br');

INSERT INTO public.config_aprovadores_os (
    contrato_id, nome_aprovador, cargo, email, whatsapp, nivel_alcada, valor_minimo, valor_maximo, is_aprovador_imediato, receber_emergencia_24h, notificar_in_app, notificar_email, notificar_whatsapp, ativo
)
SELECT 'GLOBAL', 'Marcos Albuquerque', 'Gerente de Operações e Manutenção', 'marcos.albuquerque@siger.com.br', '+55 (94) 98111-2233', 2, 5000.01, 20000.00, FALSE, TRUE, TRUE, TRUE, TRUE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM public.config_aprovadores_os WHERE email = 'marcos.albuquerque@siger.com.br');

INSERT INTO public.config_aprovadores_os (
    contrato_id, nome_aprovador, cargo, email, whatsapp, nivel_alcada, valor_minimo, valor_maximo, is_aprovador_imediato, receber_emergencia_24h, notificar_in_app, notificar_email, notificar_whatsapp, ativo
)
SELECT 'GLOBAL', 'Jackson Leal', 'Diretoria de Operações & SPCI', 'jackson602@gmail.com', '+55 (94) 99200-8899', 3, 20000.01, 999999.00, FALSE, TRUE, TRUE, TRUE, TRUE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM public.config_aprovadores_os WHERE email = 'jackson602@gmail.com');
