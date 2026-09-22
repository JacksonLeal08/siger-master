import { InspecaoRodagemPneus, Viatura } from '@/lib/types/frota';
import { LIMITE_LEGAL_TWI_MM, LIMITE_ATENCAO_MM } from '@/lib/services/TireWearCalculator';

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

  // Linhas da Tabela de Medições
  const rowsHtml = itens.map((item, idx) => {
    const sOrig = Number(item.profundidade_original_mm || 0).toFixed(2);
    const sAferido = Number(item.profundidade_sulco_mm || 0).toFixed(2);
    const deltaDesgaste = Number(item.desgaste_acumulado_mm || 0).toFixed(2);
    const vidaUtil = Number(item.percentual_vida_util || 0).toFixed(1);
    const pressao = Number(item.pressao_psi || 0).toFixed(1);

    const isCritico = item.status_twi === 'CRITICO_PROIBIDO' || item.profundidade_sulco_mm <= LIMITE_LEGAL_TWI_MM;
    const isAtencao = item.status_twi === 'ATENCAO' || (item.profundidade_sulco_mm < LIMITE_ATENCAO_MM && !isCritico);

    const statusBadge = isCritico
      ? `<span class="badge badge-critico">NÃO CONFORME (CRÍTICO TWI)</span>`
      : isAtencao
      ? `<span class="badge badge-atencao">ATENÇÃO PREVENTIVA</span>`
      : `<span class="badge badge-conforme">CONFORME PLENO</span>`;

    const rowBg = isCritico ? 'background-color: #fef2f2;' : (idx % 2 === 0 ? 'background-color: #ffffff;' : 'background-color: #f8fafc;');

    return `
      <tr style="${rowBg}">
        <td style="text-align: center; font-weight: bold; font-family: monospace; color: #dc2626; font-size: 13px;">${item.posicao_pneu}</td>
        <td style="font-weight: bold; color: #0f172a;">${item.marca || 'MICHELIN'} ${item.modelo || 'LTX FORCE'}</td>
        <td style="font-family: monospace; color: #475569;">${item.medida || '265/65 R17'}</td>
        <td style="text-align: center; font-family: monospace;">${sOrig} mm</td>
        <td style="text-align: center; font-family: monospace; font-weight: bold; color: ${isCritico ? '#dc2626' : isAtencao ? '#d97706' : '#16a34a'}; font-size: 13px;">
          ${sAferido} mm
        </td>
        <td style="text-align: center; font-family: monospace; color: #64748b;">${deltaDesgaste} mm</td>
        <td style="text-align: center; font-weight: bold; color: ${isCritico ? '#dc2626' : '#0f172a'};">${vidaUtil}%</td>
        <td style="text-align: center; font-family: monospace;">${pressao} PSI</td>
        <td style="text-align: center;">${statusBadge}</td>
      </tr>
    `;
  }).join('');

  // Pneu de referência para a demonstração da fórmula
  const refItem = itens[0] || {
    profundidade_original_mm: 9.50,
    profundidade_sulco_mm: 4.20,
    percentual_vida_util: 32.91
  };
  const sOrigDem = Number(refItem.profundidade_original_mm).toFixed(2);
  const sAferidoDem = Number(refItem.profundidade_sulco_mm).toFixed(2);
  const bUtilDem = (refItem.profundidade_original_mm - 1.60).toFixed(2);
  const saldoDem = (refItem.profundidade_sulco_mm - 1.60).toFixed(2);
  const vidaUtilDem = Number(refItem.percentual_vida_util).toFixed(2);

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Laudo Técnico Pericial de Rodagem - ${viatura.prefixo_frota}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 12mm 15mm 12mm 15mm;
        }
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        body {
          font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Arial, sans-serif;
          color: #1e293b;
          font-size: 11px;
          line-height: 1.4;
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
          padding-bottom: 12px;
          margin-bottom: 14px;
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
          font-size: 15px;
          font-weight: 800;
          color: #0f172a;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .header-titles p {
          font-size: 10px;
          color: #64748b;
          font-weight: 600;
        }
        .header-protocol {
          text-align: right;
          font-family: monospace;
          font-size: 10px;
        }
        .header-protocol .badge-doc {
          background-color: #f1f5f9;
          border: 1px solid #cbd5e1;
          color: #334155;
          padding: 3px 8px;
          border-radius: 4px;
          font-weight: bold;
          display: inline-block;
          margin-bottom: 4px;
        }

        /* Ficha Técnica do Veículo (CRLV) */
        .card-veiculo {
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 10px 14px;
          background-color: #f8fafc;
          margin-bottom: 14px;
        }
        .card-veiculo h3 {
          font-size: 11px;
          text-transform: uppercase;
          font-weight: 800;
          color: #af101a;
          margin-bottom: 6px;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 4px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .grid-veiculo {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          font-size: 10.5px;
        }
        .grid-item span {
          display: block;
          font-size: 9px;
          color: #64748b;
          text-transform: uppercase;
          font-weight: 600;
        }
        .grid-item strong {
          color: #0f172a;
          font-family: monospace;
          font-size: 11px;
        }

        /* Tabela Pericial */
        .section-title {
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          color: #0f172a;
          margin-bottom: 6px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 14px;
        }
        th {
          background-color: #0f172a;
          color: #ffffff;
          font-size: 9.5px;
          font-weight: 700;
          text-transform: uppercase;
          padding: 6px 8px;
          text-align: left;
          border: 1px solid #0f172a;
          letter-spacing: 0.3px;
        }
        td {
          padding: 6px 8px;
          border: 1px solid #e2e8f0;
          font-size: 10px;
        }

        /* Badges de Status */
        .badge {
          font-size: 8.5px;
          font-weight: 800;
          padding: 2px 6px;
          border-radius: 4px;
          text-transform: uppercase;
          display: inline-block;
          font-family: monospace;
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
          padding: 10px 14px;
          background-color: #f8fafc;
          margin-bottom: 14px;
        }
        .card-calculo h4 {
          font-size: 10.5px;
          text-transform: uppercase;
          color: #0f172a;
          font-weight: 800;
          margin-bottom: 6px;
        }
        .formula-box {
          background-color: #ffffff;
          border: 1px solid #e2e8f0;
          padding: 8px 12px;
          border-radius: 4px;
          font-family: monospace;
          font-size: 10px;
          color: #0f172a;
          margin-bottom: 6px;
        }
        .formula-box strong {
          color: #af101a;
        }

        /* Fundamentação Legal */
        .legal-notice {
          font-size: 9.5px;
          color: #475569;
          background-color: #f1f5f9;
          border: 1px solid #e2e8f0;
          padding: 8px 12px;
          border-radius: 6px;
          margin-bottom: 18px;
          text-align: justify;
        }

        /* Assinaturas */
        .signatures {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 40px;
          margin-top: 25px;
          padding-top: 10px;
        }
        .sign-box {
          text-align: center;
        }
        .sign-line {
          border-top: 1px solid #475569;
          margin-bottom: 6px;
        }
        .sign-title {
          font-weight: bold;
          font-size: 10.5px;
          color: #0f172a;
        }
        .sign-sub {
          font-size: 9px;
          color: #64748b;
        }

        /* Barra de Ações para Impressão */
        .print-actions {
          background-color: #0f172a;
          color: #ffffff;
          padding: 10px 16px;
          border-radius: 8px;
          margin-bottom: 15px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .btn-print {
          background-color: #dc2626;
          color: #ffffff;
          border: none;
          padding: 8px 18px;
          font-weight: bold;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
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

        <!-- Ficha Técnica do Veículo -->
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
              <strong>CONTRAN 558/80 (TWI 1.6mm)</strong>
            </div>
          </div>
        </div>

        <!-- Quadro Pericial dos 5 Pneus -->
        <div class="section-title">
          Quadro Metrológico Analítico das 5 Posições de Rodagem
        </div>
        <table>
          <thead>
            <tr>
              <th style="width: 50px; text-align: center;">Posição</th>
              <th>Pneu / Modelo Homologado</th>
              <th style="width: 90px;">Medida</th>
              <th style="width: 70px; text-align: center;">S_orig</th>
              <th style="width: 75px; text-align: center;">S_aferido</th>
              <th style="width: 75px; text-align: center;">Δ_desgaste</th>
              <th style="width: 65px; text-align: center;">% V_útil</th>
              <th style="width: 65px; text-align: center;">Pressão</th>
              <th style="width: 140px; text-align: center;">Parecer Legal</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <!-- Memória de Cálculo & Parâmetros Metrológicos -->
        <div class="card-calculo">
          <h4>Memória de Cálculo Metrológico & Auditoria Técnica (Demonstrativo Formal)</h4>
          <p style="margin-bottom: 6px; font-size: 10px; color: #475569;">
            Demonstração matemática transparente da taxa de desgaste e vida útil restante baseada no limite regulamentar de segurança:
          </p>
          <div class="formula-box">
            <strong>1. Faixa Operacional Útil:</strong> B_útil = S_orig - 1,60 mm = [${sOrigDem}] - 1,60 = <strong>${bUtilDem} mm</strong><br>
            <strong>2. Borracha Restante Legal:</strong> Saldo = S_aferido - 1,60 mm = [${sAferidoDem}] - 1,60 = <strong>${saldoDem} mm</strong><br>
            <strong>3. Demonstração Formal da Equação:</strong><br>
            Vida Útil (%) = ((S_aferido - 1,60) / (S_orig - 1,60)) × 100 ⟹ (([${sAferidoDem}] - 1,60) / ([${sOrigDem}] - 1,60)) × 100 = <strong>${vidaUtilDem}%</strong>
          </div>
          <p style="font-size: 9px; color: #64748b; font-style: italic;">
            * Nota: O limite de 1,60 mm corresponde ao ressalto do TWI (Tread Wear Indicator). Valores inferiores constituem infração grave com risco severo de aquaplanagem.
          </p>
        </div>

        <!-- Parecer Normativo e Fundamentação Legal -->
        <div class="legal-notice">
          <strong>FUNDAMENTAÇÃO TÉCNICA E LEGAL:</strong><br>
          A presente vistoria atende rigorosamente aos critérios técnicos estabelecidos pela <strong>Resolução CONTRAN nº 558/80</strong>, que proíbe a circulação de veículos com profundidade de sulcos inferior a 1,6 mm em qualquer ponto da banda de rodagem. Conforme o Artigo 230, Inciso XVIII do Código de Trânsito Brasileiro (CTB), veículos operando com pneus desgastados até ou além do TWI estão sujeitos a autuação, perda de pontos e retenção veicular até a devida regularização.
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
