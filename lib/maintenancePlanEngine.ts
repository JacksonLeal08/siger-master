import { TipoVeiculo } from './types/frota';

export interface MaintenanceItemRule {
  id: string;
  nome: string;
  intervaloKm: number;
  intervaloMeses: number;
  criticidade: 'ALTA' | 'MEDIA' | 'BAIXA';
}

export const DEFAULT_MAINTENANCE_RULES: MaintenanceItemRule[] = [
  {
    id: 'oleo_filtros',
    nome: 'Troca de Óleo do Motor e Filtros (Óleo/Combustível)',
    intervaloKm: 10000,
    intervaloMeses: 6,
    criticidade: 'ALTA'
  },
  {
    id: 'sistema_freios',
    nome: 'Inspeção e Troca de Pastilhas / Fluido de Freio',
    intervaloKm: 15000,
    intervaloMeses: 12,
    criticidade: 'ALTA'
  },
  {
    id: 'arrefecimento_correias',
    nome: 'Correias Auxiliares e Fluido de Arrefecimento',
    intervaloKm: 40000,
    intervaloMeses: 24,
    criticidade: 'MEDIA'
  },
  {
    id: 'suspensao_geometria',
    nome: 'Alinhamento, Balanceamento e Suspensão Operacional',
    intervaloKm: 10000,
    intervaloMeses: 6,
    criticidade: 'MEDIA'
  }
];

export interface MaintenanceAlert {
  regraId: string;
  nome: string;
  criticidade: 'ALTA' | 'MEDIA' | 'BAIXA';
  status: 'CONFORME' | 'ALERTA_PROXIMO' | 'VENCIDO';
  restanteKm: number;
  restanteDias: number;
  mensagem: string;
}

export class MaintenancePlanEngine {
  private static ANTECEDENCIA_KM = 1000; // Alerta 1.000 km antes
  private static ANTECEDENCIA_DIAS = 15; // Alerta 15 dias antes

  public static evaluateVehicle(
    odometroAtualKm: number,
    historicoServicos: Array<{ regraId: string; dataServico: string; odometroKm: number }> = [],
    rules: MaintenanceItemRule[] = DEFAULT_MAINTENANCE_RULES,
    baseKmManual?: number | null,
    baseDataManual?: string | null
  ): MaintenanceAlert[] {
    const hoje = new Date();

    return rules.map((regra) => {
      // Localiza o último serviço realizado para esta regra
      const servicosRegra = historicoServicos
        .filter((s) => s.regraId === regra.id)
        .sort((a, b) => new Date(b.dataServico).getTime() - new Date(a.dataServico).getTime());

      const ultimoServico = servicosRegra[0];
      const baseKm = ultimoServico 
        ? Number(ultimoServico.odometroKm) 
        : (baseKmManual !== undefined && baseKmManual !== null && !isNaN(Number(baseKmManual)) 
            ? Number(baseKmManual) 
            : 0);

      const baseData = ultimoServico 
        ? new Date(ultimoServico.dataServico) 
        : (baseDataManual && !isNaN(new Date(baseDataManual).getTime()) 
            ? new Date(baseDataManual) 
            : new Date(hoje.getFullYear() - 1, hoje.getMonth(), hoje.getDate()));

      // Próxima revisão por KM
      const proximoKm = baseKm + regra.intervaloKm;
      const restanteKm = Math.round(proximoKm - odometroAtualKm);

      // Próxima revisão por Data
      const proximaData = new Date(baseData);
      proximaData.setMonth(proximaData.getMonth() + regra.intervaloMeses);
      const diffMs = proximaData.getTime() - hoje.getTime();
      const restanteDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      let status: 'CONFORME' | 'ALERTA_PROXIMO' | 'VENCIDO' = 'CONFORME';
      let mensagem = `Próxima revisão em ${restanteKm} km ou ${restanteDias} dias.`;

      if (restanteKm <= 0 || restanteDias <= 0) {
        status = 'VENCIDO';
        mensagem = `Revisão vencida! Excedeu por ${Math.abs(restanteKm)} km ou ${Math.abs(restanteDias)} dias.`;
      } else if (restanteKm <= this.ANTECEDENCIA_KM || restanteDias <= this.ANTECEDENCIA_DIAS) {
        status = 'ALERTA_PROXIMO';
        mensagem = `Agendamento preventivo recomendado: restam apenas ${restanteKm} km ou ${restanteDias} dias.`;
      }

      return {
        regraId: regra.id,
        nome: regra.nome,
        criticidade: regra.criticidade,
        status,
        restanteKm,
        restanteDias,
        mensagem
      };
    });
  }
}
