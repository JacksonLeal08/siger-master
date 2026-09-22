-- ==============================================================================
-- MIGRATION: 20260922175000_catalogo_pneus_chengshan_maspire_mt.sql
-- SPCI MASTER - Homologação do Fabricante CHENGSHAN (Modelo MASPIRE M/T)
-- Catálogo Mestre de Pneus de Referência Homologados (Fábrica)
-- Fonte Oficial: https://chengshan.com.br/produto/maspire-m-t
-- ==============================================================================

INSERT INTO public.catalogo_pneus_referencia (
    marca, 
    modelo, 
    medida, 
    profundidade_original_mm, 
    pressao_recomendada_psi, 
    tipo_terreno
)
VALUES 
    ('CHENGSHAN', 'MASPIRE M/T', 'LT265/65 R17', 15.20, 40.0, 'MT'),
    ('CHENGSHAN', 'MASPIRE M/T', 'LT265/70 R16', 15.20, 40.0, 'MT'),
    ('CHENGSHAN', 'MASPIRE M/T', 'LT265/75 R16', 16.30, 40.0, 'MT'),
    ('CHENGSHAN', 'MASPIRE M/T', 'LT245/75 R16', 14.80, 40.0, 'MT'),
    ('CHENGSHAN', 'MASPIRE M/T', 'LT235/75 R15', 14.50, 35.0, 'MT'),
    ('CHENGSHAN', 'MASPIRE M/T', '31X10.50 R15LT', 15.50, 35.0, 'MT')
ON CONFLICT (marca, modelo, medida) 
DO UPDATE SET 
    profundidade_original_mm = EXCLUDED.profundidade_original_mm,
    pressao_recomendada_psi = EXCLUDED.pressao_recomendada_psi,
    tipo_terreno = EXCLUDED.tipo_terreno;
