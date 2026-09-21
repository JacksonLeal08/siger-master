import { MaintenancePlanEngine } from '../lib/maintenancePlanEngine.ts';

console.log('=== TESTE DE CÁLCULO DE PREVENTIVA COM BASE MANUAL ===\n');

// 1. Cenário Regular: Viatura revisada aos 80.000 km, odômetro atual 84.320 km
// Próxima revisão aos 90.000 km -> Restam 5.680 km
const data30DiasAtras = new Date();
data30DiasAtras.setDate(data30DiasAtras.getDate() - 30);

const alertas1 = MaintenancePlanEngine.evaluateVehicle(
  84320,
  [],
  undefined,
  80000,
  data30DiasAtras.toISOString()
);

const regraOleo1 = alertas1.find(a => a.regraId === 'oleo_filtros');
console.log('Cenário 1 (84.320 km - Base 80.000 km):');
console.log('  Restante KM:', regraOleo1?.restanteKm);
console.log('  Status:', regraOleo1?.status);
console.log('  Mensagem:', regraOleo1?.mensagem);
if (regraOleo1?.restanteKm === 5680 && regraOleo1.status === 'CONFORME') {
  console.log('  ✅ Cenário Conforme validado com sucesso.\n');
} else {
  console.error('  ❌ Falha no Cenário 1:', regraOleo1);
  process.exit(1);
}

// 2. Cenário Alerta Próximo: Viatura aos 89.400 km, restam 600 km (<= 1.000 km)
const alertas2 = MaintenancePlanEngine.evaluateVehicle(
  89400,
  [],
  undefined,
  80000,
  data30DiasAtras.toISOString()
);

const regraOleo2 = alertas2.find(a => a.regraId === 'oleo_filtros');
console.log('Cenário 2 (89.400 km - Faltam 600 km):');
console.log('  Restante KM:', regraOleo2?.restanteKm);
console.log('  Status:', regraOleo2?.status);
console.log('  Mensagem:', regraOleo2?.mensagem);
if (regraOleo2?.restanteKm === 600 && regraOleo2.status === 'ALERTA_PROXIMO') {
  console.log('  ✅ Cenário Alerta Próximo validado com sucesso.\n');
} else {
  console.error('  ❌ Falha no Cenário 2:', regraOleo2);
  process.exit(1);
}

// 3. Cenário Vencido: Viatura aos 90.500 km, excedeu 500 km
const alertas3 = MaintenancePlanEngine.evaluateVehicle(
  90500,
  [],
  undefined,
  80000,
  data30DiasAtras.toISOString()
);

const regraOleo3 = alertas3.find(a => a.regraId === 'oleo_filtros');
console.log('Cenário 3 (90.500 km - Excedeu 500 km):');
console.log('  Restante KM:', regraOleo3?.restanteKm);
console.log('  Status:', regraOleo3?.status);
console.log('  Mensagem:', regraOleo3?.mensagem);
if (regraOleo3?.restanteKm === -500 && regraOleo3.status === 'VENCIDO') {
  console.log('  ✅ Cenário Vencido validado com sucesso.\n');
} else {
  console.error('  ❌ Falha no Cenário 3:', regraOleo3);
  process.exit(1);
}

console.log('=== TODOS OS CÁLCULOS DE PREVENTIVA MANUAL FORAM VALIDADOS COM SUCESSO! ===');
