import { FuelPricingService } from '../lib/services/FuelPricingService.ts';
import { FleetTrackingAdapter } from '../lib/adapters/FleetTrackingAdapter.ts';

console.log('=== TESTE DE PONTA A PONTA: TELEMETRIA, TRAVA DE PNEUS E GIS DA FROTA ===\n');

// 1. Teste de Variação de Preço (Delta R$ e %)
console.log('1. Testando Motor de Variação de Preços...');
const varAlta = FuelPricingService.calcularVariacaoPreco(6.25, 5.99);
console.log('   Entrada: Atual R$ 6.25 vs Anterior R$ 5.99');
console.log('   Resultado:', varAlta);
if (varAlta.deltaValor === 0.26 && varAlta.tendencia === 'ALTA' && varAlta.percentualVariacao > 0) {
  console.log('   ✅ Variação de alta calculada corretamente.\n');
} else {
  console.error('   ❌ Falha no cálculo de alta:', varAlta);
  process.exit(1);
}

const varBaixa = FuelPricingService.calcularVariacaoPreco(5.75, 5.99);
console.log('   Entrada: Atual R$ 5.75 vs Anterior R$ 5.99');
console.log('   Resultado:', varBaixa);
if (varBaixa.deltaValor === -0.24 && varBaixa.tendencia === 'BAIXA' && varBaixa.percentualVariacao < 0) {
  console.log('   ✅ Variação de economia calculada com precisão.\n');
} else {
  console.error('   ❌ Falha no cálculo de baixa:', varBaixa);
  process.exit(1);
}

// 2. Teste da Trava de 15 Dias de Calibração de Pneus
console.log('2. Testando Trava Crítica de 15 Dias de Calibração...');
const hoje = new Date();

// Cenário A: Sem calibração prévia
const travaSemData = FuelPricingService.validarCalibracaoPneus(null);
console.log('   Cenário A (Sem registro prévio):', travaSemData.bloqueioObrigatorio ? 'BLOQUEADO (Correto)' : 'LIBERADO (Erro)');
if (!travaSemData.bloqueioObrigatorio) {
  console.error('   ❌ Deveria ter bloqueado veículo sem calibração prévia.');
  process.exit(1);
}

// Cenário B: Calibrado há 7 dias (Dentro do prazo)
const seteDiasAtras = new Date(hoje.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
const trava7Dias = FuelPricingService.validarCalibracaoPneus(seteDiasAtras);
console.log('   Cenário B (7 dias atrás):', !trava7Dias.bloqueioObrigatorio ? 'LIBERADO (Correto)' : 'BLOQUEADO (Erro)');
if (trava7Dias.bloqueioObrigatorio) {
  console.error('   ❌ Não deveria ter bloqueado para 7 dias.');
  process.exit(1);
}

// Cenário C: Calibrado há 18 dias (Vencido > 15 dias)
const dezoitoDiasAtras = new Date(hoje.getTime() - 18 * 24 * 60 * 60 * 1000).toISOString();
const trava18Dias = FuelPricingService.validarCalibracaoPneus(dezoitoDiasAtras);
console.log('   Cenário C (18 dias atrás):', trava18Dias.bloqueioObrigatorio ? 'BLOQUEADO (Correto)' : 'LIBERADO (Erro)');
console.log('   Mensagem do Bloqueio:', trava18Dias.mensagem);
if (!trava18Dias.bloqueioObrigatorio || trava18Dias.diasDesdeCalibracao < 18) {
  console.error('   ❌ Falha no bloqueio de 18 dias.');
  process.exit(1);
}
console.log('   ✅ Trava de segurança quinzenal validada com 100% de precisão.\n');

// 3. Teste do Ranking Dinâmico do Posto Mais Econômico
console.log('3. Testando Ranking Dinâmico de Postos...');
const mockAbastecimentos = [
  { nome_posto: 'Posto Petrobras Rio Verde', tipo_combustivel: 'DIESEL_S10', valor_litro: 6.18, data_hora: hoje.toISOString() },
  { nome_posto: 'Posto Ipiranga Rota Sul', tipo_combustivel: 'DIESEL_S10', valor_litro: 5.99, data_hora: hoje.toISOString() },
  { nome_posto: 'Posto Shell Serra Leste', tipo_combustivel: 'DIESEL_S10', valor_litro: 6.25, data_hora: hoje.toISOString() }
];

const ranking = FuelPricingService.getPostoMaisEconomico(mockAbastecimentos, 'DIESEL_S10');
console.log('   Posto Mais Econômico Identificado:', ranking.postoMaisEconomico?.nome_posto, '- R$', ranking.postoMaisEconomico?.preco_medio);
console.log('   Economia Estimada:', ranking.postoMaisEconomico?.percentual_economia + '%');
if (ranking.postoMaisEconomico?.nome_posto === 'Posto Ipiranga Rota Sul' && ranking.postoMaisEconomico.preco_medio === 5.99) {
  console.log('   ✅ Ranking de postos identificou o posto mais econômico com sucesso.\n');
} else {
  console.error('   ❌ Falha ao classificar posto mais econômico:', ranking);
  process.exit(1);
}

// 4. Teste do Adapter de Telemetria e Rastreamento Leaflet GIS
console.log('4. Testando Telemetria GIS e Rotação Vetorial (Heading)...');
const telemetriaMock = FleetTrackingAdapter.getTelemetryPositions([
  {
    id: 'vtr-1',
    contrato_id: 'ONÇA PUMA',
    prefixo_frota: 'VTR-04',
    placa: 'FVZ3H91',
    tipo_veiculo: 'CAMINHONETE',
    marca: 'TOYOTA',
    modelo: 'HILUX 2.8 4X4',
    tipo_combustivel: 'DIESEL_S10',
    odometro_atual_km: 84320,
    status_operacional: 'EM_DESLOCAMENTO'
  },
  {
    id: 'vtr-2',
    contrato_id: 'ONÇA PUMA',
    prefixo_frota: 'AMB-01',
    placa: 'AMB-9921',
    tipo_veiculo: 'AMBULANCIA',
    marca: 'MERCEDES',
    modelo: 'SPRINTER 4X2',
    tipo_combustivel: 'DIESEL_S10',
    odometro_atual_km: 45110,
    status_operacional: 'DISPONIVEL'
  }
]);

console.log('   Veículos Rastreados:', telemetriaMock.length);
telemetriaMock.forEach((t) => {
  console.log(`   - [${t.prefixo}] Placa: ${t.placa} | Empresa: ${t.empresa} | Vel: ${t.velocidade_kmh} km/h | Status: ${t.status_movimento} | Heading: ${t.heading_graus}° | Lat: ${t.latitude}, Lng: ${t.longitude}`);
});

const postosGis = FleetTrackingAdapter.getPostosGeorreferenciados();
console.log('   Postos Georreferenciados no Mapa:', postosGis.length);
postosGis.forEach((p) => {
  console.log(`   - ⛽ ${p.nome} (${p.bandeira}) | Lat: ${p.latitude}, Lng: ${p.longitude} | Diesel S10: R$ ${p.ultimoPrecoDieselS10}`);
});

if (telemetriaMock.length >= 2 && postosGis.length >= 4) {
  console.log('   ✅ Camadas GIS de Viaturas e Postos validadas com sucesso.\n');
} else {
  console.error('   ❌ Falha nas camadas de telemetria:', telemetriaMock, postosGis);
  process.exit(1);
}

console.log('=== TODOS OS TESTES PASSARAM COM 100% DE SUCESSO! ===');
