import { OrdemServicoFrota, Viatura, OficinaPrestador } from '@/lib/types/frota';
import { SubcomponenteSelecionado } from '@/lib/types/vehicleAnatomy';

/**
 * Formata um identificador técnico de OS em um protocolo amigável e rastreável de Romaneio
 * Padrão Rastreabilidade SPCI: ROM-OS-AAMM-CODIGO (Ex: ROM-OS-2609-001234)
 */
export function formatFriendlyRomaneioProtocol(
  osId?: string,
  dateStr?: string | Date,
  prefixoViatura?: string
): {
  shortCode: string;
  fullId: string;
  dateFormatted: string;
  timeFormatted: string;
} {
  const fullId = osId || '';
  const d = dateStr ? new Date(dateStr) : new Date();
  const validDate = !isNaN(d.getTime()) ? d : new Date();

  const year = String(validDate.getFullYear()).slice(-2);
  const month = String(validDate.getMonth() + 1).padStart(2, '0');

  let codePart = '';
  if (fullId) {
    const clean = fullId.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    codePart = clean.length >= 6 ? clean.slice(-6) : clean.padStart(6, '0');
  } else if (prefixoViatura) {
    codePart = prefixoViatura.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  } else {
    codePart = '001001';
  }

  const shortCode = `ROM-OS-${year}${month}-${codePart}`;
  const dateFormatted = validDate.toLocaleDateString('pt-BR');
  const timeFormatted = validDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  return {
    shortCode,
    fullId,
    dateFormatted,
    timeFormatted
  };
}

export interface GenerateRomaneioPDFOptions {
  os: OrdemServicoFrota;
  viatura?: Viatura | null;
  oficina?: OficinaPrestador | null;
  emitenteNome?: string;
  emitenteCargo?: string;
  aprovadorNome?: string;
  aprovadorCargo?: string;
}

/**
 * Gera e abre a via oficial do Relatório da OS (ROMANEIO DE ENCAMINHAMENTO)
 * formatado conforme o padrão de laudos corporativos SPCI (ABNT / Grupo OMG)
 */
