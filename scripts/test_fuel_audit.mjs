/**
 * Suíte de Testes Automatizados QA: FuelAuditService (Mecanismo Antifraude de Combustível)
 * SPCI Master - Gestão de Frota Operacional
 */

import assert from 'assert';

const FUEL_BENCHMARKS = {
  CAMINHONETE: { mediaKmLitro: 9.5, toleranciaPercentual: 0.20 },
  AMBULANCIA: { mediaKmLitro: 8.0, toleranciaPercentual: 0.20 },
  CAMINHAO_INCENDIO: { mediaKmLitro: 3.2, toleranciaPercentual: 0.25 },
  UTILITARIO: { mediaKmLitro: 11.0, toleranciaPercentual: 0.20 },
  OUTRO: { mediaKmLitro: 8.5, toleranciaPercentual: 0.20 }
};

function analyzeFuelConsumption({ odometroAtualKm, odometroAnteriorKm, litros, tipoVeiculo }) {
  const benchmark = FUEL_BENCHMARKS[tipoVeiculo] || FUEL_BENCHMARKS.OUTRO;

  if (litros === null || litros === undefined || isNaN(litros) || litros <= 0) {
    return { kmRodados: null, kmPorLitro: null, isDiscrepante: true, motivo: 'Volume zerado ou inválido' };
  }

  if (odometroAtualKm === null || odometroAtualKm === undefined || isNaN(odometroAtualKm) || odometroAtualKm < 0) {
    return { kmRodados: null, kmPorLitro: null, isDiscrepante: true, motivo: 'Odômetro inválido' };
  }

  if (odometroAnteriorKm === null || odometroAnteriorKm === undefined || isNaN(odometroAnteriorKm)) {
    return { kmRodados: null, kmPorLitro: null, isDiscrepante: false, motivo: null };
  }

  if (odometroAtualKm <= odometroAnteriorKm) {
    return { kmRodados: odometroAtualKm - odometroAnteriorKm, kmPorLitro: null, isDiscrepante: true, motivo: 'Retrocesso de odômetro' };
  }

  const kmRodados = Number((odometroAtualKm - odometroAnteriorKm).toFixed(2));
  const kmPorLitro = Number((kmRodados / litros).toFixed(2));

  if (kmPorLitro < 1.0 || kmPorLitro > 30.0) {
    return { kmRodados, kmPorLitro, isDiscrepante: true, motivo: 'Consumo fora dos limites físicos' };
  }

  const variacaoDecimal = (kmPorLitro - benchmark.mediaKmLitro) / benchmark.mediaKmLitro;
  if (Math.abs(variacaoDecimal) > benchmark.toleranciaPercentual) {
    return { kmRodados, kmPorLitro, isDiscrepante: true, motivo: 'Variação superior a 20% do benchmark' };
  }

  return { kmRodados, kmPorLitro, isDiscrepante: false, motivo: null };
}

console.log('🧪 Iniciando Testes de QA: FuelAuditService...\n');

// Teste 1: Consumo Normal de Caminhonete (9.5 km/L benchmark)
{
  const res = analyzeFuelConsumption({
    odometroAtualKm: 50000,
    odometroAnteriorKm: 49525, // 475 km rodados
    litros: 50, // 475 / 50 = 9.5 km/L (exato benchmark)
    tipoVeiculo: 'CAMINHONETE'
  });
  assert.strictEqual(res.kmRodados, 475);
  assert.strictEqual(res.kmPorLitro, 9.5);
  assert.strictEqual(res.isDiscrepante, false);
  console.log('✅ Teste 1: Consumo ideal dentro do benchmark aprovado.');
}

// Teste 2: Primeiro abastecimento (sem odômetro anterior)
{
  const res = analyzeFuelConsumption({
    odometroAtualKm: 12000,
    odometroAnteriorKm: null,
    litros: 60,
    tipoVeiculo: 'AMBULANCIA'
  });
  assert.strictEqual(res.kmPorLitro, null);
  assert.strictEqual(res.isDiscrepante, false);
  console.log('✅ Teste 2: Primeiro abastecimento sem erro aprovado.');
}

// Teste 3: Volume zero ou negativo (Prevenção de Divisão por Zero)
{
  const res = analyzeFuelConsumption({
    odometroAtualKm: 50000,
    odometroAnteriorKm: 49500,
    litros: 0,
    tipoVeiculo: 'CAMINHONETE'
  });
  assert.strictEqual(res.isDiscrepante, true);
  console.log('✅ Teste 3: Proteção contra divisão por zero aprovada.');
}

// Teste 4: Fraude de Odômetro (Retrocesso de KM)
{
  const res = analyzeFuelConsumption({
    odometroAtualKm: 48000, // Menor que o anterior!
    odometroAnteriorKm: 49000,
    litros: 50,
    tipoVeiculo: 'CAMINHONETE'
  });
  assert.strictEqual(res.isDiscrepante, true);
  assert.match(res.motivo, /Retrocesso/);
  console.log('✅ Teste 4: Detecção de retrocesso de odômetro aprovada.');
}

// Teste 5: Desvio Excessivo Superior (> +20% para Caminhonete: 13.0 km/L vs 9.5 km/L)
{
  const res = analyzeFuelConsumption({
    odometroAtualKm: 50650,
    odometroAnteriorKm: 50000, // 650 km rodados
    litros: 50, // 650 / 50 = 13.0 km/L (+36.8% do benchmark)
    tipoVeiculo: 'CAMINHONETE'
  });
  assert.strictEqual(res.isDiscrepante, true);
  console.log('✅ Teste 5: Disparo de flag para desvio > +20% aprovado.');
}

// Teste 6: Desvio Excessivo Inferior (< -20% para Ambulância: 5.0 km/L vs 8.0 km/L benchmark)
{
  const res = analyzeFuelConsumption({
    odometroAtualKm: 30250,
    odometroAnteriorKm: 30000, // 250 km rodados
    litros: 50, // 250 / 50 = 5.0 km/L (-37.5% do benchmark)
    tipoVeiculo: 'AMBULANCIA'
  });
  assert.strictEqual(res.isDiscrepante, true);
  console.log('✅ Teste 6: Disparo de flag para desvio < -20% aprovado.');
}

console.log('\n🎉 TODOS OS 6 TESTES DE AUDITORIA DE COMBUSTÍVEL PASSARAM COM SUCESSO!\n');
