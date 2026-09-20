/**
 * Suíte de Testes Automatizados QA: Classificador Normativo TWI (CONTRAN 558/80)
 * SPCI Master - Gestão de Frota Operacional
 */

import assert from 'assert';

function classificarSulcoTwi(sulcoMm) {
  if (sulcoMm <= 1.6) {
    return 'CRITICO_PROIBIDO';
  }
  if (sulcoMm < 3.0) {
    return 'ATENCAO';
  }
  return 'CONFORME';
}

console.log('🧪 Iniciando Testes de QA: Classificador Normativo TWI (CONTRAN 558/80)...\n');

// Teste 1: Limiar Crítico 1.5mm (Abaixo do limite legal)
{
  const status = classificarSulcoTwi(1.5);
  assert.strictEqual(status, 'CRITICO_PROIBIDO', '1.5mm deve ser classificado como CRITICO_PROIBIDO');
  console.log('✅ Teste 1: 1.5mm -> CRITICO_PROIBIDO (Infração CONTRAN 558/80) aprovado.');
}

// Teste 2: Limite Exato 1.6mm (Limite da banda de rodagem TWI)
{
  const status = classificarSulcoTwi(1.6);
  assert.strictEqual(status, 'CRITICO_PROIBIDO', '1.6mm deve ser classificado como CRITICO_PROIBIDO');
  console.log('✅ Teste 2: 1.6mm -> CRITICO_PROIBIDO (Limite TWI atingido) aprovado.');
}

// Teste 3: Limite de Transição 1.7mm (Alerta de troca próxima)
{
  const status = classificarSulcoTwi(1.7);
  assert.strictEqual(status, 'ATENCAO', '1.7mm deve ser classificado como ATENCAO');
  console.log('✅ Teste 3: 1.7mm -> ATENCAO (Substituição preventiva recomendada) aprovado.');
}

// Teste 4: Limiar 2.9mm (Próximo à conformidade plena)
{
  const status = classificarSulcoTwi(2.9);
  assert.strictEqual(status, 'ATENCAO', '2.9mm deve ser classificado como ATENCAO');
  console.log('✅ Teste 4: 2.9mm -> ATENCAO aprovado.');
}

// Teste 5: Limiar 3.0mm (Conforme pleno)
{
  const status = classificarSulcoTwi(3.0);
  assert.strictEqual(status, 'CONFORME', '3.0mm deve ser classificado como CONFORME');
  console.log('✅ Teste 5: 3.0mm -> CONFORME aprovado.');
}

// Teste 6: Pneu Novo 8.5mm
{
  const status = classificarSulcoTwi(8.5);
  assert.strictEqual(status, 'CONFORME', '8.5mm deve ser classificado como CONFORME');
  console.log('✅ Teste 6: 8.5mm -> CONFORME (Pneu novo com segurança total) aprovado.');
}

console.log('\n🎉 TODOS OS 6 TESTES DE CLASSIFICAÇÃO TWI CONTRAN FORAM APROVADOS COM SUCESSO!\n');