export function generateRomaneioPDF({
  os,
  viatura,
  oficina,
  emitenteNome = 'Inspetor de Frotas SPCI',
  emitenteCargo = 'Técnico Operacional de Frotas',
  aprovadorNome = 'Gestor Responsável SPCI',
  aprovadorCargo = 'Coordenador de Manutenção & Ativos'
}: GenerateRomaneioPDFOptions) {
  if (typeof window === 'undefined') return;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Por favor, autorize popups no seu navegador para visualizar e imprimir o Romaneio da O.S.');
    return;
  }

  const proto = formatFriendlyRomaneioProtocol(
    os.id || os.numero_os,
    os.data_abertura || os.created_at,
    viatura?.prefixo_frota
  );

  const prioridade = (os.prioridade || 'NORMAL').toUpperCase();
  const prioridadeCor = prioridade === 'EMERGENCIA' ? '#b91c1c' : prioridade === 'URGENTE' ? '#d97706' : '#15803d';
  const prioridadeBg = prioridade === 'EMERGENCIA' ? '#fef2f2' : prioridade === 'URGENTE' ? '#fffbeb' : '#f0fdf4';

  const custoPecas = Number(os.custo_pecas || 0);
  const custoMaoObra = Number(os.custo_mao_de_obra || 0);
  const custoPneus = Number(os.custo_pneus || 0);
  const custoTotal = Number(os.custo_total || os.valor_estimado || (custoPecas + custoMaoObra + custoPneus));

  const valorFormatado = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // Componentes e itens anatômicos
  const componentes: SubcomponenteSelecionado[] = (os.itens_componentes_json || []) as SubcomponenteSelecionado[];

  // Renderização das linhas da tabela de componentes
  let componentesRowsHtml = '';
  if (componentes.length > 0) {
    componentesRowsHtml = componentes.map((c, idx) => {
      const subtotal = (c.quantidade || 1) * (c.valor_unitario_estimado || 0);
      const isCritico = c.criticidade === 'EMERGENCIA';
      return `
        <tr style="background: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
          <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; font-weight: 700; color: #0f172a;">${c.nome_componente_macro || 'Macro-Sistema'}</td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; color: #1e293b;">
            <strong>${c.nome_subcomponente}</strong>
            ${c.observacao ? `<div style="font-size: 8.5px; color: #64748b; margin-top: 1px;">Obs: ${c.observacao}</div>` : ''}
          </td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; font-weight: 700; color: #2563eb; text-align: center;">${c.acao || 'SUBSTITUICAO'}</td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; text-align: center; color: #475569;">${c.posicao || 'COMPLETO'}</td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; text-align: center; font-weight: 700;">${c.quantidade || 1}</td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #475569;">${c.valor_unitario_estimado ? valorFormatado(c.valor_unitario_estimado) : 'A orçar'}</td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 700; color: #0f172a;">${subtotal > 0 ? valorFormatado(subtotal) : 'A orçar'}</td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; text-align: center;">
            <span style="font-size: 8px; font-weight: 800; padding: 2px 6px; border-radius: 4px; background: ${isCritico ? '#fee2e2' : '#f1f5f9'}; color: ${isCritico ? '#b91c1c' : '#475569'};">
              ${c.criticidade || 'NORMAL'}
            </span>
          </td>
        </tr>
      `;
    }).join('');
  } else {
    componentesRowsHtml = `
      <tr>
        <td colspan="8" style="padding: 12px; text-align: center; color: #64748b; font-style: italic; border-bottom: 1px solid #e2e8f0;">
          ${os.resumo_anatomico || os.descricao_servico || 'Nenhum componente específico listado individualmente. Manutenção geral de acordo com o escopo descritivo.'}
        </td>
      </tr>
    `;
  }

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Romaneio de O.S. - ${proto.shortCode}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 8mm 10mm 8mm 10mm;
        }
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          color: #0f172a;
          background: #ffffff;
          font-size: 10px;
          line-height: 1.35;
          padding: 6px;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2.5px solid #af101a;
          padding-bottom: 8px;
          margin-bottom: 10px;
        }
        .brand-title {
          font-size: 15px;
          font-weight: 900;
          color: #af101a;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        .brand-sub {
          font-size: 8.5px;
          font-weight: 700;
          color: #475569;
          text-transform: uppercase;
          margin-top: 1px;
        }
        .doc-code {
          font-family: monospace;
          font-size: 11px;
          font-weight: 800;
          background: #f1f5f9;
          padding: 3px 8px;
          border-radius: 6px;
          border: 1px solid #cbd5e1;
          color: #af101a;
          display: inline-block;
        }
        .section-title {
          font-size: 9.5px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #0f172a;
          margin-top: 8px;
          margin-bottom: 4px;
          display: flex;
          align-items: center;
          gap: 4px;
          background: #f8fafc;
          padding: 3px 6px;
          border-left: 3px solid #af101a;
          border-radius: 2px;
        }
        .two-cols {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-bottom: 6px;
        }
        .card-box {
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          padding: 8px;
          background: #ffffff;
        }
        .meta-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 9.5px;
        }
        .meta-table td {
          padding: 2.5px 4px;
          border-bottom: 1px solid #f1f5f9;
        }
        .meta-table td.label {
          font-weight: 700;
          color: #64748b;
          width: 38%;
        }
        .meta-table td.val {
          font-weight: 600;
          color: #0f172a;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 9px;
          margin-top: 4px;
          margin-bottom: 6px;
        }
        .items-table th {
          background: #1e293b;
          color: #ffffff;
          font-weight: 800;
          text-transform: uppercase;
          padding: 5px 6px;
          font-size: 8px;
          letter-spacing: 0.5px;
          text-align: left;
        }
        .financial-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 6px;
          margin-top: 4px;
          margin-bottom: 6px;
        }
        .financial-box {
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          padding: 6px;
          text-align: center;
          background: #f8fafc;
        }
        .financial-box.highlight {
          border-color: #15803d;
          background: #f0fdf4;
        }
        .financial-box .lbl {
          font-size: 8px;
          font-weight: 700;
          text-transform: uppercase;
          color: #64748b;
        }
        .financial-box .val {
          font-size: 11px;
          font-weight: 900;
          color: #0f172a;
          margin-top: 2px;
        }
        .financial-box.highlight .val {
          color: #15803d;
        }
        .desc-box {
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 6px 8px;
          background: #fcfcfc;
          font-size: 9px;
          color: #334155;
          margin-bottom: 6px;
          white-space: pre-wrap;
          line-height: 1.4;
        }
        .signatures-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 12px;
          margin-top: 14px;
          page-break-inside: avoid;
        }
        .sign-box {
          border-top: 1.5px solid #475569;
          text-align: center;
          padding-top: 4px;
        }
        .sign-title {
          font-size: 8.5px;
          font-weight: 800;
          text-transform: uppercase;
          color: #0f172a;
        }
        .sign-sub {
          font-size: 7.5px;
          color: #64748b;
          margin-top: 1px;
        }
        .footer {
          margin-top: 10px;
          padding-top: 4px;
          border-top: 1px solid #e2e8f0;
          font-size: 7.5px;
          color: #94a3b8;
          display: flex;
          justify-content: space-between;
        }
        @media print {
          body {
            padding: 0;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .no-print {
            display: none !important;
          }
        }
      </style>
    </head>
    <body>
      <!-- Ações na tela (escondidas ao imprimir) -->
      <div class="no-print" style="margin-bottom: 10px; padding: 8px; background: #0f172a; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; color: white;">
        <span style="font-weight: 700; font-size: 11px;">Prévia do Romaneio Oficial de Encaminhamento</span>
        <button onclick="window.print()" style="background: #af101a; color: white; border: none; padding: 6px 16px; border-radius: 6px; font-weight: bold; font-size: 11px; cursor: pointer;">
          🖨️ Imprimir / Salvar PDF
        </button>
      </div>

      <!-- CABEÇALHO CORPORATIVO -->
      <div class="header">
        <div>
          <div class="brand-title">SIGER Master • SISTEMA DE GESTÃO DE FROTAS & SPCI</div>
          <div class="brand-sub">ROMANEIO TÉCNICO DE ENCAMINHAMENTO DE VIATURA • GRUPO OMG / CARAJÁS</div>
        </div>
        <div style="text-align: right;">
          <div class="doc-code">${proto.shortCode}</div>
          <div style="font-size: 8px; color: #64748b; font-family: monospace; margin-top: 2px;">OS Oficial: #${os.numero_os || 'PENDENTE'}</div>
          <div style="font-size: 8.5px; color: #64748b; margin-top: 1px;">Emissão: ${proto.dateFormatted} às ${proto.timeFormatted}</div>
        </div>
      </div>

      <!-- BLOCO BILATERAL: VEÍCULO & OFICINA DESTINO -->
      <div class="two-cols">
        <!-- Bloco Veículo -->
        <div class="card-box">
          <div style="font-size: 9px; font-weight: 800; text-transform: uppercase; color: #af101a; margin-bottom: 4px; display: flex; justify-content: space-between;">
            <span>🚓 1. DADOS DA VIATURA</span>
            <span style="color: ${prioridadeCor}; background: ${prioridadeBg}; padding: 1px 5px; border-radius: 3px; font-size: 8px;">
              CRITICIDADE: ${prioridade}
            </span>
          </div>
          <table class="meta-table">
            <tr>
              <td class="label">Prefixo da Frota:</td>
              <td class="val" style="font-weight: 800; color: #af101a;">${viatura?.prefixo_frota || 'VTR-01'}</td>
            </tr>
            <tr>
              <td class="label">Placa Mercosul:</td>
              <td class="val" style="font-family: monospace; font-weight: 800;">${viatura?.placa || 'N/A'}</td>
            </tr>
            <tr>
              <td class="label">Marca / Modelo:</td>
              <td class="val">${viatura?.marca || ''} ${viatura?.modelo || 'Veículo Operacional'}</td>
            </tr>
            <tr>
              <td class="label">Tipo de Veículo:</td>
              <td class="val">${viatura?.tipo_veiculo || 'CAMINHONETE'}</td>
            </tr>
            <tr>
              <td class="label">Odômetro de Entrada:</td>
              <td class="val">${Number(os.odometro_km || viatura?.odometro_atual_km || 0).toLocaleString('pt-BR')} KM</td>
            </tr>
            <tr>
              <td class="label">Base / Contrato:</td>
              <td class="val">${os.contrato_id || viatura?.contrato_id || 'PARAUAPEBAS'}</td>
            </tr>
          </table>
        </div>

        <!-- Bloco Oficina Destino -->
        <div class="card-box">
          <div style="font-size: 9px; font-weight: 800; text-transform: uppercase; color: #2563eb; margin-bottom: 4px; display: flex; justify-content: space-between;">
            <span>🏢 2. DESTINO & EXECUÇÃO</span>
            <span style="color: #475569; font-size: 8px;">ORIGEM: ${os.tipo_os || 'EXTERNA'}</span>
          </div>
          <table class="meta-table">
            <tr>
              <td class="label">Oficina / Estabelecimento:</td>
              <td class="val" style="font-weight: 800; color: #1e293b;">${oficina?.nome_fantasia || oficina?.razao_social || (os.tipo_os === 'INTERNA' ? 'Oficina Interna da Base SIGER' : 'Oficina Homologada Externa')}</td>
            </tr>
            <tr>
              <td class="label">CNPJ / Identificação:</td>
              <td class="val" style="font-family: monospace;">${oficina?.cnpj || 'Homologada no Contrato'}</td>
            </tr>
            <tr>
              <td class="label">Contato / Telefone:</td>
              <td class="val">${oficina?.telefone || '(94) 99100-0000'}</td>
            </tr>
            <tr>
              <td class="label">Natureza da Manutenção:</td>
              <td class="val" style="font-weight: 700;">${os.tipo_manutencao || os.natureza_manutencao || 'CORRETIVA'}</td>
            </tr>
            <tr>
              <td class="label">Status da Ordem:</td>
              <td class="val" style="font-weight: 800; color: #15803d;">${os.status_os || os.status || 'ABERTA'}</td>
            </tr>
            <tr>
              <td class="label">Etapa do Workflow:</td>
              <td class="val">Etapa ${os.numero_etapa || 1}/6 — ${os.etapa_atual || '1_ABERTURA_TRIAGEM'}</td>
            </tr>
          </table>
        </div>
      </div>

      <!-- SEÇÃO 3: ANATOMIA VEICULAR: COMPONENTES & SERVIÇOS REQUERIDOS -->
      <div class="section-title">🔩 3. ANATOMIA VEICULAR: COMPONENTES & SERVIÇOS A MANUTENIR</div>
      <table class="items-table">
        <thead>
          <tr>
            <th style="width: 15%;">Sistema Macro</th>
            <th style="width: 28%;">Subcomponente / Peça</th>
            <th style="width: 13%; text-align: center;">Ação</th>
            <th style="width: 11%; text-align: center;">Posição</th>
            <th style="width: 6%; text-align: center;">Qtd</th>
            <th style="width: 11%; text-align: right;">Unit. Est.</th>
            <th style="width: 10%; text-align: right;">Subtotal</th>
            <th style="width: 6%; text-align: center;">Risco</th>
          </tr>
        </thead>
        <tbody>
          ${componentesRowsHtml}
        </tbody>
      </table>

      <!-- SEÇÃO 4: RESUMO FINANCEIRO & RATEIO -->
      <div class="section-title">💰 4. ESTIMATIVA ORÇAMENTÁRIA & RATEIO DE CUSTOS</div>
      <div class="financial-grid">
        <div class="financial-box">
          <div class="lbl">Peças & Componentes</div>
          <div class="val">${valorFormatado(custoPecas)}</div>
        </div>
        <div class="financial-box">
          <div class="lbl">Mão de Obra Especializada</div>
          <div class="val">${valorFormatado(custoMaoObra)}</div>
        </div>
        <div class="financial-box">
          <div class="lbl">Pneus & Borracharia</div>
          <div class="val">${valorFormatado(custoPneus)}</div>
        </div>
        <div class="financial-box highlight">
          <div class="lbl">Total Estimado da O.S.</div>
          <div class="val">${valorFormatado(custoTotal)}</div>
        </div>
      </div>

      <!-- SEÇÃO 5: ESCOPO DESCRITIVO & DIAGNÓSTICO -->
      <div class="section-title">📝 5. ESCOPO DO SERVIÇO & DIAGNÓSTICO DO SOLICITANTE</div>
      <div class="desc-box">
${os.descricao_motivo || os.descricao_servico || 'Manutenção geral programada para a viatura operacional.'}
      </div>

      <!-- SEÇÃO 6: TERMO DE ENCAMINHAMENTO & ASSINATURAS BILATERAIS -->
      <div class="section-title">✍️ 6. FORMALIZAÇÃO, TRAMITAÇÃO E ASSINATURAS</div>
      <div style="font-size: 8px; color: #64748b; margin-bottom: 6px; line-height: 1.3;">
        O presente Romaneio autoriza o recebimento e início da vistoria técnica pela oficina credenciada. A execução efetiva fica condicionada à emissão do orçamento e validação da alçada de aprovação conforme matriz corporativa SIGER Master.
      </div>

      <div class="signatures-grid">
        <!-- Emitente -->
        <div class="sign-box">
          <div style="height: 28px;"></div>
          <div class="sign-title">${emitenteNome}</div>
          <div class="sign-sub">${emitenteCargo}</div>
          <div class="sign-sub">Emitente / Inspetor Solicitante</div>
        </div>

        <!-- Oficina Credenciada -->
        <div class="sign-box">
          <div style="height: 28px;"></div>
          <div class="sign-title">${oficina?.responsavel || oficina?.contato_responsavel || 'Responsável Técnico da Oficina'}</div>
          <div class="sign-sub">${oficina?.nome_fantasia || oficina?.razao_social || 'Oficina Credenciada Homologada'}</div>
          <div class="sign-sub">Recebimento & Vistoria Técnica</div>
        </div>

        <!-- Aprovador -->
        <div class="sign-box">
          <div style="height: 28px;"></div>
          <div class="sign-title">${aprovadorNome}</div>
          <div class="sign-sub">${aprovadorCargo}</div>
          <div class="sign-sub">Aprovador / Gestor de Frota SPCI</div>
        </div>
      </div>

      <!-- RODAPÉ CORPORATIVO -->
      <div class="footer">
        <span>SIGER Master • Sistema de Gestão Contra Incêndio & Frotas • Complexo Carajás</span>
        <span>Autenticação: ${os.id ? `UUID-${os.id.slice(0, 8)}` : 'SISTEMA-INTEGRADO'}</span>
        <span>Página 1 de 1</span>
      </div>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
