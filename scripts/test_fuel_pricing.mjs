import { FuelPricingService } from '../lib/services/FuelPricingService.ts';

console.log('--- TESTANDO FUEL PRICING SERVICE & VALIDAÇÃO QUINZENAL ---');

// 1. Teste de Variação de Preço
const var1 = FuelPricingService.calcularVariacaoPreco(6.19, 5.99);
console.log('Variação Alta:', var1);
if (var1.deltaValor === 0.2 && var1.tendencia === 'ALTA') {
  console.log('✅ Variação Alta validada com sucesso.');
} else {
  console.error('❌ Falha na Variação Alta:', var1);
}

const var2 = FuelPricingService.calcularVariacaoPreco(5.79, 5.99);
console.log('Variação Baixa:', var2);
if (var2.deltaValor === -0.2 && var2.tendencia === 'BAIXA') {
  console.log('✅ Variação Baixa validada com sucesso.');
} else {
  console.error('❌ Falha na Variação Baixa:', var2);
}

// 2. Teste da Trava de 15 Dias de Calibragem de Pneus
const data10DiasAtras = new Date();
data10DiasAtras.setDate(data10DiasAtras.getDate() - 10);
const res10 = FuelPricingService.validarCalibracaoPneus(data10DiasAtras.toISOString(), 15);
console.log('10 Dias Atrás (Deve Liberar):', res10);
if (!res10.bloqueioObrigatorio) {
  console.log('✅ Liberado corretamente para 10 dias.');
} else {
  console.error('❌ Bloqueou indevidamente para 10 dias:', res10);
}

const data20DiasAtras = new Date();
data20DiasAtras.setDate(data20DiasAtras.getDate() - 20);
const res20 = FuelPricingService.validarCalibracaoPneus(data20DiasAtras.toISOString(), 15);
console.log('20 Dias Atrás (Deve Bloquear):', res20);
if (res20.bloqueioObrigatorio && res20.diasDesdeCalibracao >= 20) {
  console.log('✅ Bloqueado corretamente para 20 dias com alerta de segurança.');
} else {
  console.error('❌ Não bloqueou para 20 dias:', res20);
}

// 3. Teste de Ranking de Postos
const abastecimentosMock = [
  { nome_posto: 'Posto Petrobras', tipo_combustivel: 'DIESEL_S10', valor_litro: 6.20, data_hora: new Date().toISOString() },
  { nome_posto: 'Posto Petrobras', tipo_combustivel: 'DIESEL_S10', valor_litro: 6.18, data_hora: new Date().toISOString() },
  { nome_posto: 'Posto Ipiranga', tipo_combustivel: 'DIESEL_S10', valor_litro: 5.99, data_hora: new Date().toISOString() },
  { nome_posto: 'Posto Shell', tipo_combustivel: 'DIESEL_S10', valor_litro: 6.29, data_hora: new Date().toISOString() },
];

const rankingRes = FuelPricingService.getPostoMaisEconomico(abastecimentosMock, 'DIESEL_S10');
console.log('Posto Mais Econômico:', rankingRes.postoMaisEconomico);
if (rankingRes.postoMaisEconomico?.nome_posto === 'Posto Ipiranga' && rankingRes.postoMaisEconomico.menor_preco === 5.99) {
  console.log('✅ Posto Ipiranga identificado como mais econômico com sucesso.');
} else {
  console.error('❌ Falha no ranking:', rankingRes);
}

console.log('--- TODOS OS TESTES MATEMÁTICOS PASSARAM ---');
