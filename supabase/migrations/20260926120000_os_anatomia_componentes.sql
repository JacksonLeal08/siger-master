-- ==============================================================================
-- SPCI MASTER / SIGER MASTER - MIGRATION: ANATOMIA VEICULAR & SUBCOMPONENTES OS
-- Arquivo: 20260926120000_os_anatomia_componentes.sql
-- ==============================================================================

-- 1. Evolução incremental da tabela de Ordens de Serviço
ALTER TABLE IF EXISTS public.ordens_servico_frota
    ADD COLUMN IF NOT EXISTS tipo_manutencao VARCHAR(20) NOT NULL DEFAULT 'CORRETIVA',
    ADD COLUMN IF NOT EXISTS prioridade VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
    ADD COLUMN IF NOT EXISTS etapa_atual VARCHAR(40) NOT NULL DEFAULT '1_ABERTURA_TRIAGEM',
    ADD COLUMN IF NOT EXISTS numero_etapa INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS data_abertura TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS valor_estimado NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS aprovador_imediato_id UUID,
    ADD COLUMN IF NOT EXISTS status_aprovacao VARCHAR(30) NOT NULL DEFAULT 'PENDENTE',
    ADD COLUMN IF NOT EXISTS data_aprovacao TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS origem_abertura VARCHAR(40) DEFAULT 'MANUAL',
    ADD COLUMN IF NOT EXISTS resumo_anatomico TEXT,
    ADD COLUMN IF NOT EXISTS itens_componentes_json JSONB DEFAULT '[]'::jsonb;

-- Atualização da View ordens_servico para refletir novas colunas
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_views WHERE schemaname = 'public' AND viewname = 'ordens_servico') THEN
        DROP VIEW public.ordens_servico;
    END IF;
    CREATE OR REPLACE VIEW public.ordens_servico AS 
    SELECT * FROM public.ordens_servico_frota;
END $$;

-- 2. Catálogo de Componentes e Subcomponentes do Veículo (10 Sistemas Macro)
CREATE TABLE IF NOT EXISTS public.catalogo_componentes_veiculares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_sistema VARCHAR(30) NOT NULL,
    nome_componente_macro VARCHAR(100) NOT NULL,
    nome_subcomponente VARCHAR(120) NOT NULL,
    criticidade_sugerida VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
    icone VARCHAR(40),
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_catalogo_comp_sistema 
    ON public.catalogo_componentes_veiculares(codigo_sistema, ativo);

-- 3. Subcomponentes Flegados por Ordem de Serviço (Tabela de Relação 1:N)
CREATE TABLE IF NOT EXISTS public.os_itens_componentes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    os_id UUID NOT NULL REFERENCES public.ordens_servico_frota(id) ON DELETE CASCADE,
    codigo_sistema VARCHAR(30) NOT NULL,
    nome_componente_macro VARCHAR(100) NOT NULL,
    nome_subcomponente VARCHAR(120) NOT NULL,
    acao_requerida VARCHAR(30) NOT NULL DEFAULT 'SUBSTITUICAO', -- 'SUBSTITUICAO', 'REPARO', 'REGULAGEM', 'REVISAO'
    posicao_eixo VARCHAR(30) DEFAULT 'COMPLETO', -- 'DIANTEIRO', 'TRASEIRO', 'ESQUERDO', 'DIREITO', 'COMPLETO'
    quantidade NUMERIC(8, 2) NOT NULL DEFAULT 1,
    valor_unitario_estimado NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    valor_total_item NUMERIC(12, 2) GENERATED ALWAYS AS (quantidade * valor_unitario_estimado) STORED,
    observacao_tecnica TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_os_itens_comp_os_id 
    ON public.os_itens_componentes(os_id);

