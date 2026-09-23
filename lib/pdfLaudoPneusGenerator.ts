import { InspecaoRodagemPneus, Viatura, ItemAfericaoPneu } from '@/lib/types/frota';
import { 
  LIMITE_LEGAL_TWI_MM, 
  LIMITE_ATENCAO_MM,
  CATALOGO_PNEUS_HOMOLOGADOS_PADRAO 
} from '@/lib/services/TireWearCalculator';

/**
 * Auxiliar para determinar a classificação de terreno e pressão nominal de catálogo
 */
function getMetadadosCatalogoItem(item: ItemAfericaoPneu) {
  const cat = CATALOGO_PNEUS_HOMOLOGADOS_PADRAO.find(
    (c) => c.id === item.pneu_referencia_id || (c.marca.toUpperCase() === (item.marca || '').toUpperCase() && c.modelo.toUpperCase() === (item.modelo || '').toUpperCase())
  );

  let tipoTerreno = cat?.tipo_terreno || 'AT';
  if (!cat) {
    const mod = (item.modelo || '').toUpperCase();
    if (mod.includes('MUD') || mod.includes('KM3') || mod.includes('MASPIRE')) tipoTerreno = 'MT';
    else if (mod.includes('DURATRAC') || mod.includes('RUGGED')) tipoTerreno = 'RT';
    else if (mod.includes('VANCONTACT') || mod.includes('HIGHWAY')) tipoTerreno = 'HT';
  }

  const pressaoNominal = cat?.pressao_recomendada_psi || 35.0;
  return { tipoTerreno, pressaoNominal };
}

/**
 * Gera e abre em nova janela o Laudo Técnico Pericial de Rodagem Veicular formatado para impressão executiva / PDF
 * Padrão Corporativo de Romaneios e Laudos Periciais do SIGER Master (A4 Paisagem • Página Única)
 */
