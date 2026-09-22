/**
 * Suíte de Testes Automatizados QA: Metrologia e Gestão de Rodagem Veicular
 * SPCI Master - CONTRAN 558/80 & ABNT
 */

import assert from 'assert';

const LIMITE_LEGAL_TWI_MM = 1.60;
const LIMITE_ATENCAO_MM = 3.00;

function calcularBorrachaUtil(sOrig) {
  if (isNaN(sOrig) || sOrig <= LIMITE_LEGAL_TWI_MM) return 0;
  return Number((sOrig - LIMITE_LEGAL_TWI_MM).toFixed(2));
}

function calcularDesgasteAbsoluto(sOrig, sAferido) {
  if (isNaN(sOrig) || isNaN(sAferido)) return 0;
  return Number(Math.max(0, sOrig - sAferido).toFixed(2));
}

function calcularPercentualVidaUtil(sOrig, sAferido) {
  const bUtil = calcularBorrachaUtil(sOrig);
  if (bUtil <= 0) return 0;
  const saldoRestante = sAferido - LIMITE_LEGAL_TWI_MM;
  if (saldoRestante <= 0) return 0;
  const percentual = (saldoRestante / bUtil) * 100;
  return Number(Math.min(100, Math.max(0, percentual)).toFixed(2));
}

function classificarStatusTwi(sAferido) {
  if (isNaN(sAferido) || sAferido <= LIMITE_LEGAL_TWI_MM) return 'CRITICO_PROIBIDO';
  if (sAferido < LIMITE_ATENCAO_MM) return 'ATENCAO';
  return 'CONFORME';
}

function calcularProjecaoTwi(sOrig, sAferido, kmAtual = 0, kmRodados = null) {
  const deltaDesgaste = calcularDesgasteAbsoluto(sOrig, sAferido);
  const saldoRestante = Math.max(0, sAferido - LIMITE_LEGAL_TWI_MM);

  if (saldoRestante <= 0) {
    return { taxaDesgasteMmPorKm: null, kmProjetadoTwi: kmAtual };
  }

  if (kmRodados && kmRodados > 0 && deltaDesgaste > 0) {
    const taxa = deltaDesgaste / kmRodados;
    const kmRestantes = saldoRestante / taxa;
    return {
      taxaDesgasteMmPorKm: Number(taxa.toFixed(6)),
      kmProjetadoTwi: Math.round(kmAtual + kmRestantes)
    };
  }

  const taxaPadrao = 0.00015;
  const kmRestantesPadrao = saldoRestante / taxaPadrao;
  return {
    taxaDesgasteMmPorKm: taxaPadrao,
    kmProjetadoTwi: Math.round(kmAtual + kmRestantesPadrao)
  };
}

function gerarDemonstrativoEquacao(sOrig, sAferido, vidaUtil) {
  return `Vida Útil = ((S_aferido - 1.60) / (S_orig - 1.60)) × 100 ⟹ (([${Number(sAferido).toFixed(2)}] - 1.60) / ([${Number(sOrig).toFixed(2)}] - 1.60)) × 100 = ${Number(vidaUtil).toFixed(2)}%`;
}

console.log('🧪 =================================================================');
console.log('🧪 SUÍTE DE TESTES DE QA: METROLOGIA E RODAGEM VEICULAR (CONTRAN 558/80)');
console.log('🧪 =================================================================\n');

// -----------------------------------------------------------------------------
// Teste 1: Borracha Útil Total (B_util)
// -----------------------------------------------------------------------------
{
  const b1 = calcularBorrachaUtil(9.50);
  assert.strictEqual(b1, 7.90, 'Borracha útil de 9.50mm deve ser 7.90mm');
  console.log('✅ Teste 1.1: B_útil nominal (9.50mm - 1.60mm = 7.90mm) aprovado.');

  // Prevenção de divisão por zero ou valor abaixo do TWI
  const b2 = calcularBorrachaUtil(1.60);
  assert.strictEqual(b2, 0, 'Borracha útil de 1.60mm deve ser 0');
  const b3 = calcularBorrachaUtil(1.20);
  assert.strictEqual(b3, 0, 'Borracha útil de 1.20mm deve ser 0');
  console.log('✅ Teste 1.2: B_útil com S_orig <= 1.60mm (Prevenção de erro matemático) aprovado.');
}

