-- ==============================================================================
-- SIGER MASTER - GARANTIA DE PRIMARY KEYS EM TODAS AS TABELAS
-- Data: 24/09/2026
-- Objetivo: Garantir que nenhuma tabela do schema public fique sem PRIMARY KEY,
-- assegurando compatibilidade com Supabase Realtime, Replicação e Integridade.
-- ==============================================================================

DO $$
DECLARE
    tabelas_pk text[][] := ARRAY[
        ['assets', 'id'],
        ['ativo_movimentacoes', 'id'],
        ['ativos_extintores', 'id'],
        ['cadastro_extintores', 'asset_id'],
        ['checklists_ativos', 'id'],
        ['checklists_veiculares', 'id'],
        ['inspecoes', 'id'],
        ['inspecoes_realizadas', 'id'],
        ['locais', 'id'],
        ['locais_planta', 'id'],
        ['sub_locais', 'id'],
        ['modelos_extintores', 'id'],
        ['usuarios', 'id'],
        ['profiles', 'id'],
        ['shared_sessions', 'id'],
        ['audit_logs', 'id'],
        ['logs_auditoria', 'id'],
        ['contratos', 'id'],
        ['usuario_contratos', 'id'],
        ['fornecedores_manutencao', 'id'],
        ['lotes_manutencao', 'id'],
        ['itens_lote_manutencao', 'id'],
        ['historico_movimentacoes_ativos', 'id'],
        ['historico_localizacao_ativo', 'id'],
        ['modulos', 'id'],
        ['permissoes_modulos', 'id'],
        ['viaturas', 'id'],
        ['abastecimentos', 'id'],
        ['oficinas_prestadores', 'id'],
        ['ordens_servico_frota', 'id'],
        ['catalogo_pneus_referencia', 'id'],
        ['inspecoes_rodagem_pneus', 'id'],
        ['itens_afericao_pneus', 'id']
    ];
    i int;
    tbl text;
    col text;
BEGIN
    FOR i IN 1..array_length(tabelas_pk, 1) LOOP
        tbl := tabelas_pk[i][1];
        col := tabelas_pk[i][2];
        
        -- Verifica se a tabela existe no schema public
        IF EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = tbl
        ) THEN
            -- Verifica se a tabela já possui alguma chave primária definida
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.table_constraints 
                WHERE table_schema = 'public' AND table_name = tbl AND constraint_type = 'PRIMARY KEY'
            ) THEN
                -- Garante que a coluna não aceita nulos
                EXECUTE format('ALTER TABLE public.%I ALTER COLUMN %I SET NOT NULL', tbl, col);
                -- Adiciona a chave primária
                EXECUTE format('ALTER TABLE public.%I ADD PRIMARY KEY (%I)', tbl, col);
                RAISE NOTICE 'Chave Primária adicionada com sucesso na tabela public.% (coluna %)', tbl, col;
            ELSE
                RAISE NOTICE 'Tabela public.% já possui chave primária.', tbl;
            END IF;
        END IF;
    END LOOP;
EXCEPTION
    WHEN duplicate_object OR duplicate_table THEN
        RAISE NOTICE 'Chaves primárias já existentes.';
    WHEN others THEN
        RAISE NOTICE 'Aviso na aplicação de chaves primárias: %', SQLERRM;
END $$;
