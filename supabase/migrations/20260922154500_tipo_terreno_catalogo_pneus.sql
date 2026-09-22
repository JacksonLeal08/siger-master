-- ==============================================================================
-- MIGRATION: 20260922154500_tipo_terreno_catalogo_pneus.sql
-- SPCI MASTER - Taxonomia de Severidade de Terreno de Pneus (H/T, A/T, R/T, M/T)
-- Catálogo Mestre de Pneus Homologados para Viaturas e Caminhonetes Operacionais
-- ==============================================================================

-- 1. Adicionar coluna de classificação de terreno ao catálogo mestre
ALTER TABLE IF EXISTS public.catalogo_pneus_referencia
ADD COLUMN IF NOT EXISTS tipo_terreno VARCHAR(10) NOT NULL DEFAULT 'AT';

-- 2. Atualizar registros homologados existentes
UPDATE public.catalogo_pneus_referencia 
SET tipo_terreno = 'AT' 
WHERE modelo ILIKE '%SCORPION%' OR modelo ILIKE '%DUELER%' OR modelo ILIKE '%LTX%';

UPDATE public.catalogo_pneus_referencia 
SET tipo_terreno = 'HT' 
WHERE modelo ILIKE '%VANCONTACT%' OR modelo ILIKE '%HIGHWAY%';

UPDATE public.catalogo_pneus_referencia 
SET tipo_terreno = 'RT' 
WHERE modelo ILIKE '%DURATRAC%' OR modelo ILIKE '%RUGGED%';

UPDATE public.catalogo_pneus_referencia 
SET tipo_terreno = 'MT' 
WHERE modelo ILIKE '%MUD%' OR modelo ILIKE '%KM3%';

-- 3. Inserir modelo M/T de referência caso ainda não exista no catálogo
INSERT INTO public.catalogo_pneus_referencia (marca, modelo, medida, profundidade_original_mm, pressao_recomendada_psi, tipo_terreno)
VALUES ('BFGOODRICH', 'MUD-TERRAIN T/A KM3', '265/70 R17', 13.50, 35.0, 'MT')
ON CONFLICT (marca, modelo, medida) DO UPDATE SET tipo_terreno = 'MT';
