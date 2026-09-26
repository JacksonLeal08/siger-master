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

    const message = 
`${emojiPrioridade} *SIGER MASTER • ALERTA DE ORDEM DE SERVIÇO [${tagPrioridade}]* ${emojiPrioridade}

Olá, *${aprovador.nome_aprovador}*, uma Ordem de Serviço requer sua atenção imediata:

📋 *Número da OS:* #${os.numero_os || 'OS-PENDENTE'}
📅 *Data/Hora de Abertura:* ${dataAberturaFormatada}
${prioridade === 'EMERGENCIA' ? '🔴' : prioridade === 'URGENTE' ? '🟠' : '🟢'} *Prioridade:* *${prioridade}*
🔄 *Status Atual:* ${os.status_os || os.status || 'AGUARDANDO APROVAÇÃO'}
📍 *Etapa do Fluxo:* ${os.etapa_atual || '3_AGUARDANDO_APROVACAO'} (Alçada Nível ${aprovador.nivel_alcada})

🚓 *Dados da Viatura:*
• *Veículo:* ${viatura.prefixo_frota} - ${viatura.marca} ${viatura.modelo}
• *Placa:* ${viatura.placa} | *Odômetro:* ${viatura.odometro_atual_km || 0} km
• *Contrato/Base:* ${viatura.contrato_id || os.contrato_id || 'ONÇA PUMA'}

🔧 *Origem / Defeito Relatado:*
"${os.descricao_motivo || os.descricao_servico || 'Manutenção veicular requerida'}"

💰 *Valor Estimado:* ${valorEst} (Dentro da sua alçada: ${alcadaMin} a ${alcadaMax})

👉 *Acesse o Cockpit para Aprovar ou Analisar em 1 clique:*
${linkAprovacao}`;

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
        : '📋 NOTIFICAÇÃO DE APROVAÇÃO DE SERVIÇO';

    const subject = `[${isEmergencia ? 'EMERGÊNCIA' : isUrgente ? 'URGENTE' : 'SIGER'}] OS #${os.numero_os} • Viatura ${viatura.prefixo_frota} (${viatura.placa})`;

    const valorEst = Number(os.valor_estimado || os.custo_total || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });

    const linkApprove = `${baseUrl}/frota/os?id=${os.id}&action=approve`;
    const linkReview = `${baseUrl}/frota/os?id=${os.id}&action=review`;

    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #121418; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f4f4f5; }
    .container { max-width: 650px; margin: 30px auto; background-color: #1E2024; border-radius: 16px; border: 1px solid #3C3F45; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
    .header { background: linear-gradient(135deg, #1C4E26 0%, #121820 100%); padding: 30px; text-align: left; border-bottom: 2px solid ${corDestaque}; }
    .badge { display: inline-block; padding: 6px 12px; font-size: 11px; font-weight: 800; border-radius: 6px; text-transform: uppercase; letter-spacing: 1px; color: ${corDestaque}; background-color: rgba(0,0,0,0.4); border: 1px solid ${corDestaque}; }
    .title { font-size: 24px; font-weight: 900; margin: 12px 0 4px 0; color: #ffffff; letter-spacing: -0.5px; }
    .subtitle { font-size: 13px; color: #a1a1aa; margin: 0; }
    .content { padding: 30px; }
    .card { background-color: #282A2F; border-radius: 12px; border: 1px solid #3C3F45; padding: 20px; margin-bottom: 20px; }
    .table-data { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px; }
    .table-data td { padding: 8px 0; border-bottom: 1px solid #3C3F45; }
    .table-data td.label { color: #a1a1aa; width: 35%; font-family: monospace; text-transform: uppercase; font-size: 11px; }
    .table-data td.val { color: #f4f4f5; font-weight: 700; text-align: right; }
    .desc-box { background-color: #18191c; border-left: 4px solid ${corDestaque}; padding: 15px; border-radius: 6px; font-size: 13px; color: #e4e4e7; line-height: 1.5; margin: 15px 0; }
    .cta-container { text-align: center; margin: 30px 0 10px 0; }
    .btn-approve { display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #1C4E26 0%, #68D346 100%); color: #ffffff; font-weight: 900; text-decoration: none; border-radius: 10px; text-transform: uppercase; font-size: 13px; letter-spacing: 1px; box-shadow: 0 4px 15px rgba(104,211,70,0.3); }
    .btn-review { display: inline-block; margin-left: 10px; padding: 14px 24px; background-color: #282A2F; color: #d4d4d8; font-weight: 700; text-decoration: none; border-radius: 10px; font-size: 13px; border: 1px solid #52525b; }
    .footer { padding: 20px 30px; background-color: #16171a; border-top: 1px solid #282A2F; text-align: center; font-size: 11px; color: #71717a; font-family: monospace; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="badge">${tagBanner}</div>
      <div class="title">Ordem de Serviço #${os.numero_os || 'OS-000'}</div>
      <p class="subtitle">Cockpit Operacional SIGER Master • Complexo Operacional ${viatura.contrato_id || 'PARAUAPEBAS'}</p>
    </div>

    <div class="content">
      <p style="font-size: 14px; margin-top: 0; color: #d4d4d8;">
        Prezado(a) <strong>${aprovador.nome_aprovador}</strong> (${aprovador.cargo}),
      </p>
      <p style="font-size: 13px; color: #a1a1aa; line-height: 1.5;">
        Uma nova Ordem de Serviço foi protocolada no sistema e alocada sob sua alçada operacional (Nível ${aprovador.nivel_alcada}) requerendo validação.
      </p>

      <div class="card">
        <h4 style="margin: 0 0 10px 0; font-size: 12px; text-transform: uppercase; color: #B7F365; font-family: monospace; letter-spacing: 1px;">
          Especificações da Viatura & Operação
        </h4>
        <table class="table-data">
          <tr>
            <td class="label">Viatura:</td>
            <td class="val">${viatura.prefixo_frota} • ${viatura.marca} ${viatura.modelo}</td>
          </tr>
          <tr>
            <td class="label">Placa Mercosul:</td>
            <td class="val">${viatura.placa}</td>
          </tr>
          <tr>
            <td class="label">Odômetro Atual:</td>
            <td class="val">${Number(viatura.odometro_atual_km || 0).toLocaleString('pt-BR')} km</td>
          </tr>
          <tr>
            <td class="label">Severidade / SLA:</td>
            <td class="val" style="color: ${corDestaque};">${prioridade}</td>
          </tr>
          <tr>
            <td class="label">Valor Estimado:</td>
            <td class="val" style="color: #68D346; font-size: 16px;">${valorEst}</td>
          </tr>
        </table>
      </div>

      <div class="card">
        <h4 style="margin: 0 0 5px 0; font-size: 12px; text-transform: uppercase; color: #a1a1aa; font-family: monospace;">
          Descrição do Diagnóstico / Defeito:
        </h4>
        <div class="desc-box">
          "${os.descricao_motivo || os.descricao_servico || 'Manutenção corretiva necessária'}"
        </div>
      </div>

      <div class="cta-container">
        <a href="${linkApprove}" class="btn-approve" target="_blank">Aprovar Ordem de Serviço</a>
        <a href="${linkReview}" class="btn-review" target="_blank">Solicitar Revisão</a>
      </div>
    </div>

    <div class="footer">
      SIGER Master • Sistema Integrado de Gestão de Emergência e Resgate<br>
      Este é um e-mail transacional automatizado da central de frotas e auditoria SPCI.
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