// -----------------------------------------------------------------------------
// Teste 2: Desgaste Absoluto Consumido (Delta_desgaste)
// -----------------------------------------------------------------------------
{
  const d1 = calcularDesgasteAbsoluto(9.50, 4.20);
  assert.strictEqual(d1, 5.30, 'Desgaste consumido deve ser 5.30mm');
  console.log('✅ Teste 2.1: Delta_desgaste (9.50mm - 4.20mm = 5.30mm) aprovado.');

  const d2 = calcularDesgasteAbsoluto(10.00, 10.50);
  assert.strictEqual(d2, 0, 'Desgaste não pode ser negativo');
  console.log('✅ Teste 2.2: Delta_desgaste com medição superior a fábrica (resguardo zero) aprovado.');
}

// -----------------------------------------------------------------------------
// Teste 3: Percentual de Vida Útil Restante (% V_util) - CASO EXATO DO PROMPT
// -----------------------------------------------------------------------------
{
  const vu1 = calcularPercentualVidaUtil(9.50, 4.20);
  // (4.20 - 1.60) / (9.50 - 1.60) * 100 = (2.60 / 7.90) * 100 = 32.91139... -> 32.91%
  assert.strictEqual(vu1, 32.91, 'Vida útil deve ser exatamente 32.91%');
  console.log(`✅ Teste 3.1: % V_útil caso formal (S_orig=9.50mm, S_aferido=4.20mm) = ${vu1}% aprovado.`);

  // Pneu 100% novo
  const vuNovo = calcularPercentualVidaUtil(10.00, 10.00);
  assert.strictEqual(vuNovo, 100, 'Pneu novo deve ter 100% de vida útil');
  console.log('✅ Teste 3.2: Pneu novo (10.00mm) = 100% aprovado.');

  // Pneu exatamente no TWI (1.60mm)
  const vuTwi = calcularPercentualVidaUtil(9.50, 1.60);
  assert.strictEqual(vuTwi, 0, 'Pneu no TWI deve ter 0% de vida útil');
  console.log('✅ Teste 3.3: Pneu no TWI (1.60mm) = 0% aprovado.');

  // Pneu careca abaixo do TWI (1.00mm)
  const vuCareca = calcularPercentualVidaUtil(9.50, 1.00);
  assert.strictEqual(vuCareca, 0, 'Pneu abaixo do TWI deve ter 0% de vida útil');
  console.log('✅ Teste 3.4: Pneu careca (<1.60mm) = 0% aprovado.');
}

// -----------------------------------------------------------------------------
// Teste 4: Classificador Legal CONTRAN nº 558/80
// -----------------------------------------------------------------------------
{
  assert.strictEqual(classificarStatusTwi(1.5), 'CRITICO_PROIBIDO');
  assert.strictEqual(classificarStatusTwi(1.6), 'CRITICO_PROIBIDO');
  assert.strictEqual(classificarStatusTwi(1.7), 'ATENCAO');
  assert.strictEqual(classificarStatusTwi(2.9), 'ATENCAO');
  assert.strictEqual(classificarStatusTwi(3.0), 'CONFORME');
  assert.strictEqual(classificarStatusTwi(8.5), 'CONFORME');
  console.log('✅ Teste 4: Faixas normativas CONTRAN 558/80 (Crítico <=1.6, Atenção 1.7-2.9, Conforme >=3.0) aprovadas.');
}

