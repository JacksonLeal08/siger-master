# Plano de Arquitetura: Nova Barra de Ferramentas Híbrida Premium

> **Objetivo:** Definir a realocação estrutural e executiva dos itens da Sidebar atual ("Despacho & Ronda", "Mapa Operacional", "Gestão de Ativo", "Logs do Sistema", "Configurações", "SIGER IA" e "Sair do Cockpit") na nova barra superior híbrida premium (fusão Opção 1 + Opção 2).

---

## 1. Mapeamento Estrutural dos 7 Elementos

| Elemento Atual | Novo Local Recomendado | Justificativa de UX / Arquitetura |
| :--- | :--- | :--- |
| **Despacho & Ronda Campo** | Submenu do **Pilar 3 (CAD / CECOM)** e **Pilar 2 (Frotas)** | É a atividade central de atendimento tático de viaturas e chamados. |
| **Mapa Operacional** | Flyout de destaque do **Pilar 3 (CAD / CECOM)** + Atalho Global | Visão geoespacial de viaturas, hidrantes e ocorrências de Parauapebas. |
| **Gestão de Ativo** | Submenu Mestre do **Pilar 1 (SPCI)** + Botão Rápido de Estoque | Gestão física de extintores, mangueiras, lotes e almoxarifado. |
| **Logs do Sistema** | **Menu de Governança / Perfil do Operador** (Canto Superior Direito) | Auditoria de segurança, rastreabilidade de acessos e conformidade. |
| **Configurações** | **Menu do Usuário / Engrenagem Executiva ⚙️** (Direita) | Parâmetros da empresa, logo, permissões e cadastro de usuários. |
| **SIGER IA (24h)** | **Pílula Luminosa Neon ✨** na barra superior (ao lado da busca) | Assistente transversal com IA para laudos, NBRs e apoio operacional. |
| **Sair do Cockpit** | **Menu Dropdown do Avatar / Perfil** | Local padrão de segurança corporativa, evitando cliques acidentais. |

---

## 2. As 3 Opções de Experiência e Layout

### Opção A: Topbar Completa com Flyouts Executivos (Liberação de Espaço na Tela)
- **Como funciona:** A barra superior assume todos os módulos distribuídos entre os 4 Pilares e a Suíte de Ações. A tela ganha 100% de largura útil para dashboards, mapas e tabelas.
- **Vantagem:** Visual limpo e cinematográfico de sistema de ponta.

### Opção B: Topbar com Conexão Dinâmica na Sidebar (Navegação em 2 Níveis)
- **Como funciona:** Ao clicar no Pilar no topo (ex: "Frotas 4x4"), a Sidebar lateral se adapta automaticamente mostrando apenas os módulos daquele pilar.
- **Vantagem:** Muito intuitivo para quem gosta de manter o menu vertical aberto para alternar rápido.

### Opção C: Barra Superior com Central de Apps / Command Pallet
- **Como funciona:** Além dos 4 Pilares no centro, há um botão de "Aplicações & Ferramentas" que abre uma gaveta com Mapa, Ronda, Logs e IA reunidos.

---

## 3. Próximos Passos
1. Usuário valida a distribuição dos 7 itens.
2. Implementação do layout selecionado no componente definitivo.
3. Teste em ambiente com dados reais.
