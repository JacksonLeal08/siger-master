import { ChecklistVeicular } from './types/frota';

/**
 * Gera e abre em nova janela o Laudo Pericial Veicular formatado para impressão / exportação em PDF,
 * contendo cabeçalho institucional SIGER Master, dados do veículo, checklist discriminado e galeria lado a lado das fotos.
 */
export function emitirLaudoChecklistPdf(checklist: ChecklistVeicular): void {
  if (typeof window === 'undefined') return;

  const viatura = checklist.viatura;
  const printWindow = window.open('', '_blank', 'width=1000,height=900');
  if (!printWindow) {
    alert('Por favor, permita pop-ups para emitir o Laudo Pericial em PDF.');
    return;
  }

  const dataFormatada = new Date(checklist.created_at || new Date()).toLocaleString('pt-BR');
  const statusColor = 
    checklist.status_aprovacao === 'INTERDITADO' ? '#dc2626' :
    checklist.status_aprovacao === 'ATENCAO' ? '#d97706' : '#059669';

  const statusLabel = 
    checklist.status_aprovacao === 'INTERDITADO' ? 'INTERDITADO / CRÍTICO' :
    checklist.status_aprovacao === 'ATENCAO' ? 'REQUER MANUTENÇÃO (ATENÇÃO)' : 'APROVADO / EM CONFORMIDADE';

  // Separar não conformidades para a galeria de evidências
  const itensNaoConformes = checklist.itens?.filter(
    i => i.parecer === 'NAO_CONFORME'
  ) || [];

  // Agrupamento hierárquico por sistemas mestres
  const sistemasOrdem = ['FREIOS', 'SUSPENSAO', 'MOTOR_CAMBIO', 'ELETRICA', 'ILUMINACAO', 'PNEUS', 'EQUIPAMENTOS', 'IMPLEMENTOS_ESPECIFICOS'];
  const sistemasNomes: Record<string, string> = {
    FREIOS: '🛑 1. SISTEMA DE FREIOS & CIRCUITO HIDRÁULICO',
    SUSPENSAO: '🔩 2. SISTEMA DE SUSPENSÃO & DIREÇÃO',
    MOTOR_CAMBIO: '⚙️ 3. MOTOR, TRANSMISSÃO & ARREFECIMENTO',
    ELETRICA: '⚡ 4. SISTEMA ELÉTRICO & ELETRÔNICO',
    ILUMINACAO: '💡 5. ILUMINAÇÃO & SINALIZAÇÃO DE EMERGÊNCIA',
    PNEUS: '🛞 6. PNEUS, RODAS & ÍNDICE TWI',
    EQUIPAMENTOS: '🦺 7. EQUIPAMENTOS DE BORDO & SEGURANÇA',
    IMPLEMENTOS_ESPECIFICOS: '🚒 8. IMPLEMENTOS ESPECÍFICOS DE EMERGÊNCIA'
  };

  const gruposMap: Record<string, any[]> = {};
  (checklist.itens || []).forEach(item => {
    const s = item.sistema_grupo || 'EQUIPAMENTOS';
    if (!gruposMap[s]) gruposMap[s] = [];
    gruposMap[s].push(item);
  });

  const tabelaLinhasHtml = Object.keys(gruposMap).length === 0
    ? '<tr><td colspan="3" style="text-align:center; padding: 12px; color: #64748b;">Nenhum item discriminado neste laudo.</td></tr>'
    : Object.keys(gruposMap)
        .sort((a, b) => (sistemasOrdem.indexOf(a) >= 0 ? sistemasOrdem.indexOf(a) : 99) - (sistemasOrdem.indexOf(b) >= 0 ? sistemasOrdem.indexOf(b) : 99))
        .map(grupo => {
          const itens = gruposMap[grupo] || [];
          const nomeGrupo = sistemasNomes[grupo] || grupo;
          const headerRow = `
            <tr class="master-system-row">
              <td colspan="3">${nomeGrupo} (${itens.length} itens auditados)</td>
            </tr>
          `;
          const itemRows = itens.map((item, idx) => `
            <tr class="${item.parecer === 'NAO_CONFORME' ? 'row-nc' : ''}">
              <td style="padding-left: 20px; font-weight: ${item.parecer === 'NAO_CONFORME' ? '700' : '500'};">
                ${idx + 1}. ${item.item_nome}
                ${item.observacao_anomalia && item.parecer === 'NAO_CONFORME' ? `<br><small style="color: #991b1b; font-style: italic;">Relato: ${item.observacao_anomalia}</small>` : ''}
              </td>
              <td style="text-align: center;">
                <span class="${
                  item.parecer === 'CONFORME' ? 'parecer-c' :
                  item.parecer === 'NAO_CONFORME' ? 'parecer-nc' : 'parecer-na'
                }">
                  ${item.parecer}
                </span>
              </td>
              <td style="text-align: center;">
                ${item.gravidade_anomalia ? `<strong>${item.gravidade_anomalia}</strong>` : '-'}
              </td>
            </tr>
          `).join('');
          return headerRow + itemRows;
        }).join('');

  const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR" translate="no">
<head>
  <meta charset="utf-8" />
  <meta name="google" content="notranslate" />
  <title>Laudo Pericial Veicular - ${viatura?.prefixo_frota || 'Viatura'} (${viatura?.placa || ''})</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 15mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 20px;
      font-size: 11px;
      line-height: 1.4;
    }
    .header-table {
      width: 100%;
      border-collapse: collapse;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 12px;
      margin-bottom: 15px;
    }
    .brand-title {
      font-size: 18px;
      font-weight: 900;
      color: #b91c1c;
      letter-spacing: -0.5px;
      margin: 0;
      text-transform: uppercase;
    }
    .brand-subtitle {
      font-size: 9px;
      color: #475569;
      font-weight: 700;
      letter-spacing: 1px;
      margin: 2px 0 0 0;
      text-transform: uppercase;
    }
    .doc-title {
      text-align: right;
      font-size: 13px;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
      text-transform: uppercase;
    }
    .doc-meta {
      text-align: right;
      font-size: 9px;
      color: #64748b;
      font-family: monospace;
    }
    .section-title {
      font-size: 10px;
      font-weight: 900;
      color: #0f172a;
      text-transform: uppercase;
      background: #f1f5f9;
      padding: 5px 8px;
      border-left: 3px solid #b91c1c;
      margin: 12px 0 6px 0;
      letter-spacing: 0.5px;
    }
    .grid-info {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 10px;
    }
    .grid-info td {
      padding: 4px 6px;
      border: 1px solid #e2e8f0;
      font-size: 10px;
    }
    .grid-info .label {
      background: #f8fafc;
      font-weight: 700;
      color: #475569;
      width: 25%;
    }
    .grid-info .val {
      color: #0f172a;
      font-weight: 600;
    }
    .status-badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 4px;
      color: #ffffff;
      font-weight: 800;
      font-size: 11px;
      background: ${statusColor};
      text-transform: uppercase;
    }
    .checklist-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 15px;
      font-size: 9.5px;
    }
    .checklist-table th {
      background: #0f172a;
      color: #ffffff;
      font-weight: 700;
      padding: 6px;
      text-align: left;
      text-transform: uppercase;
      font-size: 8.5px;
    }
    .checklist-table td {
      padding: 5px 6px;
      border-bottom: 1px solid #e2e8f0;
    }
    .master-system-row td {
      background: #e2e8f0 !important;
      color: #0f172a !important;
      font-weight: 800 !important;
      font-size: 9px !important;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 6px 8px !important;
      border-top: 2px solid #94a3b8 !important;
      border-bottom: 1px solid #cbd5e1 !important;
    }
    .row-nc td {
      background: #fef2f2 !important;
      color: #991b1b;
    }
    .checklist-table tr:nth-child(even) {
      background: #f8fafc;
    }
    .parecer-c { color: #059669; font-weight: 800; }
    .parecer-nc { color: #dc2626; font-weight: 800; }
    .parecer-na { color: #64748b; font-weight: 600; }

    /* Galeria Dual-Photo */
    .anomaly-card {
      border: 1px solid #f87171;
      border-radius: 6px;
      padding: 8px;
      margin-bottom: 12px;
      background: #fff5f5;
      page-break-inside: avoid;
    }
    .anomaly-header {
      font-weight: 800;
      font-size: 10.5px;
      color: #b91c1c;
      margin-bottom: 4px;
    }
    .anomaly-desc {
      font-size: 9.5px;
      color: #334155;
      margin-bottom: 8px;
      font-style: italic;
    }
    .dual-photo-table {
      width: 100%;
      border-collapse: collapse;
    }
    .dual-photo-table td {
      width: 50%;
      padding: 4px;
      text-align: center;
      vertical-align: top;
    }
    .photo-frame {
      width: 100%;
      height: 180px;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      overflow: hidden;
      background: #000;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .photo-frame img {
      max-width: 100%;
      max-height: 180px;
      object-fit: contain;
    }
    .photo-caption {
      font-size: 8.5px;
      font-weight: 700;
      color: #475569;
      margin-top: 3px;
      text-transform: uppercase;
    }
    .footer-signatures {
      width: 100%;
      margin-top: 30px;
      page-break-inside: avoid;
      border-collapse: collapse;
    }
    .footer-signatures td {
      width: 50%;
      text-align: center;
      padding: 0 20px;
    }
    .sig-line {
      border-top: 1px solid #0f172a;
      margin-top: 40px;
      padding-top: 4px;
      font-weight: 700;
      font-size: 9.5px;
    }
    .sig-sub {
      font-size: 8px;
      color: #64748b;
    }
    .no-print {
      margin-bottom: 15px;
      text-align: right;
    }
    .print-btn {
      background: #b91c1c;
      color: white;
      border: none;
      padding: 8px 18px;
      font-size: 11px;
      font-weight: bold;
      border-radius: 6px;
      cursor: pointer;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    @media print {
      .no-print { display: none; }
      body { padding: 0; }
    }
  </style>
</head>
<body>
  <div class="no-print">
    <button class="print-btn" onclick="window.print()">Imprimir / Salvar em PDF</button>
  </div>

  <!-- Cabeçalho Institucional -->
  <table class="header-table">
    <tr>
      <td>
        <h1 class="brand-title">SIGER MASTER • FROTA</h1>
        <p class="brand-subtitle">SISTEMA INTEGRADO DE GESTÃO DE EMERGÊNCIA & RESGATE</p>
      </td>
      <td>
        <h2 class="doc-title">LAUDO PERICIAL VEICULAR</h2>
        <div class="doc-meta">ID: ${checklist.id || 'N/A'} • ${dataFormatada}</div>
      </td>
    </tr>
  </table>

  <!-- Identificação da Viatura & Vistoriador -->
  <div class="section-title">1. IDENTIFICAÇÃO DO VEÍCULO & CONTEXTO OPERACIONAL</div>
  <table class="grid-info">
    <tr>
      <td class="label">Prefixo da Frota:</td>
      <td class="val"><strong>${viatura?.prefixo_frota || 'N/A'}</strong></td>
      <td class="label">Placa Mercosul:</td>
      <td class="val"><strong>${viatura?.placa || 'N/A'}</strong></td>
    </tr>
    <tr>
      <td class="label">Marca / Modelo:</td>
      <td class="val">${viatura?.marca || ''} ${viatura?.modelo || ''}</td>
      <td class="label">Categoria / Tipo:</td>
      <td class="val">${viatura?.tipo_veiculo || 'Viatura Operacional'}</td>
    </tr>
    <tr>
      <td class="label">Contrato / Unidade:</td>
      <td class="val"><strong>${checklist.contrato_id}</strong></td>
      <td class="label">Odômetro Registrado:</td>
      <td class="val"><strong>${Number(checklist.odometro_km || 0).toLocaleString('pt-BR')} km</strong></td>
    </tr>
    <tr>
      <td class="label">Técnico / Vistoriador:</td>
      <td class="val"><strong>${checklist.tecnico_nome}</strong></td>
      <td class="label">Status do Laudo:</td>
      <td class="val"><span class="status-badge">${statusLabel} (${checklist.percentual_conformidade}% CONFORME)</span></td>
    </tr>
    ${checklist.latitude && checklist.longitude ? `
    <tr>
      <td class="label">Coordenadas GPS:</td>
      <td class="val" colspan="3">Lat: ${checklist.latitude}, Lng: ${checklist.longitude}</td>
    </tr>
    ` : ''}
  </table>

  <!-- Tabela de Itens Auditados -->
  <div class="section-title">2. RESULTADO DOS 8 SISTEMAS INSPECIONADOS</div>
  <table class="checklist-table">
    <thead>
      <tr>
        <th style="width: 65%;">Item / Componente Verificado</th>
        <th style="width: 20%; text-align: center;">Parecer</th>
        <th style="width: 15%; text-align: center;">Gravidade</th>
      </tr>
    </thead>
    <tbody>
      ${tabelaLinhasHtml}
    </tbody>
  </table>

  <!-- Galeria de Não Conformidades (Dual-Photo Evidence) -->
  ${itensNaoConformes.length > 0 ? `
    <div class="section-title">3. GALERIA DE EVIDÊNCIAS DE NÃO CONFORMIDADES (DUAL-PHOTO EVIDENCE)</div>
    ${itensNaoConformes.map((item, idx) => `
      <div class="anomaly-card">
        <div class="anomaly-header">
          [ITEM ${idx + 1}] • ${item.sistema_grupo}: ${item.item_nome} (${item.gravidade_anomalia || 'NÃO CONFORME'})
        </div>
        <div class="anomaly-desc">
          <strong>Relato Pericial da Avaria:</strong> ${item.observacao_anomalia || 'Sem detalhes descritos.'}
        </div>

        <table class="dual-photo-table">
          <tr>
            <td>
              <div class="photo-frame">
                ${item.foto_evidencia_1_url ? `<img src="${item.foto_evidencia_1_url}" alt="Foto 1" />` : '<span style="color:#64748b;">Foto não disponível</span>'}
              </div>
              <div class="photo-caption">EVIDÊNCIA 1: VISÃO GERAL / CONTEXTO DA AVARIA</div>
            </td>
            <td>
              <div class="photo-frame">
                ${item.foto_evidencia_2_url ? `<img src="${item.foto_evidencia_2_url}" alt="Foto 2" />` : '<span style="color:#64748b;">Foto não disponível</span>'}
              </div>
              <div class="photo-caption">EVIDÊNCIA 2: DETALHE / MACRO DO DANO ESPECÍFICO</div>
            </td>
          </tr>
        </table>
      </div>
    `).join('')}
  ` : `
    <div class="section-title">3. GALERIA DE EVIDÊNCIAS DE ANOMALIAS</div>
    <p style="padding: 10px; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 4px; color: #065f46; font-weight: 700;">
      ✓ Veículo 100% em conformidade operacional. Nenhuma não conformidade ou avaria foi apontada nesta vistoria.
    </p>
  `}

  <!-- Observações Gerais -->
  ${checklist.observacoes_gerais ? `
    <div class="section-title">4. OBSERVAÇÕES COMPLEMENTARES</div>
    <p style="padding: 8px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px;">
      ${checklist.observacoes_gerais}
    </p>
  ` : ''}

  <!-- Assinaturas -->
  <table class="footer-signatures">
    <tr>
      <td>
        <div class="sig-line">${checklist.tecnico_nome}</div>
        <div class="sig-sub">Vistoriador / Condutor Responsável</div>
      </td>
      <td>
        <div class="sig-line">Gestão de Frotas & Brigada de Emergência</div>
        <div class="sig-sub">Homologação Técnica SIGER Master</div>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