-- 4. Seed Seguro e Idempotente do Catálogo de 10 Sistemas Macro e Subcomponentes
INSERT INTO public.catalogo_componentes_veiculares (codigo_sistema, nome_componente_macro, nome_subcomponente, criticidade_sugerida, icone)
VALUES
  -- 01. Motor & Alimentação
  ('01_MOTOR', 'Motor & Sistema de Alimentação', 'Bloco do Motor, Cabeçote e Junta', 'URGENTE', 'Wrench'),
  ('01_MOTOR', 'Motor & Sistema de Alimentação', 'Kit de Distribuição (Correia Dentada / Corrente e Tensores)', 'URGENTE', 'Wrench'),
  ('01_MOTOR', 'Motor & Sistema de Alimentação', 'Correia de Acessórios (Poly-V) e Polias', 'NORMAL', 'Wrench'),
  ('01_MOTOR', 'Motor & Sistema de Alimentação', 'Bicos Injetores e Bomba de Alta Pressão / Combustível', 'URGENTE', 'Wrench'),
  ('01_MOTOR', 'Motor & Sistema de Alimentação', 'Turbocompressor (Turbina), Intercooler e Mangueiras', 'URGENTE', 'Wrench'),
  ('01_MOTOR', 'Motor & Sistema de Alimentação', 'Kit de Filtros (Óleo, Combustível, Ar e Separador Água/Diesel)', 'NORMAL', 'Wrench'),
  ('01_MOTOR', 'Motor & Sistema de Alimentação', 'Troca de Óleo Lubrificante do Motor e Bujão', 'NORMAL', 'Wrench'),
  ('01_MOTOR', 'Motor & Sistema de Alimentação', 'Sistema de Escape, Válvula EGR, Filtro DPF e Catalisador', 'NORMAL', 'Wrench'),
  ('01_MOTOR', 'Motor & Sistema de Alimentação', 'Coxins de Sustentação do Motor', 'NORMAL', 'Wrench'),

  -- 02. Transmissão
  ('02_TRANSMISSAO', 'Caixa de Marchas & Transmissão (Tração 4x2 / 4x4)', 'Caixa de Câmbio (Manual / Automática)', 'URGENTE', 'Cog'),
  ('02_TRANSMISSAO', 'Caixa de Marchas & Transmissão (Tração 4x2 / 4x4)', 'Kit de Embreagem Completo (Platô, Disco e Colar/Atuador)', 'URGENTE', 'Cog'),
  ('02_TRANSMISSAO', 'Caixa de Marchas & Transmissão (Tração 4x2 / 4x4)', 'Caixa de Transferência e Acionamento 4x4 / Reduzida', 'URGENTE', 'Cog'),
  ('02_TRANSMISSAO', 'Caixa de Marchas & Transmissão (Tração 4x2 / 4x4)', 'Eixo Cardan, Cruzetas e Rolamento de Centro', 'URGENTE', 'Cog'),
  ('02_TRANSMISSAO', 'Caixa de Marchas & Transmissão (Tração 4x2 / 4x4)', 'Diferencial Dianteiro e/ou Traseiro', 'URGENTE', 'Cog'),
  ('02_TRANSMISSAO', 'Caixa de Marchas & Transmissão (Tração 4x2 / 4x4)', 'Semi-eixos, Juntas Homocinéticas, Tulipas e Coifas', 'URGENTE', 'Cog'),
  ('02_TRANSMISSAO', 'Caixa de Marchas & Transmissão (Tração 4x2 / 4x4)', 'Substituição de Fluido de Câmbio / Diferencial / Transferência', 'NORMAL', 'Cog'),

  -- 03. Suspensão
  ('03_SUSPENSAO', 'Suspensão Dianteira & Traseira', 'Amortecedores Dianteiros (Par)', 'URGENTE', 'Disc'),
  ('03_SUSPENSAO', 'Suspensão Dianteira & Traseira', 'Amortecedores Traseiros (Par)', 'URGENTE', 'Disc'),
  ('03_SUSPENSAO', 'Suspensão Dianteira & Traseira', 'Molas Helicoidais / Feixe de Molas, Grampos e Jumelos', 'NORMAL', 'Disc'),
  ('03_SUSPENSAO', 'Suspensão Dianteira & Traseira', 'Bandejas / Braços Oscilantes (Superiores / Inferiores)', 'NORMAL', 'Disc'),
  ('03_SUSPENSAO', 'Suspensão Dianteira & Traseira', 'Pivôs de Suspensão', 'URGENTE', 'Disc'),
  ('03_SUSPENSAO', 'Suspensão Dianteira & Traseira', 'Bieletas e Buchas da Barra Estabilizadora', 'NORMAL', 'Disc'),
  ('03_SUSPENSAO', 'Suspensão Dianteira & Traseira', 'Kit Batentes, Coifas e Coxins de Amortecedor', 'NORMAL', 'Disc'),
  ('03_SUSPENSAO', 'Suspensão Dianteira & Traseira', 'Cubos de Roda e Rolamentos', 'URGENTE', 'Disc'),

  -- 04. Freios (Crítico)
  ('04_FREIOS', 'Sistema de Freios & Controle de Estabilidade (ABS)', 'Pastilhas de Freio (Dianteiras / Traseiras)', 'EMERGENCIA', 'OctagonAlert'),
  ('04_FREIOS', 'Sistema de Freios & Controle de Estabilidade (ABS)', 'Discos de Freio (Ventilados / Sólidos)', 'EMERGENCIA', 'OctagonAlert'),
  ('04_FREIOS', 'Sistema de Freios & Controle de Estabilidade (ABS)', 'Tambores, Lonas (Sapatas) e Cilindros de Roda', 'EMERGENCIA', 'OctagonAlert'),
  ('04_FREIOS', 'Sistema de Freios & Controle de Estabilidade (ABS)', 'Pinças de Freio (Cavaletes / Êmbolos / Pinos-Guia)', 'EMERGENCIA', 'OctagonAlert'),
  ('04_FREIOS', 'Sistema de Freios & Controle de Estabilidade (ABS)', 'Cilindro Mestre e Reservatório', 'EMERGENCIA', 'OctagonAlert'),
  ('04_FREIOS', 'Sistema de Freios & Controle de Estabilidade (ABS)', 'Servo-Freio (Hidrovácuo) e Bomba de Vácuo', 'EMERGENCIA', 'OctagonAlert'),
  ('04_FREIOS', 'Sistema de Freios & Controle de Estabilidade (ABS)', 'Fluido de Freio (DOT 4 / DOT 5.1) e Sangria', 'EMERGENCIA', 'OctagonAlert'),
  ('04_FREIOS', 'Sistema de Freios & Controle de Estabilidade (ABS)', 'Flexíveis e Tubulações de Freio', 'EMERGENCIA', 'OctagonAlert'),
  ('04_FREIOS', 'Sistema de Freios & Controle de Estabilidade (ABS)', 'Cabos e Alavanca do Freio de Estacionamento', 'URGENTE', 'OctagonAlert'),
  ('04_FREIOS', 'Sistema de Freios & Controle de Estabilidade (ABS)', 'Sensores de Roda e Módulo Hidráulico ABS/EBD', 'EMERGENCIA', 'OctagonAlert'),

  -- 05. Direção (Crítico)
  ('05_DIRECAO', 'Sistema de Direção & Geometria', 'Caixa de Direção (Hidráulica, Elétrica ou Mecânica)', 'EMERGENCIA', 'Compass'),
  ('05_DIRECAO', 'Sistema de Direção & Geometria', 'Bomba de Direção Hidráulica, Mangueiras e Fluido', 'EMERGENCIA', 'Compass'),
  ('05_DIRECAO', 'Sistema de Direção & Geometria', 'Terminais de Direção (Ponteiras)', 'EMERGENCIA', 'Compass'),
  ('05_DIRECAO', 'Sistema de Direção & Geometria', 'Barras Axiais', 'EMERGENCIA', 'Compass'),
  ('05_DIRECAO', 'Sistema de Direção & Geometria', 'Coluna de Direção e Cruzeta', 'EMERGENCIA', 'Compass'),
  ('05_DIRECAO', 'Sistema de Direção & Geometria', 'Alinhamento 3D, Cambagem e Cáster', 'NORMAL', 'Compass'),

  -- 06. Elétrica
  ('06_ELETRICA', 'Sistema Elétrico & Eletrônico', 'Bateria Principal / Auxiliar Estacionária e Terminais', 'URGENTE', 'Zap'),
  ('06_ELETRICA', 'Sistema Elétrico & Eletrônico', 'Alternador, Polia e Regulador de Voltagem', 'URGENTE', 'Zap'),
  ('06_ELETRICA', 'Sistema Elétrico & Eletrônico', 'Motor de Partida (Arranque)', 'URGENTE', 'Zap'),
  ('06_ELETRICA', 'Sistema Elétrico & Eletrônico', 'Módulo de Injeção (ECU/ECM) e Diagnóstico via Scanner', 'URGENTE', 'Zap'),
  ('06_ELETRICA', 'Sistema Elétrico & Eletrônico', 'Caixa de Fusíveis, Relés e Chicote Elétrico', 'NORMAL', 'Zap'),
  ('06_ELETRICA', 'Sistema Elétrico & Eletrônico', 'Iluminação Operacional (Faróis, Milhas, Lanternas, Freio, Ré e Pisca)', 'URGENTE', 'Zap'),
  ('06_ELETRICA', 'Sistema Elétrico & Eletrônico', 'Painel de Instrumentos (Cluster) e Odômetro', 'NORMAL', 'Zap'),
  ('06_ELETRICA', 'Sistema Elétrico & Eletrônico', 'Módulo de Telemetria CAN e Rastreador GPS', 'NORMAL', 'Zap'),

  -- 07. Arrefecimento & Climatização
  ('07_ARREFECIMENTO', 'Arrefecimento & Climatização (Ar-Condicionado)', 'Radiador Principal e Tampa de Pressão', 'URGENTE', 'Thermometer'),
  ('07_ARREFECIMENTO', 'Arrefecimento & Climatização (Ar-Condicionado)', 'Bomba d''Água', 'URGENTE', 'Thermometer'),
  ('07_ARREFECIMENTO', 'Arrefecimento & Climatização (Ar-Condicionado)', 'Válvula Termostática e Carcaça', 'URGENTE', 'Thermometer'),
  ('07_ARREFECIMENTO', 'Arrefecimento & Climatização (Ar-Condicionado)', 'Eletroventilador (Ventoinha) / Polia Viscosa', 'URGENTE', 'Thermometer'),
  ('07_ARREFECIMENTO', 'Arrefecimento & Climatização (Ar-Condicionado)', 'Mangueiras, Reservatório de Expansão e Aditivo', 'NORMAL', 'Thermometer'),
  ('07_ARREFECIMENTO', 'Arrefecimento & Climatização (Ar-Condicionado)', 'Compressor do Ar-Condicionado, Condensador e Carga de Gás', 'URGENTE', 'Thermometer'),
  ('07_ARREFECIMENTO', 'Arrefecimento & Climatização (Ar-Condicionado)', 'Filtro de Cabine e Higienização', 'NORMAL', 'Thermometer'),

  -- 08. Carroceria
  ('08_CARROCERIA', 'Chassis, Estrutura & Carroceria', 'Longarinas, Travessas do Chassi e Solda Estrutural', 'URGENTE', 'Shield'),
  ('08_CARROCERIA', 'Chassis, Estrutura & Carroceria', 'Para-choques (Dianteiro, Traseiro e Quebra-Mato)', 'NORMAL', 'Shield'),
  ('08_CARROCERIA', 'Chassis, Estrutura & Carroceria', 'Para-brisa, Vidros, Máquinas de Vidro e Palhetas', 'NORMAL', 'Shield'),
  ('08_CARROCERIA', 'Chassis, Estrutura & Carroceria', 'Portas, Fechaduras, Maçanetas e Borrachas de Vedação', 'NORMAL', 'Shield'),
  ('08_CARROCERIA', 'Chassis, Estrutura & Carroceria', 'Retrovisores Externos e Internos', 'NORMAL', 'Shield'),
  ('08_CARROCERIA', 'Chassis, Estrutura & Carroceria', 'Funilaria, Pintura, Plotagem Padrão e Faixas Refletivas', 'NORMAL', 'Shield'),
  ('08_CARROCERIA', 'Chassis, Estrutura & Carroceria', 'Bancos, Estofamento e Cintos de Segurança', 'URGENTE', 'Shield'),

  -- 09. Pneus & Rodagem
  ('09_PNEUS', 'Rodagem, Pneus & Aros (Integrado à Metrologia TWI)', 'Substituição de Pneus (Limite TWI <= 1,60 mm ou Avaria/Corte)', 'EMERGENCIA', 'CircleDot'),
  ('09_PNEUS', 'Rodagem, Pneus & Aros (Integrado à Metrologia TWI)', 'Balanceamento de Rodas e Rodízio Técnico', 'NORMAL', 'CircleDot'),
  ('09_PNEUS', 'Rodagem, Pneus & Aros (Integrado à Metrologia TWI)', 'Reforma/Desempeno de Aros, Prisioneiros e Porcas', 'NORMAL', 'CircleDot'),
  ('09_PNEUS', 'Rodagem, Pneus & Aros (Integrado à Metrologia TWI)', 'Válvulas de Calibragem, Sensores TPMS e Fixação do Estepe', 'NORMAL', 'CircleDot'),

  -- 10. Acessórios Táticos & Implementos Operacionais
  ('10_IMPLEMENTOS', 'Acessórios Táticos, Resgate & Implementos APH/Incêndio', 'Giroflex (Barra LED), Sirene Eletrônica e Megafone', 'EMERGENCIA', 'Siren'),
  ('10_IMPLEMENTOS', 'Acessórios Táticos, Resgate & Implementos APH/Incêndio', 'Guincho Elétrico (Winch), Cabo e Rolete', 'URGENTE', 'Siren'),
  ('10_IMPLEMENTOS', 'Acessórios Táticos, Resgate & Implementos APH/Incêndio', 'Snorkel, Estribos Laterais e Gaiola Interna (ROPS)', 'NORMAL', 'Siren'),
  ('10_IMPLEMENTOS', 'Acessórios Táticos, Resgate & Implementos APH/Incêndio', 'Rádio Comunicador Móvel (VHF/UHF/Tetra) e Antena', 'URGENTE', 'Siren'),
  ('10_IMPLEMENTOS', 'Acessórios Táticos, Resgate & Implementos APH/Incêndio', 'Inversor de Tensão (12V/220V) e Iluminação de Cena', 'NORMAL', 'Siren'),
  ('10_IMPLEMENTOS', 'Acessórios Táticos, Resgate & Implementos APH/Incêndio', 'Maca Retrátil, Fixadores e Rede de Oxigênio (Ambulância APH)', 'EMERGENCIA', 'Siren'),
  ('10_IMPLEMENTOS', 'Acessórios Táticos, Resgate & Implementos APH/Incêndio', 'Bomba de Combate a Incêndio, Tomada de Força (PTO) e Mangotinho', 'EMERGENCIA', 'Siren')
ON CONFLICT DO NOTHING;