export function generateLaudoPneusPDF(
  inspecao: InspecaoRodagemPneus,
  viatura: Viatura,
  responsavelNome: string = 'Jackson Leal - Engenheiro Responsável'
) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Por favor, autorize a abertura de popups para visualizar e emitir o Laudo Pericial em PDF.');
    return;
  }

  const dataHoraEmissao = new Date(inspecao.data_hora || Date.now()).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const itens = inspecao.itens || [];

  // ---------------------------------------------------------------------------
  // 1. CÁLCULO DOS 4 KPIS METROLÓGICOS RÁPIDOS
  // ---------------------------------------------------------------------------
  const totalRodas = itens.length;
  const mediaVidaUtil = totalRodas > 0
    ? (itens.reduce((acc, cur) => acc + (cur.percentual_vida_util || 0), 0) / totalRodas).toFixed(1)
    : '0.0';

  const pneuMaisCritico = totalRodas > 0
    ? [...itens].sort((a, b) => (a.profundidade_sulco_mm || 0) - (b.profundidade_sulco_mm || 0))[0]
    : null;

  const temCritico = itens.some(i => i.status_twi === 'CRITICO_PROIBIDO' || (i.profundidade_sulco_mm || 0) <= LIMITE_LEGAL_TWI_MM);
  const temAtencao = itens.some(i => i.status_twi === 'ATENCAO' || ((i.profundidade_sulco_mm || 0) < LIMITE_ATENCAO_MM));

  const parecerGeral = temCritico
    ? { status: 'REPROVADO / TWI CRÍTICO', subtitulo: 'Interdição Operacional Imediata', color: '#b91c1c', bg: '#fee2e2', border: '#fca5a5' }
    : temAtencao
    ? { status: 'ATENÇÃO PREVENTIVA', subtitulo: 'Programar Substituição de Pneus', color: '#b45309', bg: '#fef3c7', border: '#fcd34d' }
    : { status: 'APROVADO PARA OPERAÇÃO', subtitulo: 'Conforme Diretrizes CONTRAN 558/80', color: '#15803d', bg: '#dcfce7', border: '#86efac' };

  let somaDesvioPsi = 0;
  itens.forEach(item => {
    const { pressaoNominal } = getMetadadosCatalogoItem(item);
    somaDesvioPsi += Math.abs((item.pressao_psi || pressaoNominal) - pressaoNominal);
  });
  const mediaDesvioPsi = totalRodas > 0 ? (somaDesvioPsi / totalRodas).toFixed(1) : '0.0';
  const conformidadePressaoTexto = Number(mediaDesvioPsi) <= 1.0 
    ? '100% Calibrado (Adequado)' 
    : `Desvio médio: ±${mediaDesvioPsi} PSI`;

  // ---------------------------------------------------------------------------
  // 2. MATRIZ METROLÓGICA COMPARATIVA (FABRICANTE VS. AFERIDO EM CAMPO)
  // ---------------------------------------------------------------------------
  const rowsComparativasHtml = itens.map((item, idx) => {
    const { tipoTerreno, pressaoNominal } = getMetadadosCatalogoItem(item);
    const sOrig = Number(item.profundidade_original_mm || 0);
    const sMedido = Number(item.profundidade_sulco_mm || 0);
    const deltaDesgaste = Number(item.desgaste_acumulado_mm || Math.max(0, sOrig - sMedido));
    const vidaUtil = Number(item.percentual_vida_util || 0);
    const pressaoReal = Number(item.pressao_psi || 0);
    const desvioPsi = pressaoReal - pressaoNominal;
    const bUtil = Math.max(0, sOrig - 1.60);
    const saldoTwi = Math.max(0, sMedido - 1.60);
    const percentualGasto = bUtil > 0 ? ((deltaDesgaste / bUtil) * 100).toFixed(1) : '100.0';

    const isCritico = item.status_twi === 'CRITICO_PROIBIDO' || sMedido <= LIMITE_LEGAL_TWI_MM;
    const isAtencao = item.status_twi === 'ATENCAO' || (sMedido < LIMITE_ATENCAO_MM && !isCritico);

    const statusBadge = isCritico
      ? `<span class="badge badge-critico">REPROVADO (TWI ≤ 1.6 mm)</span>`
      : isAtencao
      ? `<span class="badge badge-atencao">ATENÇÃO PREVENTIVA</span>`
      : `<span class="badge badge-conforme">CONFORME PLENO</span>`;

    const terrainBadgeColor = 
      tipoTerreno === 'HT' ? 'background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe;' :
      tipoTerreno === 'AT' ? 'background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0;' :
      tipoTerreno === 'RT' ? 'background: #fffbeb; color: #b45309; border: 1px solid #fde68a;' :
      'background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca;';

    const rowBg = isCritico ? 'background-color: #fff1f2;' : (idx % 2 === 0 ? 'background-color: #ffffff;' : 'background-color: #f8fafc;');
    const barColor = isCritico ? '#dc2626' : isAtencao ? '#f59e0b' : '#10b981';

    return `
      <tr style="${rowBg}">
        <td style="text-align: center; font-weight: 800; font-family: monospace; color: #0f172a; padding: 2px 4px;">
          <span style="display: block; font-size: 11px; color: #af101a; line-height: 1;">${item.posicao_pneu}</span>
          <span style="font-size: 7.5px; color: #64748b; text-transform: uppercase;">
            ${item.posicao_pneu === 'DE' ? 'Diant. Esq.' : item.posicao_pneu === 'DD' ? 'Diant. Dir.' : item.posicao_pneu === 'TE' ? 'Tras. Esq.' : item.posicao_pneu === 'TD' ? 'Tras. Dir.' : 'Estepe'}
          </span>
        </td>
        <td style="padding: 2px 6px;">
          <div style="font-weight: 800; color: #0f172a; font-size: 9.5px; line-height: 1.1;">${item.marca || 'CHENGSHAN'} ${item.modelo || 'MASPIRE M/T'}</div>
          <div style="font-family: monospace; color: #475569; font-size: 8.5px; margin-top: 1px;">
            ${item.medida || 'LT265/65 R17'}
            <span style="display: inline-block; padding: 0px 4px; border-radius: 3px; font-weight: bold; font-size: 8px; margin-left: 3px; ${terrainBadgeColor}">
              ${tipoTerreno}
            </span>
          </div>
        </td>
        <td style="text-align: center; font-family: monospace; font-size: 9px; padding: 2px 4px;">
          <div><strong>${sOrig.toFixed(2)}</strong> mm</div>
          <div style="font-size: 7.5px; color: #64748b;">(B<sub>útil</sub>: ${bUtil.toFixed(2)} mm)</div>
        </td>
        <td style="text-align: center; font-family: monospace; font-size: 9px; color: #475569; padding: 2px 4px;">
          ${pressaoNominal.toFixed(0)} PSI
        </td>
        <td style="text-align: center; font-family: monospace; font-size: 10px; font-weight: 800; color: ${isCritico ? '#dc2626' : isAtencao ? '#d97706' : '#16a34a'}; padding: 2px 4px;">
          ${sMedido.toFixed(2)} mm
        </td>
        <td style="text-align: center; font-family: monospace; font-size: 9px; padding: 2px 4px;">
          <strong>${pressaoReal.toFixed(1)}</strong> PSI
          <span style="font-size: 7.5px; color: ${Math.abs(desvioPsi) <= 1.0 ? '#16a34a' : '#d97706'};">
            (${desvioPsi >= 0 ? '+' : ''}${desvioPsi.toFixed(1)})
          </span>
        </td>
        <td style="text-align: center; font-family: monospace; font-size: 9px; color: #64748b; padding: 2px 4px;">
          <div>${deltaDesgaste.toFixed(2)} mm</div>
          <div style="font-size: 7.5px; color: #af101a;">(${percentualGasto}% gasto)</div>
        </td>
        <td style="text-align: center; font-family: monospace; font-size: 9.5px; font-weight: bold; color: ${isCritico ? '#dc2626' : '#0f172a'}; padding: 2px 4px;">
          ${saldoTwi.toFixed(2)} mm
        </td>
        <td style="text-align: center; width: 75px; padding: 2px 4px;">
          <div style="font-weight: 800; font-family: monospace; font-size: 9.5px; color: ${isCritico ? '#dc2626' : '#0f172a'}; line-height: 1;">
            ${vidaUtil.toFixed(1)}%
          </div>
          <div style="width: 100%; height: 4px; background: #e2e8f0; border-radius: 2px; overflow: hidden; margin-top: 2px;">
            <div style="width: ${Math.min(100, Math.max(0, vidaUtil))}%; height: 100%; background: ${barColor};"></div>
          </div>
        </td>
        <td style="text-align: center; padding: 2px 4px;">
          ${statusBadge}
        </td>
      </tr>
    `;
  }).join('');

  // Item referencial para a memória de cálculo formal
  const refItem = itens[0] || {
    profundidade_original_mm: 9.50,
    profundidade_sulco_mm: 4.20,
    percentual_vida_util: 32.91
  };
  const sOrigDem = Number(refItem.profundidade_original_mm).toFixed(2);
  const sMedidoDem = Number(refItem.profundidade_sulco_mm).toFixed(2);
  const bUtilDem = Math.max(0, refItem.profundidade_original_mm - 1.60).toFixed(2);
  const saldoDem = Math.max(0, refItem.profundidade_sulco_mm - 1.60).toFixed(2);
  const vidaUtilDem = Number(refItem.percentual_vida_util).toFixed(2);

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Laudo Técnico Pericial de Rodagem & Metrologia - ${viatura.prefixo_frota}</title>
      <style>
        /* Configuração Mandatória de Impressão em Modo Paisagem A4 (Single-Page) */
        @page {
          size: A4 landscape;
          margin: 5mm 6mm 5mm 6mm;
        }

        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        html, body {
          font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Arial, sans-serif;
          color: #0f172a;
          background-color: #e2e8f0;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        body {
          padding: 10px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        /* Container Folha A4 Paisagem (297mm x 210mm) */
        .container {
          width: 285mm;
          max-width: 100%;
          background: #ffffff;
          border-radius: 6px;
          padding: 8px 12px;
          box-shadow: 0 4px 18px rgba(0,0,0,0.12);
        }

        /* Barra de Ações para Impressão na Tela */
        .print-actions {
          width: 285mm;
          max-width: 100%;
          background: #090d16;
          color: #ffffff;
          padding: 6px 14px;
          border-radius: 6px;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }
        .btn-print {
          background-color: #dc2626;
          color: #ffffff;
          border: none;
          padding: 6px 14px;
          font-weight: 700;
          border-radius: 5px;
          cursor: pointer;
          font-size: 11px;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: background 0.15s ease;
        }
        .btn-print:hover {
          background-color: #b91c1c;
        }

        /* Cabeçalho Oficial */
        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 2px solid #af101a;
          padding-bottom: 5px;
          margin-bottom: 6px;
        }
        .header-logo {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .logo-box {
          background: linear-gradient(135deg, #af101a 0%, #880b14 100%);
          color: #ffffff;
          padding: 4px 10px;
          border-radius: 5px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(255,255,255,0.2);
        }
        .logo-main {
          font-weight: 900;
          font-size: 15px;
          letter-spacing: 1px;
          font-family: monospace;
          line-height: 1;
        }
        .logo-sub {
          font-weight: 700;
          font-size: 7.5px;
          letter-spacing: 1.5px;
          color: #fecaca;
          line-height: 1;
          margin-top: 1px;
        }
        .header-titles h1 {
          font-size: 12.5px;
          font-weight: 800;
          color: #0f172a;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          line-height: 1.15;
        }
        .header-titles p {
          font-size: 8.5px;
          color: #64748b;
          font-weight: 600;
          margin-top: 1px;
        }
        .header-protocol {
          text-align: right;
          font-family: monospace;
          font-size: 8.5px;
          line-height: 1.25;
        }
        .header-protocol .badge-doc {
          background-color: #f1f5f9;
          border: 1px solid #cbd5e1;
          color: #334155;
          padding: 1px 6px;
          border-radius: 4px;
          font-weight: bold;
          font-size: 8px;
          display: inline-block;
          margin-bottom: 2px;
        }

        /* Linha Dupla: Identificação da Viatura (Esquerda) + 4 KPIs (Direita) */
        .row-vtr-kpis {
          display: grid;
          grid-template-columns: 57% 42%;
          gap: 1%;
          margin-bottom: 6px;
          align-items: stretch;
        }

        /* Ficha Técnica da Viatura (CRLV) */
        .card-veiculo {
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 5px 8px;
          background-color: #f8fafc;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .card-veiculo h3 {
          font-size: 9px;
          text-transform: uppercase;
          font-weight: 800;
          color: #af101a;
          margin-bottom: 4px;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 2px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .status-pill {
          font-family: monospace;
          font-size: 7.5px;
          font-weight: bold;
          padding: 1px 5px;
          border-radius: 3px;
        }
        .status-ok {
          background: #dcfce7;
          color: #15803d;
          border: 1px solid #86efac;
        }
        .status-alerta {
          background: #fee2e2;
          color: #b91c1c;
          border: 1px solid #fca5a5;
        }
        .grid-veiculo {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 3px 6px;
          font-size: 8.5px;
        }
        .grid-item span {
          display: block;
          font-size: 7px;
          color: #64748b;
          text-transform: uppercase;
          font-weight: 700;
          line-height: 1;
        }
        .grid-item strong {
          color: #0f172a;
          font-family: monospace;
          font-size: 8.5px;
          line-height: 1.15;
        }

        /* Painel 4 KPIs no Topo */
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 5px;
        }
        .kpi-card {
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          padding: 4px 6px;
          background: #ffffff;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .kpi-label {
          font-size: 7px;
          font-weight: 800;
          text-transform: uppercase;
          color: #64748b;
          line-height: 1;
          margin-bottom: 2px;
        }
        .kpi-value {
          font-family: monospace;
          font-size: 11px;
          font-weight: 900;
          color: #0f172a;
          line-height: 1.1;
        }
        .kpi-sub {
          font-size: 6.5px;
          color: #64748b;
          line-height: 1;
          margin-top: 2px;
        }

        /* Matriz Comparativa (Tabela) */
        .section-header-compact {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 3px;
        }
        .section-title {
          font-size: 9.5px;
          font-weight: 800;
          text-transform: uppercase;
          color: #0f172a;
          letter-spacing: 0.2px;
        }
        .section-sub {
          font-size: 7.5px;
          color: #64748b;
          font-weight: 600;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 6px;
        }
        th {
          background-color: #0f172a;
          color: #ffffff;
          font-size: 7.5px;
          font-weight: 700;
          text-transform: uppercase;
          padding: 4px 4px;
          border: 1px solid #0f172a;
          letter-spacing: 0.1px;
        }
        td {
          border: 1px solid #e2e8f0;
          font-size: 8.5px;
        }

        /* Badges de Status */
        .badge {
          font-size: 7px;
          font-weight: 800;
          padding: 1px 4px;
          border-radius: 3px;
          text-transform: uppercase;
          display: inline-block;
          font-family: monospace;
          white-space: nowrap;
        }
        .badge-conforme {
          background-color: #dcfce7;
          color: #15803d;
          border: 1px solid #bbf7d0;
        }
        .badge-atencao {
          background-color: #fef3c7;
          color: #b45309;
          border: 1px solid #fde68a;
        }
        .badge-critico {
          background-color: #fee2e2;
          color: #b91c1c;
          border: 1px solid #fecaca;
        }

        /* Linha Inferior: Memória de Cálculo (34%) + Glossário (42%) + Assinaturas (23%) */
        .row-bottom-grid {
          display: grid;
          grid-template-columns: 34% 42% 22%;
          gap: 1%;
          align-items: stretch;
        }

        /* Memória de Cálculo */
        .card-calculo {
          border: 1px solid #cbd5e1;
          border-left: 3px solid #af101a;
          border-radius: 5px;
          padding: 4px 6px;
          background-color: #f8fafc;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .card-calculo h4 {
          font-size: 8px;
          text-transform: uppercase;
          color: #0f172a;
          font-weight: 800;
          margin-bottom: 2px;
        }
        .formula-box {
          background-color: #ffffff;
          border: 1px solid #e2e8f0;
          padding: 3px 5px;
          border-radius: 3px;
          font-family: monospace;
          font-size: 7.5px;
          color: #0f172a;
          line-height: 1.35;
        }
        .formula-box strong {
          color: #af101a;
        }
        .formula-obs {
          font-size: 6.5px;
          color: #64748b;
          font-style: italic;
          margin-top: 2px;
          line-height: 1.15;
        }

        /* Glossário Normativo */
        .glossario-card {
          border: 1px solid #cbd5e1;
          border-radius: 5px;
          padding: 4px 6px;
          background: #ffffff;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .glossario-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 2px;
          margin-bottom: 3px;
        }
        .glossario-title {
          font-size: 8px;
          font-weight: 800;
          text-transform: uppercase;
          color: #0f172a;
        }
        .glossario-norma {
          font-size: 7px;
          color: #64748b;
          font-family: monospace;
        }
        .glossario-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 2px 6px;
          font-size: 7px;
          color: #334155;
          line-height: 1.2;
        }
        .glossario-item strong {
          color: #0f172a;
        }

        /* Assinaturas Técnicas */
        .signatures-card {
          border: 1px solid #cbd5e1;
          border-radius: 5px;
          padding: 4px 6px;
          background: #ffffff;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          text-align: center;
        }
        .sign-box {
          margin-top: 2px;
        }
        .sign-line {
          border-top: 1px solid #475569;
          margin-bottom: 2px;
        }
        .sign-title {
          font-weight: bold;
          font-size: 8px;
          color: #0f172a;
          line-height: 1.1;
        }
        .sign-sub {
          font-size: 6.5px;
          color: #64748b;
          line-height: 1.1;
        }
        .doc-auth-stamp {
          margin-top: 2px;
          font-size: 6px;
          font-family: monospace;
          color: #047857;
          background: #ecfdf5;
          border: 1px dashed #a7f3d0;
          padding: 1px 3px;
          border-radius: 3px;
          font-weight: bold;
        }

        /* REGRAS CRÍTICAS PARA IMPRESSÃO EM FOLHA ÚNICA PAISAGEM */
        @media print {
          @page {
            size: A4 landscape;
            margin: 5mm 6mm 5mm 6mm;
          }
          html, body {
            width: 297mm !important;
            height: 210mm !important;
            max-height: 210mm !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
            background: #ffffff !important;
          }
          .print-actions {
            display: none !important;
          }
          .container {
            width: 100% !important;
            max-width: 100% !important;
            height: 100% !important;
            max-height: 200mm !important;
            padding: 0 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            overflow: hidden !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
          }
          table, tr, td, th {
            page-break-inside: avoid !important;
          }
        }
      </style>
    </head>
    <body>
      <!-- Barra de Ações no Navegador -->
      <div class="print-actions">
        <span><strong>SIGER Master</strong> • Emissão Oficial de Laudo Técnico Pericial de Rodagem & Metrologia (A4 Paisagem • Folha Única)</span>
        <button class="btn-print" onclick="window.print()">🖨️ IMPRIMIR / SALVAR EM PDF (PAISAGEM)</button>
      </div>

      <div class="container">
        <!-- 1. Cabeçalho Oficial -->
        <div class="header">
          <div class="header-logo">
            <div class="logo-box">
              <span class="logo-main">SIGER</span>
              <span class="logo-sub">MASTER</span>
            </div>
            <div class="header-titles">
              <h1>Laudo Técnico Pericial de Rodagem & Metrologia</h1>
              <p>Auditoria de Conformidade Normativa • Resolução CONTRAN nº 558/80 • Art. 230 CTB • SIGER Master Gestão de Frotas</p>
            </div>
          </div>
          <div class="header-protocol">
            <div class="badge-doc">LAUDO PERICIAL • A4 PAISAGEM</div>
            <div><strong>Emissão:</strong> ${dataHoraEmissao}</div>
            <div><strong>Contrato:</strong> ${inspecao.contrato_id}</div>
          </div>
        </div>

        <!-- 2. Linha Dupla: Identificação da Viatura (CRLV) + 4 KPIs Metrológicos -->
        <div class="row-vtr-kpis">
          <!-- Card Veículo (Esquerda) -->
          <div class="card-veiculo">
            <h3>
              <span>Identificação Técnica da Viatura (CRLV Oficial)</span>
              <span class="status-pill ${inspecao.status_geral_twi === 'CONFORME' ? 'status-ok' : 'status-alerta'}">
                STATUS: ${inspecao.status_geral_twi || 'CONFORME'}
              </span>
            </h3>
            <div class="grid-veiculo">
              <div class="grid-item">
                <span>Prefixo Operacional</span>
                <strong>${viatura.prefixo_frota}</strong>
              </div>
              <div class="grid-item">
                <span>Placa Oficial Mercosul</span>
                <strong>${viatura.placa}</strong>
              </div>
              <div class="grid-item">
                <span>Marca / Modelo Homologado</span>
                <strong>${viatura.marca_modelo_crlv || `${viatura.marca} ${viatura.modelo}`}</strong>
              </div>
              <div class="grid-item">
                <span>Número de Chassi</span>
                <strong>${viatura.chassi || 'NÃO CONSTA'}</strong>
              </div>
              <div class="grid-item">
                <span>Odômetro Registrado</span>
                <strong>${(inspecao.odometro_km || viatura.odometro_atual_km || 0).toLocaleString('pt-BR')} km</strong>
              </div>
              <div class="grid-item">
                <span>Calibração Efetuada</span>
                <strong>${inspecao.houve_calibracao ? 'SIM (CONFORME)' : 'NÃO REALIZADA'}</strong>
              </div>
              <div class="grid-item">
                <span>Técnico Responsável</span>
                <strong>${inspecao.tecnico_nome || responsavelNome}</strong>
              </div>
              <div class="grid-item">
                <span>Regulamentação Vigente</span>
                <strong>CONTRAN 558/80 (TWI 1.60 mm)</strong>
              </div>
            </div>
          </div>

          <!-- Painel 4 KPIs no Topo (Direita) -->
          <div class="kpi-grid">
            <div class="kpi-card">
              <div class="kpi-label">Média Vida Útil</div>
              <div class="kpi-value" style="color: ${Number(mediaVidaUtil) < 30 ? '#dc2626' : Number(mediaVidaUtil) < 50 ? '#d97706' : '#16a34a'};">
                ${mediaVidaUtil}%
              </div>
              <div class="kpi-sub">Borracha restante da frota</div>
            </div>

            <div class="kpi-card">
              <div class="kpi-label">Pneu Crítico</div>
              <div class="kpi-value" style="color: ${pneuMaisCritico && (pneuMaisCritico.profundidade_sulco_mm || 0) <= 1.6 ? '#dc2626' : '#0f172a'}; font-size: 10px;">
                ${pneuMaisCritico ? `${pneuMaisCritico.posicao_pneu} • ${(pneuMaisCritico.profundidade_sulco_mm || 0).toFixed(1)} mm` : 'N/A'}
              </div>
              <div class="kpi-sub">${pneuMaisCritico ? `Vida útil: ${(pneuMaisCritico.percentual_vida_util || 0).toFixed(1)}%` : 'Sem medição'}</div>
            </div>

            <div class="kpi-card">
              <div class="kpi-label">Pressão Pneumática</div>
              <div class="kpi-value" style="font-size: 9.5px; padding-top: 1px;">
                ${conformidadePressaoTexto}
              </div>
              <div class="kpi-sub">Aderência aos padrões</div>
            </div>

            <div class="kpi-card" style="background: ${parecerGeral.bg}; border-color: ${parecerGeral.border};">
              <div class="kpi-label" style="color: ${parecerGeral.color};">Parecer Geral</div>
              <div class="kpi-value" style="font-size: 8.5px; color: ${parecerGeral.color}; line-height: 1.15;">
                ${parecerGeral.status}
              </div>
              <div class="kpi-sub" style="color: ${parecerGeral.color};">${parecerGeral.subtitulo}</div>
            </div>
          </div>
        </div>

        <!-- 3. Matriz Metrológica Comparativa: Especificações de Fábrica vs. Aferição Operacional -->
        <div class="section-header-compact">
          <span class="section-title">Matriz Metrológica Comparativa: Especificações de Fábrica vs. Aferição Operacional</span>
          <span class="section-sub">Limite Mandatório: 1,60 mm (TWI) • Resolução CONTRAN nº 558/80</span>
        </div>
        <table>
          <thead>
            <tr>
              <th style="width: 42px; text-align: center;">Posição</th>
              <th>Engenharia do Fabricante</th>
              <th style="width: 74px; text-align: center;">Sulco Fábrica (S<sub>orig</sub>)</th>
              <th style="width: 60px; text-align: center;">PSI Base</th>
              <th style="width: 74px; text-align: center;">Aferido (S<sub>medido</sub>)</th>
              <th style="width: 65px; text-align: center;">Pressão Real</th>
              <th style="width: 74px; text-align: center;">Desgaste (Δ)</th>
              <th style="width: 74px; text-align: center;">Saldo até TWI</th>
              <th style="width: 75px; text-align: center;">Vida Útil (% V<sub>útil</sub>)</th>
              <th style="width: 105px; text-align: center;">Parecer Legal</th>
            </tr>
          </thead>
          <tbody>
            ${rowsComparativasHtml}
          </tbody>
        </table>

        <!-- 4. Linha Inferior: Memória de Cálculo + Glossário Técnico + Assinaturas de Responsabilidade -->
        <div class="row-bottom-grid">
          <!-- Coluna 1: Memória de Cálculo Formal -->
          <div class="card-calculo">
            <h4>Memória de Cálculo Metrológico & Auditoria Técnica</h4>
            <div class="formula-box">
              <div><strong>1. Borracha Útil:</strong> B<sub>útil</sub> = S<sub>orig</sub> - 1,60 mm = [${sOrigDem} mm] - 1,60 mm = <strong>${bUtilDem} mm</strong></div>
              <div><strong>2. Margem ao TWI:</strong> Saldo = S<sub>medido</sub> - 1,60 mm = [${sMedidoDem} mm] - 1,60 mm = <strong>${saldoDem} mm</strong></div>
              <div><strong>3. Equação Formal de Vida Útil Restante:</strong></div>
              <div style="padding-left: 6px;">% V<sub>útil</sub> = ((${sMedidoDem} - 1,60) / (${sOrigDem} - 1,60)) × 100 = <strong>${vidaUtilDem}%</strong></div>
            </div>
            <p class="formula-obs">
              * O ressalto de 1,60 mm (TWI) delimita o fim da vida útil legal. Pneus ≤ 1,60 mm configuram infração grave e retenção imediata do veículo (Art. 230 CTB).
            </p>
          </div>

          <!-- Coluna 2: Glossário Técnico Normativo -->
          <div class="glossario-card">
            <div class="glossario-header">
              <span class="glossario-title">GLOSSÁRIO TÉCNICO & DEFINIÇÕES NORMATIVAS</span>
              <span class="glossario-norma">CONTRAN 558/80 • CTB 230 • ABNT NBR NM 225</span>
            </div>
            <div class="glossario-grid">
              <div class="glossario-item">
                <strong>TWI:</strong> Ressalto vulcanizado a <strong>1,60 mm</strong> nos sulcos. Limite legal mínimo.
              </div>
              <div class="glossario-item">
                <strong>PSI:</strong> Pound-force per Square Inch. Pressão pneumática de carga e aderência.
              </div>
              <div class="glossario-item">
                <strong>S<sub>orig</sub>:</strong> Sulco nominal fornecido pelo fabricante para pneu novo (0 km).
              </div>
              <div class="glossario-item">
                <strong>S<sub>medido</sub>:</strong> Medição física obtida com profundímetro digital metrológico.
              </div>
              <div class="glossario-item">
                <strong>B<sub>útil</sub>:</strong> Borracha consumível útil (S<sub>orig</sub> - 1,60 mm).
              </div>
              <div class="glossario-item">
                <strong>Δ<sub>desgaste</sub>:</strong> Espessura degradada pelo atrito (S<sub>orig</sub> - S<sub>medido</sub>).
              </div>
              <div class="glossario-item" style="grid-column: span 2;">
                <strong>Perfis de Terreno:</strong> <strong>H/T:</strong> 80% Asfalto / 20% Terra • <strong>A/T:</strong> 50% / 50% Misto • <strong>R/T:</strong> 35% Asfalto / 65% Rochoso • <strong>M/T:</strong> 20% Asfalto / 80% Lama.
              </div>
            </div>
          </div>

          <!-- Coluna 3: Assinaturas de Responsabilidade Técnica -->
          <div class="signatures-card">
            <div class="sign-box">
              <div class="sign-line"></div>
              <div class="sign-title">${inspecao.tecnico_nome || 'Inspetor Metrológico de Campo'}</div>
              <div class="sign-sub">Técnico em Metrologia • SIGER Master</div>
            </div>
            <div class="sign-box" style="margin-top: 10px;">
              <div class="sign-line"></div>
              <div class="sign-title">${responsavelNome}</div>
              <div class="sign-sub">Gestor Operacional • SIGER Master</div>
            </div>
            <div class="doc-auth-stamp">
              AUTENTICIDADE CONFORME SISTEMA SIGER MASTER
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
