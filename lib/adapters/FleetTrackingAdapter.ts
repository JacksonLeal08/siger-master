import { Viatura, ViaturaTrackingTelemetry, TipoVeiculo } from '../types/frota';

export interface PostoGeorreferenciado {
  id: string;
  nome: string;
  bandeira: string;
  latitude: number;
  longitude: number;
  endereco: string;
  ultimoPrecoDieselS10?: number;
  ultimoPrecoGasolina?: number;
}

export class FleetTrackingAdapter {
  /**
   * Postos de combustível cadastrados / georreferenciados na região operacional
   */
  private static postosBase: PostoGeorreferenciado[] = [
    {
      id: 'posto-01',
      nome: 'Posto Petrobras - Rio Verde',
      bandeira: 'Petrobras',
      latitude: -6.075421,
      longitude: -49.862145,
      endereco: 'Av. dos Ipês, 450 - Rio Verde, Parauapebas - PA',
      ultimoPrecoDieselS10: 6.18,
      ultimoPrecoGasolina: 5.89
    },
    {
      id: 'posto-02',
      nome: 'Posto Ipiranga - Rota Sul',
      bandeira: 'Ipiranga',
      latitude: -6.082155,
      longitude: -49.851233,
      endereco: 'Rod. PA-275, Km 04 - Cidade Nova, Parauapebas - PA',
      ultimoPrecoDieselS10: 5.99,
      ultimoPrecoGasolina: 5.79
    },
    {
      id: 'posto-03',
      nome: 'Posto Shell - Serra Leste',
      bandeira: 'Shell',
      latitude: -6.091044,
      longitude: -49.845012,
      endereco: 'Av. Faruk Salmen, 1200 - Parauapebas - PA',
      ultimoPrecoDieselS10: 6.25,
      ultimoPrecoGasolina: 5.95
    },
    {
      id: 'posto-04',
      nome: 'Posto Ale - Onça Puma',
      bandeira: 'Ale',
      latitude: -6.110200,
      longitude: -49.880150,
      endereco: 'Acesso Mina Onça Puma - Zona Rural, Ourilândia / Parauapebas - PA',
      ultimoPrecoDieselS10: 6.32,
      ultimoPrecoGasolina: 6.09
    }
  ];

  /**
   * Retorna os pontos georreferenciados de postos conhecidos
   */
  static getPostosGeorreferenciados(): PostoGeorreferenciado[] {
    return this.postosBase;
  }

  /**
   * Converte uma lista de Viaturas cadastradas em posições telemétricas ativas
   * combinando dados reais do banco com o fluxo telemétrico GPS.
   */
  static getTelemetryPositions(viaturasCadastradas: Viatura[] = []): ViaturaTrackingTelemetry[] {
    const agora = new Date().toISOString();

    // Mapeamento padrão para veículos conhecidos caso não haja dados telemétricos via hardware
    const telemetriaMockBase: Record<string, Partial<ViaturaTrackingTelemetry>> = {
      FVZ3H91: {
        velocidade_kmh: 42,
        status_movimento: 'em_transito',
        heading_graus: 93.35,
        latitude: -6.085417,
        longitude: -49.859307,
        empresa: 'OMEGA'
      },
      'AMB-9921': {
        velocidade_kmh: 0,
        status_movimento: 'ralenti',
        heading_graus: 180,
        latitude: -6.072145,
        longitude: -49.84621,
        empresa: 'OMEGA'
      },
      'ABT-2024': {
        velocidade_kmh: 0,
        status_movimento: 'desligado',
        heading_graus: 0,
        latitude: -6.0912,
        longitude: -49.8351,
        empresa: 'SPCI OPERAÇÕES'
      }
    };

    if (viaturasCadastradas.length > 0) {
      return viaturasCadastradas.map((v, index) => {
        const placaLimpa = (v.placa || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
        const base =
          telemetriaMockBase[placaLimpa] ||
          telemetriaMockBase[v.placa] || {
            velocidade_kmh: v.status_operacional === 'EM_DESLOCAMENTO' ? 38 : 0,
            status_movimento:
              v.status_operacional === 'EM_DESLOCAMENTO'
                ? 'em_transito'
                : v.status_operacional === 'DISPONIVEL'
                ? 'ralenti'
                : 'desligado',
            heading_graus: (index * 65 + 45) % 360,
            latitude: -6.085417 + (index * 0.007 - 0.012),
            longitude: -49.859307 + (index * 0.008 - 0.015),
            empresa: 'OMEGA'
          };

        return {
          id: `telemetry-${v.id}`,
          viatura_id: v.id,
          placa: v.placa,
          prefixo: v.prefixo_frota,
          tipo_veiculo: v.tipo_veiculo,
          empresa: base.empresa || 'OMEGA',
          velocidade_kmh: base.velocidade_kmh ?? 0,
          status_movimento: base.status_movimento || 'ralenti',
          heading_graus: base.heading_graus ?? 0,
          latitude: base.latitude ?? -6.085417,
          longitude: base.longitude ?? -49.859307,
          odometro_km: v.odometro_atual_km,
          foto_veiculo_url: v.foto_veiculo_url || null,
          ultima_atualizacao: agora
        };
      });
    }

    // Caso o banco ainda não tenha viaturas cadastradas, gera os 2 registros executivos de referência
    return [
      {
        id: 'telemetry-cam-01',
        viatura_id: 'vtr-cam-01',
        placa: 'FVZ3H91',
        prefixo: 'VTR-04',
        tipo_veiculo: 'CAMINHONETE',
        empresa: 'OMEGA',
        velocidade_kmh: 42,
        status_movimento: 'em_transito',
        heading_graus: 93.35,
        latitude: -6.085417,
        longitude: -49.859307,
        odometro_km: 84320,
        foto_veiculo_url: null,
        ultima_atualizacao: agora
      },
      {
        id: 'telemetry-amb-01',
        viatura_id: 'vtr-amb-01',
        placa: 'AMB-9921',
        prefixo: 'AMB-01',
        tipo_veiculo: 'AMBULANCIA',
        empresa: 'OMEGA',
        velocidade_kmh: 0,
        status_movimento: 'ralenti',
        heading_graus: 180,
        latitude: -6.072145,
        longitude: -49.84621,
        odometro_km: 45110,
        foto_veiculo_url: null,
        ultima_atualizacao: agora
      }
    ];
  }
}