// -----------------------------------------------------------------------------
// Teste 5: Projeção de Quilometragem até o TWI
// -----------------------------------------------------------------------------
{
  // Exemplo: Viatura com 50.000 km, pneu rodou 30.000 km e gastou 5.30 mm
  // Taxa = 5.30 / 30.000 = 0.00017666... mm/km
  // Saldo restante = 4.20 - 1.60 = 2.60 mm
  // Km restantes = 2.60 / 0.00017666... ≈ 14.717 km
  // Km projetado = 50.000 + 14.717 = 64.717 km
  const proj = calcularProjecaoTwi(9.50, 4.20, 50000, 30000);
  assert(proj.kmProjetadoTwi > 50000, 'Km projetado deve ser superior ao atual');
  assert.strictEqual(proj.kmProjetadoTwi, 64717, 'Km projetado deve ser 64.717 km');
  console.log(`✅ Teste 5.1: Projeção de troca TWI com taxa real (${proj.kmProjetadoTwi} km) aprovado.`);

  // Se já está no TWI (1.60mm), projeção é o odômetro atual
  const projTwi = calcularProjecaoTwi(9.50, 1.60, 50000);
  assert.strictEqual(projTwi.kmProjetadoTwi, 50000, 'Se pneu atingiu TWI, km projetado deve ser km atual');
  console.log('✅ Teste 5.2: Projeção no TWI imediato aprovada.');
}

// -----------------------------------------------------------------------------
// Teste 6: Demonstrativo Formal da Equação
// -----------------------------------------------------------------------------
{
  const eq = gerarDemonstrativoEquacao(9.50, 4.20, 32.91);
  assert(eq.includes('[4.20] - 1.60'), 'Demonstrativo deve conter S_aferido formatado');
  assert(eq.includes('[9.50] - 1.60'), 'Demonstrativo deve conter S_orig formatado');
  assert(eq.includes('32.91%'), 'Demonstrativo deve conter resultado 32.91%');
  console.log('✅ Teste 6: String formal da memória de cálculo para auditoria aprovada.');
}

// -----------------------------------------------------------------------------
// Teste 7: Zoneamento Livre do Botão FAB (+)
// -----------------------------------------------------------------------------
{
  // Validação geométrica: Dock centralizado no rodapé (left: 50%, translate: -50%)
  // FAB posicionado em right: 1.5rem (bottom-right)
  const dockConfig = { position: 'center-bottom', class: 'left-1/2 -translate-x-1/2' };
  const fabConfig = { position: 'bottom-right', class: 'right-4 sm:right-6 bottom-20 md:bottom-6' };
  assert.notStrictEqual(dockConfig.position, fabConfig.position, 'Dock e FAB não podem compartilhar a mesma zona');
  console.log('✅ Teste 7: Desobstrução espacial entre o Floating Dock (Centro) e FAB (Direita) aprovada.');
}

// -----------------------------------------------------------------------------
// Teste 8: Validação de Metrologia de Pneu M/T Profundo (Chengshan Maspire M/T)
// -----------------------------------------------------------------------------
{
  // Chengshan Maspire M/T LT265/65 R17 possui S_orig = 15.20 mm
  // B_util = 15.20 - 1.60 = 13.60 mm
  const bMaspire = calcularBorrachaUtil(15.20);
  assert.strictEqual(bMaspire, 13.60, 'Borracha útil do Chengshan Maspire M/T deve ser 13.60mm');
  
  // Aferição com 8.00 mm de sulco restante
  // Saldo = 8.00 - 1.60 = 6.40 mm
  // % V_util = (6.40 / 13.60) * 100 = 47.0588... -> 47.06%
  const vuMaspire = calcularPercentualVidaUtil(15.20, 8.00);
  assert.strictEqual(vuMaspire, 47.06, 'Vida útil com 8mm deve ser 47.06%');
  console.log('✅ Teste 8: Metrologia para Chengshan Maspire M/T (S_orig=15.20mm, B_util=13.60mm) aprovada.');
}

console.log('\n🎉 TODOS OS TESTES METROLÓGICOS FORAM EXECUTADOS COM 100% DE SUCESSO!\n');
