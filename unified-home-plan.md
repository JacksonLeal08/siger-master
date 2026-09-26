# 📋 Plano de Implementação: Home Geral Unificada (Cockpit SIGER Master 360°)

> **Documento Arquitetural de Engenharia de Software e Design Executivo**  
> **Liderança Técnica:** `@[project-planner]` & `@[frontend-specialist]`  
> **Status:** Em Validação de Prévia Interativa  

---

## 🎯 1. Visão Geral e Objetivo

Atualmente, o sistema possui módulos de altíssimo nível (Extintores, Hidrantes, Bombas, Sinalização, Viaturas 4x4, Mapa e Logs), porém seus dados estão dispersos em páginas isoladas.

A **Home Geral Unificada** tem como missão consolidar o ecossistema em um **Cockpit de Comando Executivo 360°**, permitindo que o gestor, o engenheiro de segurança e os brigadistas tenham visão panorâmica e em tempo real sobre:
1. **Segurança e Conformidade Legal NBR** (Ativos fixos de combate a incêndio).
2. **Prontidão de Frota & Resgate 4x4** (Ambulâncias, viaturas de combate e viaturas de apoio).
3. **Comando Operacional CAD / CECOM** (Ocorrências ativas, despachos e geolocalização).
4. **Resgate Clínico e Regulação Hospitalar ePCR** (Prontuário de Atendimento APH Vivo).

---

## 🏛️ 2. Arquitetura da Página: Bento Grid Executivo

A interface adota a consagrada diagramação **Bento Grid** em Dark/Light Glassmorphism (vidro fosco translúcido), garantindo alta densidade de informação sem poluição visual.

```
+-----------------------------------------------------------------------------------+
| 🌐 BARRA SUPERIOR DE PRONTIDÃO GLOBAL (Índice Geral, Seletor de Planta & Status)  |
+-----------------------------------------------------------------------------------+
| 🧯 PILAR 1: SPCI ATIVOS          | 🚒 PILAR 2: FROTAS 4x4 & RESGATE               |
| - Índice de Conformidade Legal   | - Viaturas Prontas vs. Em Manutenção           |
| - Total de Extintores/Hidrantes  | - Metrologia TWI de Pneus (Alertas Críticos)   |
| - Vencidos, Manutenção e Alertas | - Autonomia & Média de Combustível da Frota    |
| - Acesso Rápido a Vistoria       | - Despacho de Viatura Rápido                   |
+----------------------------------+------------------------------------------------+
| 📡 PILAR 3: CAD / CECOM          | 🩺 PILAR 4: ePCR CLÍNICO APH                   |
| - Chamados 193 em Andamento      | - Atendimentos do Plantão de Hoje              |
| - Tempo Médio de Resposta (TMR)  | - Triagem Manchester (Vermelho/Amarelo/Verde)  |
| - Mini Mapa Tático de Calor      | - Curvas Vitais & Estabilidade de Vítimas      |
+----------------------------------+------------------------------------------------+
| ⚡ FEED DE TELEMETRIA AO VIVO (Últimas inspeções, despachos e auditorias)         |
+-----------------------------------------------------------------------------------+
```

---

## 📊 3. Especificação dos Dados e Métricas por Pilar

### Pilar 1: SPCI Ativos & Engenharia (Gestão de Ativos e Setores da Planta)
- **Módulos Integrantes Reagrupados:**
  - 📊 **Dashboard / Visão Geral SPCI:** Painel tático com mapa de calor por setor da planta (Manganês, Barragem, Sala Elétrica, Almoxarifado, Recepção, Cobre, Ferro, Produção, Logística), conformidade legal NBR e gerador de QR Code dinâmico para vistorias.
  - 📦 **Gestão de Ativos & Setores da Planta:** Administração de localizações, setores físicos, movimentações, almoxarifado/estoque e substituições de cilindros.
  - 🧯 **Equipamentos Críticos:** Extintores (NBR 12962), Hidrantes & Mangueiras (NBR 13714), Casa de Bombas & Automação, Sinalização Fotoluminescente (NBR 13434) e Iluminação de Emergência.
- **KPI Mestre:** % de Conformidade NBR (Cálculo: `((Total - Vencidos) / Total) * 100`).
- **Destaques:** Cartão de criticidade com contagem de equipamentos vencidos com prazo de tolerância zero e monitoramento de setores operacionais.

### Pilar 2: Frotas 4x4 & Resgate
- **KPI Mestre:** % de Prontidão da Frota (`Viaturas Operacionais / Total de Viaturas`).
- **Metrologia de Pneus:** Número de pneus com sulco inferior a 1.6mm (limite CONTRAN 558/80).
- **Abastecimento:** Média de combustível disponível e alertas de desvio de consumo.

### Pilar 3: CAD / CECOM
- **KPI Mestre:** Ocorrências ativas no momento vs. Ocorrências atendidas e arquivadas hoje.
- **Tempo de Resposta:** Cronômetro médio de deslocamento da base até o local do sinistro.
- **Radar Tático:** Distribuição geográfica dos recursos operacionais.

### Pilar 4: ePCR Clínico (Prontuário APH Vivo)
- **KPI Mestre:** Volume de atendimentos médicos e pré-hospitalares nas últimas 24h.
- **Protocolo de Manchester:** Gráfico de distribuição por gravidade (Emergência Vermelha, Muito Urgente Laranja, Urgente Amarelo, Pouco Urgente Verde).
- **Estabilidade:** Status de encaminhamento e regulação para o ambulatório central ou hospital regional.

---

## 🛠️ 4. Cronograma de Execução em 4 Fases

| Fase | Escopo | Entregáveis |
| :--- | :--- | :--- |
| **Fase 1 (Atual)** | **Laboratório de Prévia Interativa** | Página `/preview-home-geral` com navegação interativa, filtros e visualização real dos cartões |
| **Fase 2** | **Conexão Real dos Dados** | Unificação dos hooks de contexto (`useSpci`, `getFrotaKpisAction`, `complianceLogs`) para atualização automática sem recarregar tela |
| **Fase 3** | **Interações Rápidas & Mini Radar** | Abertura dos modais de vistoria rápida e despacho direto da página inicial |
| **Fase 4** | **Substituição Definitiva** | Integração na rota principal `/dashboard`, testes automatizados e deploy |

---
