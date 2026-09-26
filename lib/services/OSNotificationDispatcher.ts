import { OrdemServicoFrota, Viatura } from '@/lib/types/frota';
import { ConfigAprovadorOS, OSNotificacaoLog, CriticidadeOS } from '@/lib/types/osWorkflow';

export class OSNotificationDispatcher {
  /**
   * Formata número de telefone para WhatsApp internacional (+55...)
   */
  static cleanPhoneNumber(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.startsWith('55')) return digits;
    return `55${digits}`;
  }

  /**
   * Gera o texto estruturado e o link direto para WhatsApp
   */
  static generateWhatsAppMessage(
    os: OrdemServicoFrota,
    viatura: Viatura,
    aprovador: ConfigAprovadorOS,
    baseUrl = 'https://spci-master.vercel.app'
  ): { text: string; url: string; recipientNumber: string } {
    const prioridade = (os.prioridade || 'NORMAL').toUpperCase();
    const tagPrioridade = prioridade === 'EMERGENCIA' 
      ? 'EMERGENCIAL' 
      : prioridade === 'URGENTE' 
        ? 'URGENTE' 
        : 'MANUTENÇÃO';

    const emojiPrioridade = prioridade === 'EMERGENCIA' ? '🚨' : prioridade === 'URGENTE' ? '⚠️' : '📋';

    const dataAberturaFormatada = os.data_abertura
      ? new Date(os.data_abertura).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
      : new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

    const valorEst = Number(os.valor_estimado || os.custo_total || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });

    const alcadaMin = Number(aprovador.valor_minimo || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const alcadaMax = Number(aprovador.valor_maximo || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const linkAprovacao = `${baseUrl}/frota/os?id=${os.id}&action=approve`;
    const linkRomaneio = `${baseUrl}/frota/os?id=${os.id}&view=romaneio`;

    const naturezatxt = os.tipo_manutencao || os.natureza_manutencao || 'CORRETIVA';
    const oficinaNome = os.oficina?.nome_fantasia || os.oficina?.razao_social || (os.tipo_os === 'INTERNA' ? 'Oficina Interna Base SIGER' : 'Oficina Credenciada Homologada');
    const oficinaFone = os.oficina?.telefone || '(94) 99100-0000';
    const emitenteNome = os.responsavel_abertura || 'Inspetor Operacional de Frotas';

    // Protocolo Rastreável do Romaneio
    const protoRomaneio = `ROM-OS-${new Date().getFullYear().toString().slice(-2)}${String(new Date().getMonth() + 1).padStart(2, '0')}-${(os.id || os.numero_os || '000000').replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase()}`;

    // Monta o bloco anatômico
    let resumoCompTxt = '';
    if (os.resumo_anatomico && os.resumo_anatomico.trim()) {
      resumoCompTxt = os.resumo_anatomico;
    } else if (os.descricao_motivo || os.descricao_servico) {
      resumoCompTxt = `• ${os.descricao_motivo || os.descricao_servico}`;
    } else {
      resumoCompTxt = '• Manutenção geral da viatura';
    }

    const message = 
`${emojiPrioridade} *SIGER MASTER • ROMANEIO EXECUTIVO & ALERTA DE O.S. [${tagPrioridade}]* ${emojiPrioridade}

Prezado(a) *${aprovador.nome_aprovador}*, segue a cópia do *ROMANEIO OFICIAL* da Ordem de Serviço #${os.numero_os || 'OS-PENDENTE'}:

📑 *Protocolo do Romaneio:* ${protoRomaneio}
🏢 *Oficina Credenciada:* ${oficinaNome} (${oficinaFone})
🛠️ *Natureza da Manutenção:* ${naturezatxt.toUpperCase()} (${os.tipo_os || 'EXTERNA'})
📅 *Data/Hora de Abertura:* ${dataAberturaFormatada}
👤 *Emitente / Solicitante:* ${emitenteNome}
${prioridade === 'EMERGENCIA' ? '🔴' : prioridade === 'URGENTE' ? '🟠' : '🟢'} *Classificação de Risco:* *${prioridade}*
🔄 *Status da Ordem:* ${os.status_os || os.status || 'AGUARDANDO APROVAÇÃO'} (Etapa ${os.numero_etapa || 3}/6)

🚓 *DADOS DO VEÍCULO:*
• *Viatura:* ${viatura.prefixo_frota} — ${viatura.marca} ${viatura.modelo}
• *Placa:* ${viatura.placa} | *Odômetro:* ${Number(os.odometro_km || viatura.odometro_atual_km || 0).toLocaleString('pt-BR')} km
• *Base Operacional:* ${viatura.contrato_id || os.contrato_id || 'PARAUAPEBAS'}

🔩 *COMPONENTES & SERVIÇOS A MANUTENIR (ROMANEIO):*
${resumoCompTxt}

💰 *Estimativa de Custos:* ${valorEst}
⚖️ *Sua Alçada:* ${alcadaMin} até ${alcadaMax}

📄 *ABRIR VIA OFICIAL DO ROMANEIO (PDF / IMPRESSÃO):*
👉 ${linkRomaneio}

✅ *APROVAR OU GERENCIAR NO COCKPIT SIGER:*
👉 ${linkAprovacao}`;

    const recipientNumber = this.cleanPhoneNumber(aprovador.whatsapp);
    const url = `https://api.whatsapp.com/send?phone=${recipientNumber}&text=${encodeURIComponent(message)}`;

    return { text: message, url, recipientNumber };
  }

  /**
   * Gera o e-mail em HTML de alta fidelidade visual (Cyber-Metálico JIMMP Info)
   */
  static generateEmailHtml(
    os: OrdemServicoFrota,
    viatura: Viatura,
    aprovador: ConfigAprovadorOS,
    baseUrl = 'https://spci-master.vercel.app'
  ): { subject: string; html: string } {
    const prioridade = (os.prioridade || 'NORMAL').toUpperCase();
    const isEmergencia = prioridade === 'EMERGENCIA';
    const isUrgente = prioridade === 'URGENTE';

    const corDestaque = isEmergencia ? '#ef4444' : isUrgente ? '#f59e0b' : '#68D346';
    const tagBanner = isEmergencia 
      ? '🚨 ALERTA CRÍTICO: VIATURA BAIXADA / INTERDITADA' 
      : isUrgente 
        ? '⚠️ ALERTA DE ALTA PRIORIDADE (SLA 2H)' 
        : '📋 ROMANEIO DE ENCAMINHAMENTO & APROVAÇÃO';

    const subject = `[ROMANEIO ${isEmergencia ? 'EMERGÊNCIA' : isUrgente ? 'URGENTE' : 'O.S.'}] #${os.numero_os} • Viatura ${viatura.prefixo_frota} (${viatura.placa})`;

    const valorEst = Number(os.valor_estimado || os.custo_total || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });

    const linkApprove = `${baseUrl}/frota/os?id=${os.id}&action=approve`;
    const linkReview = `${baseUrl}/frota/os?id=${os.id}&action=review`;
    const linkRomaneio = `${baseUrl}/frota/os?id=${os.id}&view=romaneio`;

    const protoRomaneio = `ROM-OS-${new Date().getFullYear().toString().slice(-2)}${String(new Date().getMonth() + 1).padStart(2, '0')}-${(os.id || os.numero_os || '000000').replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase()}`;
    const oficinaNome = os.oficina?.nome_fantasia || os.oficina?.razao_social || (os.tipo_os === 'INTERNA' ? 'Oficina Interna da Base SIGER' : 'Oficina Homologada Externa');
    const emitenteNome = os.responsavel_abertura || 'Inspetor de Frotas SPCI';

    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #121418; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f4f4f5; }
    .container { max-width: 680px; margin: 25px auto; background-color: #1E2024; border-radius: 16px; border: 1px solid #3C3F45; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
    .header { background: linear-gradient(135deg, #1C4E26 0%, #121820 100%); padding: 25px 30px; text-align: left; border-bottom: 2.5px solid ${corDestaque}; }
    .badge { display: inline-block; padding: 5px 12px; font-size: 11px; font-weight: 800; border-radius: 6px; text-transform: uppercase; letter-spacing: 1px; color: ${corDestaque}; background-color: rgba(0,0,0,0.4); border: 1px solid ${corDestaque}; }
    .title { font-size: 22px; font-weight: 900; margin: 10px 0 4px 0; color: #ffffff; letter-spacing: -0.5px; }
    .subtitle { font-size: 12px; color: #a1a1aa; margin: 0; }
    .content { padding: 25px 30px; }
    .card { background-color: #282A2F; border-radius: 12px; border: 1px solid #3C3F45; padding: 18px; margin-bottom: 18px; }
    .card-title { margin: 0 0 10px 0; font-size: 12px; text-transform: uppercase; font-family: monospace; letter-spacing: 1px; display: flex; justify-content: space-between; align-items: center; }
    .table-data { width: 100%; border-collapse: collapse; font-size: 12.5px; }
    .table-data td { padding: 6px 0; border-bottom: 1px solid #3C3F45; }
    .table-data td.label { color: #a1a1aa; width: 38%; font-family: monospace; text-transform: uppercase; font-size: 11px; }
    .table-data td.val { color: #f4f4f5; font-weight: 700; text-align: right; }
    .desc-box { background-color: #18191c; border-left: 4px solid ${corDestaque}; padding: 12px 15px; border-radius: 6px; font-size: 12px; color: #e4e4e7; line-height: 1.5; margin: 10px 0; font-family: monospace; white-space: pre-line; }
    .cta-container { text-align: center; margin: 25px 0 10px 0; }
    .btn-approve { display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #1C4E26 0%, #68D346 100%); color: #ffffff; font-weight: 900; text-decoration: none; border-radius: 10px; text-transform: uppercase; font-size: 12px; letter-spacing: 0.5px; box-shadow: 0 4px 15px rgba(104,211,70,0.3); }
    .btn-romaneio { display: inline-block; margin-left: 8px; padding: 12px 20px; background-color: #af101a; color: #ffffff; font-weight: 800; text-decoration: none; border-radius: 10px; font-size: 12px; }
    .btn-review { display: inline-block; margin-left: 8px; padding: 12px 18px; background-color: #282A2F; color: #d4d4d8; font-weight: 700; text-decoration: none; border-radius: 10px; font-size: 12px; border: 1px solid #52525b; }
    .footer { padding: 18px 30px; background-color: #16171a; border-top: 1px solid #282A2F; text-align: center; font-size: 11px; color: #71717a; font-family: monospace; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="badge">${tagBanner}</div>
      <div class="title">Ordem de Serviço #${os.numero_os || 'OS-000'}</div>
      <p class="subtitle">Romaneio Oficial: <strong>${protoRomaneio}</strong> • Complexo ${viatura.contrato_id || 'PARAUAPEBAS'}</p>
    </div>

    <div class="content">
      <p style="font-size: 13.5px; margin-top: 0; color: #d4d4d8;">
        Prezado(a) <strong>${aprovador.nome_aprovador}</strong> (${aprovador.cargo}),
      </p>
      <p style="font-size: 12.5px; color: #a1a1aa; line-height: 1.5;">
        Segue o <strong>Romaneio Técnico de Encaminhamento</strong> emitido por <em>${emitenteNome}</em> para a viatura abaixo discriminada, aguardando validação de sua alçada operacional.
      </p>

      <!-- Dados Bilaterais: Veículo e Oficina -->
      <div class="card">
        <h4 class="card-title" style="color: #B7F365;">
          <span>🚓 1. Viatura Operacional</span>
          <span style="color: ${corDestaque}; font-size: 10px;">${prioridade}</span>
        </h4>
        <table class="table-data">
          <tr>
            <td class="label">Viatura / Prefixo:</td>
            <td class="val">${viatura.prefixo_frota} • ${viatura.marca} ${viatura.modelo}</td>
          </tr>
          <tr>
            <td class="label">Placa Mercosul:</td>
            <td class="val">${viatura.placa}</td>
          </tr>
          <tr>
            <td class="label">Odômetro Registrado:</td>
            <td class="val">${Number(os.odometro_km || viatura.odometro_atual_km || 0).toLocaleString('pt-BR')} km</td>
          </tr>
          <tr>
            <td class="label">Oficina Destino:</td>
            <td class="val" style="color: #60a5fa;">${oficinaNome}</td>
          </tr>
          <tr>
            <td class="label">Status Atual da O.S.:</td>
            <td class="val" style="color: #B7F365;">${os.status_os || os.status || 'AGUARDANDO APROVAÇÃO'}</td>
          </tr>
          <tr>
            <td class="label">Valor Total Estimado:</td>
            <td class="val" style="color: #68D346; font-size: 15px;">${valorEst}</td>
          </tr>
        </table>
      </div>

      <!-- Componentes e Subcomponentes do Romaneio -->
      <div class="card">
        <h4 class="card-title" style="color: #68D346;">
          <span>🔩 2. Componentes Flegados a Manutenir (Romaneio)</span>
        </h4>
        <div class="desc-box">
${os.resumo_anatomico || os.descricao_motivo || os.descricao_servico || 'Nenhum detalhamento individual registrado.'}
        </div>
      </div>

      <!-- Diagnóstico do Solicitante -->
      <div class="card">
        <h4 class="card-title" style="color: #a1a1aa;">
          <span>📝 3. Diagnóstico / Relato Inicial do Solicitante</span>
        </h4>
        <div style="font-size: 12px; color: #d4d4d8; line-height: 1.5; font-style: italic;">
          "${os.descricao_motivo || os.descricao_servico || 'Manutenção programada'}"
        </div>
      </div>

      <!-- Botões de Ação -->
      <div class="cta-container">
        <a href="${linkApprove}" class="btn-approve" target="_blank">Aprovar O.S.</a>
        <a href="${linkRomaneio}" class="btn-romaneio" target="_blank">📄 Visualizar Romaneio (PDF)</a>
        <a href="${linkReview}" class="btn-review" target="_blank">Solicitar Revisão</a>
      </div>
    </div>

    <div class="footer">
      SIGER Master • Sistema Integrado de Gestão de Emergência e Resgate<br>
      Romaneio oficial emitido sob governança do Complexo Carajás / SPCI.
    </div>
  </div>
</body>
</html>
`;

    return { subject, html };
  }

  /**
   * Cria o registro no histórico de logs de notificações
   */
  static createNotificationLog(
    os: OrdemServicoFrota,
    viatura: Viatura,
    aprovador: ConfigAprovadorOS,
    canal: 'IN_APP' | 'EMAIL' | 'WHATSAPP',
    titulo: string,
    mensagem: string
  ): OSNotificacaoLog {
    return {
      id: crypto.randomUUID(),
      contrato_id: os.contrato_id || viatura.contrato_id || 'GLOBAL',
      os_id: os.id,
      aprovador_id: aprovador.id,
      viatura_prefixo: viatura.prefixo_frota,
      viatura_placa: viatura.placa,
      prioridade_os: (os.prioridade as CriticidadeOS) || 'NORMAL',
      status_os: os.status_os || os.status || 'ABERTA',
      etapa_os: (os.etapa_atual as any) || '1_ABERTURA_TRIAGEM',
      canal,
      titulo,
      mensagem,
      lida: false,
      status_envio: 'ENVIADO',
      created_at: new Date().toISOString()
    };
  }
}
