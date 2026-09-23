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
 * Padrão Corporativo de Romaneios e Laudos Periciais do SPCI Master
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

    // Barra gráfica colorida de vida útil
    const barColor = isCritico ? '#dc2626' : isAtencao ? '#f59e0b' : '#10b981';

    return `
      <tr style="${rowBg}">
        <td style="text-align: center; font-weight: 800; font-family: monospace; color: #0f172a; font-size: 11px;">
          <span style="display: block; font-size: 12px; color: #af101a;">${item.posicao_pneu}</span>
          <span style="font-size: 8px; color: #64748b; text-transform: uppercase;">
            ${item.posicao_pneu === 'DE' ? 'Diant. Esq.' : item.posicao_pneu === 'DD' ? 'Diant. Dir.' : item.posicao_pneu === 'TE' ? 'Tras. Esq.' : item.posicao_pneu === 'TD' ? 'Tras. Dir.' : 'Estepe'}
          </span>
        </td>
        <td>
          <div style="font-weight: 800; color: #0f172a; font-size: 10.5px;">${item.marca || 'CHENGSHAN'} ${item.modelo || 'MASPIRE M/T'}</div>
          <div style="font-family: monospace; color: #475569; font-size: 9.5px; margin-top: 1px;">
            ${item.medida || 'LT265/65 R17'}
            <span style="display: inline-block; padding: 1px 5px; border-radius: 4px; font-weight: bold; font-size: 8.5px; margin-left: 4px; ${terrainBadgeColor}">
              ${tipoTerreno}
            </span>
          </div>
        </td>
        <td style="text-align: center; font-family: monospace; font-size: 10px;">
          <div><strong>${sOrig.toFixed(2)}</strong> mm</div>
          <div style="font-size: 8.5px; color: #64748b;">(B_útil: ${bUtil.toFixed(2)} mm)</div>
        </td>
        <td style="text-align: center; font-family: monospace; font-size: 10px; color: #475569;">
          ${pressaoNominal.toFixed(0)} PSI
        </td>
        <td style="text-align: center; font-family: monospace; font-size: 11px; font-weight: 800; color: ${isCritico ? '#dc2626' : isAtencao ? '#d97706' : '#16a34a'};">
          ${sMedido.toFixed(2)} mm
        </td>
        <td style="text-align: center; font-family: monospace; font-size: 10px;">
          <strong>${pressaoReal.toFixed(1)}</strong> PSI
          <span style="font-size: 8.5px; color: ${Math.abs(desvioPsi) <= 1.0 ? '#16a34a' : '#d97706'};">
            (${desvioPsi >= 0 ? '+' : ''}${desvioPsi.toFixed(1)})
          </span>
        </td>
        <td style="text-align: center; font-family: monospace; font-size: 10px; color: #64748b;">
          <div>${deltaDesgaste.toFixed(2)} mm</div>
          <div style="font-size: 8.5px; color: #af101a;">(${percentualGasto}% gasto)</div>
        </td>
        <td style="text-align: center; font-family: monospace; font-size: 10.5px; font-weight: bold; color: ${isCritico ? '#dc2626' : '#0f172a'};">
          ${saldoTwi.toFixed(2)} mm
        </td>
        <td style="text-align: center; width: 85px;">
          <div style="font-weight: 800; font-family: monospace; font-size: 10.5px; color: ${isCritico ? '#dc2626' : '#0f172a'};">
            ${vidaUtil.toFixed(1)}%
          </div>
          <div style="width: 100%; height: 5px; background: #e2e8f0; border-radius: 3px; overflow: hidden; margin-top: 3px;">
            <div style="width: ${Math.min(100, Math.max(0, vidaUtil))}%; height: 100%; background: ${barColor};"></div>
          </div>
        </td>
        <td style="text-align: center;">
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
        @page {
          size: A4 portrait;
          margin: 10mm 12mm 10mm 12mm;
        }
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        body {
          font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Arial, sans-serif;
          color: #0f172a;
          font-size: 10.5px;
          line-height: 1.35;
          background-color: #ffffff;
        }
        .container {
          width: 100%;
          max-width: 100%;
        }
        
        /* Cabeçalho Oficial */
        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 3px solid #af101a;
          padding-bottom: 10px;
          margin-bottom: 12px;
        }
        .header-logo {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .logo-box {
          background-color: #af101a;
          color: #ffffff;
          padding: 8px 14px;
          font-weight: 900;
          font-size: 18px;
          letter-spacing: 1.5px;
          border-radius: 6px;
          font-family: monospace;
        }
        .header-titles h1 {
          font-size: 14px;
          font-weight: 800;
          color: #0f172a;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .header-titles p {
          font-size: 9.5px;
          color: #64748b;
          font-weight: 600;
        }
        .header-protocol {
          text-align: right;
          font-family: monospace;
          font-size: 9.5px;
        }
        .header-protocol .badge-doc {
          background-color: #f1f5f9;
          border: 1px solid #cbd5e1;
          color: #334155;
          padding: 2px 7px;
          border-radius: 4px;
          font-weight: bold;
          display: inline-block;
          margin-bottom: 3px;
        }

        /* Ficha Técnica da Viatura */
        .card-veiculo {
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 9px 12px;
          background-color: #f8fafc;
          margin-bottom: 12px;
        }
        .card-veiculo h3 {
          font-size: 10.5px;
          text-transform: uppercase;
          font-weight: 800;
          color: #af101a;
          margin-bottom: 6px;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 3px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .grid-veiculo {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 6px 12px;
          font-size: 10px;
        }
        .grid-item span {
          display: block;
          font-size: 8.5px;
          color: #64748b;
          text-transform: uppercase;
          font-weight: 700;
        }
        .grid-item strong {
          color: #0f172a;
          font-family: monospace;
          font-size: 10.5px;
        }

        /* Painel de 4 KPIs no Topo da Seção Metrológica */
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          margin-bottom: 12px;
        }
        .kpi-card {
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 8px 10px;
          background: #ffffff;
        }
        .kpi-label {
          font-size: 8.5px;
          font-weight: 700;
          text-transform: uppercase;
          color: #64748b;
          margin-bottom: 3px;
        }
        .kpi-value {
          font-family: monospace;
          font-size: 14px;
          font-weight: 900;
          color: #0f172a;
        }
        .kpi-sub {
          font-size: 8.5px;
          color: #64748b;
          margin-top: 2px;
        }

        /* Matriz Comparativa */
        .section-title {
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          color: #0f172a;
          margin-bottom: 6px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 12px;
        }
        th {
          background-color: #0f172a;
          color: #ffffff;
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
          padding: 6px 6px;
          border: 1px solid #0f172a;
          letter-spacing: 0.2px;
        }
        td {
          padding: 5px 6px;
          border: 1px solid #e2e8f0;
          font-size: 9.5px;
        }

        /* Badges de Status */
        .badge {
          font-size: 8px;
          font-weight: 800;
          padding: 2px 5px;
          border-radius: 4px;
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

        /* Memória de Cálculo */
        .card-calculo {
          border: 1px solid #cbd5e1;
          border-left: 4px solid #af101a;
          border-radius: 6px;
          padding: 8px 12px;
          background-color: #f8fafc;
          margin-bottom: 12px;
        }
        .card-calculo h4 {
          font-size: 10px;
          text-transform: uppercase;
          color: #0f172a;
          font-weight: 800;
          margin-bottom: 4px;
        }
        .formula-box {
          background-color: #ffffff;
          border: 1px solid #e2e8f0;
          padding: 6px 10px;
          border-radius: 4px;
          font-family: monospace;
          font-size: 9.5px;
          color: #0f172a;
          margin-bottom: 4px;
          line-height: 1.45;
        }
        .formula-box strong {
          color: #af101a;
        }

        /* Glossário Normativo de Rodapé */
        .glossario-card {
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 8px 12px;
          background: #fdfefe;
          margin-bottom: 12px;
        }
        .glossario-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 4px;
          margin-bottom: 6px;
        }
        .glossario-title {
          font-size: 9.5px;
          font-weight: 800;
          text-transform: uppercase;
          color: #0f172a;
        }
        .glossario-norma {
          font-size: 8.5px;
          color: #64748b;
          font-family: monospace;
        }
        .glossario-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 5px 12px;
          font-size: 8.5px;
          color: #334155;
          line-height: 1.3;
        }
        .glossario-item strong {
          color: #0f172a;
        }

        /* Assinaturas */
        .signatures {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 40px;
          margin-top: 18px;
          padding-top: 8px;
        }
        .sign-box {
          text-align: center;
        }
        .sign-line {
          border-top: 1px solid #475569;
          margin-bottom: 4px;
        }
        .sign-title {
          font-weight: bold;
          font-size: 10px;
          color: #0f172a;
        }
        .sign-sub {
          font-size: 8.5px;
          color: #64748b;
        }

        /* Barra de Ações para Impressão */
        .print-actions {
          background-color: #0f172a;
          color: #ffffff;
          padding: 8px 16px;
          border-radius: 8px;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .btn-print {
          background-color: #dc2626;
          color: #ffffff;
          border: none;
          padding: 7px 16px;
          font-weight: bold;
          border-radius: 6px;
          cursor: pointer;
          font-size: 11px;
        }
        @media print {
          .print-actions {
            display: none;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      </style>
    </head>
    <body>
      <!-- Barra de Ações no Navegador -->
      <div class="print-actions">
        <span><strong>SPCI Master</strong> • Visualizador Oficial de Laudo Pericial de Rodagem</span>
        <button class="btn-print" onclick="window.print()">🖨️ IMPRIMIR / SALVAR EM PDF</button>
      </div>

      <div class="container">
        <!-- Cabeçalho Oficial -->
        <div class="header">
          <div class="header-logo">
            <div class="logo-box">SPCI</div>
            <div class="header-titles">
              <h1>Laudo Técnico Pericial de Rodagem & Metrologia</h1>
              <p>Auditoria de Conformidade Normativa • Resolução CONTRAN nº 558/80 • Art. 230 CTB</p>
            </div>
          </div>
          <div class="header-protocol">
            <div class="badge-doc">LAUDO TÉCNICO PERICIAL</div>
            <div><strong>Emissão:</strong> ${dataHoraEmissao}</div>
            <div><strong>Contrato:</strong> ${inspecao.contrato_id}</div>
          </div>
        </div>

        <!-- Ficha Técnica da Viatura (CRLV Oficial) -->
        <div class="card-veiculo">
          <h3>
            <span>Identificação Técnica da Viatura (CRLV Oficial)</span>
            <span style="font-family: monospace; color: #475569;">STATUS: ${inspecao.status_geral_twi}</span>
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
              <strong>${viatura.chassi || 'NÃO CONSTA NO SISTEMA'}</strong>
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

        <!-- Painel Sintético de 4 KPIs Metrológicos -->
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-label">Média de Vida Útil</div>
            <div class="kpi-value" style="color: ${Number(mediaVidaUtil) < 30 ? '#dc2626' : Number(mediaVidaUtil) < 50 ? '#d97706' : '#16a34a'};">
              ${mediaVidaUtil}%
            </div>
            <div class="kpi-sub">Borracha restante da frota</div>
          </div>

          <div class="kpi-card">
            <div class="kpi-label">Pneu Mais Crítico</div>
            <div class="kpi-value" style="color: ${pneuMaisCritico && (pneuMaisCritico.profundidade_sulco_mm || 0) <= 1.6 ? '#dc2626' : '#0f172a'};">
              ${pneuMaisCritico ? `${pneuMaisCritico.posicao_pneu} • ${(pneuMaisCritico.profundidade_sulco_mm || 0).toFixed(1)} mm` : 'N/A'}
            </div>
            <div class="kpi-sub">${pneuMaisCritico ? `Vida útil: ${(pneuMaisCritico.percentual_vida_util || 0).toFixed(1)}%` : 'Sem medição'}</div>
          </div>

          <div class="kpi-card">
            <div class="kpi-label">Pressão Pneumática</div>
            <div class="kpi-value" style="font-size: 12px; padding-top: 2px;">
              ${conformidadePressaoTexto}
            </div>
            <div class="kpi-sub">Calibração nominal atendida</div>
          </div>

          <div class="kpi-card" style="background: ${parecerGeral.bg}; border-color: ${parecerGeral.border};">
            <div class="kpi-label" style="color: ${parecerGeral.color};">Parecer Geral</div>
            <div class="kpi-value" style="font-size: 11px; color: ${parecerGeral.color}; line-height: 1.2;">
              ${parecerGeral.status}
            </div>
            <div class="kpi-sub" style="color: ${parecerGeral.color};">${parecerGeral.subtitulo}</div>
          </div>
        </div>

        <!-- 3. MATRIZ METROLÓGICA COMPARATIVA: ESPECIFICAÇÕES DO FABRICANTE VS. AFERIÇÃO OPERACIONAL -->
        <div class="section-title">
          <span>Matriz Metrológica Comparativa: Especificações de Fábrica vs. Aferição Operacional</span>
          <span style="font-size: 9px; font-weight: normal; color: #64748b;">Limite Mandatório: 1,60 mm (TWI)</span>
        </div>
        <table>
          <thead>
            <tr>
              <th style="width: 48px; text-align: center;">Posição</th>
              <th>Engenharia do Fabricante</th>
              <th style="width: 75px; text-align: center;">Sulco Fábrica (S_orig)</th>
              <th style="width: 65px; text-align: center;">PSI Base</th>
              <th style="width: 75px; text-align: center;">Aferido (S_medido)</th>
              <th style="width: 65px; text-align: center;">Pressão Real</th>
              <th style="width: 75px; text-align: center;">Desgaste (Δ)</th>
              <th style="width: 75px; text-align: center;">Saldo até TWI</th>
              <th style="width: 85px; text-align: center;">Vida Útil (% V_útil)</th>
              <th style="width: 110px; text-align: center;">Parecer Legal</th>
            </tr>
          </thead>
          <tbody>
            ${rowsComparativasHtml}
          </tbody>
        </table>

        <!-- Memória de Cálculo & Parâmetros Metrológicos -->
        <div class="card-calculo">
          <h4>Memória de Cálculo Metrológico & Auditoria Técnica (Demonstrativo Formal)</h4>
          <p style="margin-bottom: 4px; font-size: 9.5px; color: #475569;">
            Demonstração matemática auditável da taxa de consumo de banda e percentual de vida útil restante:
          </p>
          <div class="formula-box">
            <strong>1. Borracha Operacional Útil de Projeto:</strong> B_útil = S_orig - 1,60 mm = [${sOrigDem} mm] - 1,60 mm = <strong>${bUtilDem} mm</strong><br>
            <strong>2. Margem de Segurança até o TWI Legal:</strong> Saldo = S_medido - 1,60 mm = [${sMedidoDem} mm] - 1,60 mm = <strong>${saldoDem} mm</strong><br>
            <strong>3. Equação Formal de Vida Útil Restante:</strong><br>
            % V_útil = ((S_medido - 1,60) / (S_orig - 1,60)) × 100 ⟹ (([${sMedidoDem}] - 1,60) / ([${sOrigDem}] - 1,60)) × 100 = <strong>${vidaUtilDem}%</strong>
          </div>
          <p style="font-size: 8.5px; color: #64748b; font-style: italic;">
            * O ressalto de 1,60 mm do TWI delimita o fim da vida útil legal. Pneus com sulcos iguais ou inferiores a 1,60 mm configuram infração de trânsito grave e risco crítico de aquaplanagem.
          </p>
        </div>

        <!-- GLOSSÁRIO TÉCNICO & DEFINIÇÕES NORMATIVAS -->
        <div class="glossario-card">
          <div class="glossario-header">
            <span class="glossario-title">GLOSSÁRIO TÉCNICO & DEFINIÇÕES NORMATIVAS METROLÓGICAS</span>
            <span class="glossario-norma">Resolução CONTRAN nº 558/80 • Art. 230 CTB • ABNT NBR NM 225</span>
          </div>
          <div class="glossario-grid">
            <div class="glossario-item">
              <strong>TWI (Tread Wear Indicator):</strong>
              Ressalto de borracha vulcanizado a <strong>1,60 mm</strong> de altura nos sulcos principais. Sulcos ≤ 1,60 mm acarretam retenção imediata da viatura e risco severo de aquaplanagem.
            </div>
            <div class="glossario-item">
              <strong>PSI (Pound-force per Square Inch):</strong>
              Unidade de pressão pneumática (1 PSI ≈ 0,0689 bar). Determina a calibração necessária para sustentação de carga, estabilidade direcional e aderência.
            </div>
            <div class="glossario-item">
              <strong>S_orig (Profundidade Nominal de Fábrica):</strong>
              Altura nominal do sulco fornecida pelo fabricante para o pneu novo (0 km), servindo como estaca zero metrológica.
            </div>
            <div class="glossario-item">
              <strong>S_medido (Profundidade Atual Aferida):</strong>
              Medição física obtida nos pontos de maior desgaste da banda de rodagem através de profundímetro digital metrológico.
            </div>
            <div class="glossario-item">
              <strong>B_útil (Borracha Operacional Útil):</strong>
              Borracha consumível entre o estado novo e a barreira mandatória legal: <em>B_útil = S_orig - 1,60 mm</em>.
            </div>
            <div class="glossario-item">
              <strong>Δ_desgaste (Desgaste Acumulado):</strong>
              Espessura de borracha degradada pelo atrito operacional da viatura: <em>Δ_desgaste = S_orig - S_medido</em>.
            </div>
            <div class="glossario-item">
              <strong>% V_útil (Vida Útil Restante):</strong>
              Percentual disponível até o TWI: <em>% V_útil = ((S_medido - 1,60) / (S_orig - 1,60)) × 100</em>.
            </div>
            <div class="glossario-item">
              <strong>Posições de Rodagem:</strong>
              <strong>DE:</strong> Dianteiro Esquerdo | <strong>DD:</strong> Dianteiro Direito | <strong>TE:</strong> Traseiro Esquerdo | <strong>TD:</strong> Traseiro Direito | <strong>ESTEPE:</strong> Reserva
            </div>
            <div class="glossario-item" style="grid-column: span 2;">
              <strong>Classificação de Terreno:</strong>
              <strong>H/T (Highway):</strong> 80% Asfalto / 20% Terra leve • 
              <strong>A/T (All-Terrain):</strong> 50% Asfalto / 50% Terra mista • 
              <strong>R/T (Rugged):</strong> 35% Asfalto / 65% Terreno severo/rochoso • 
              <strong>M/T (Mud-Terrain):</strong> 20% Asfalto / 80% Lama e solo fofo.
            </div>
          </div>
        </div>

        <!-- Assinaturas de Responsabilidade Técnica -->
        <div class="signatures">
          <div class="sign-box">
            <div class="sign-line"></div>
            <div class="sign-title">${inspecao.tecnico_nome || 'Inspetor Metrológico de Campo'}</div>
            <div class="sign-sub">Técnico em Metrologia e Segurança Veicular • SPCI Master</div>
          </div>
          <div class="sign-box">
            <div class="sign-line"></div>
            <div class="sign-title">${responsavelNome}</div>
            <div class="sign-sub">Gestor Operacional de Frota • Engenharia de Manutenção</div>
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
