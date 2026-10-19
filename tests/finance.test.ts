import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseMoney, totals, moveMonth, monthTransactions, seedData, validData, toCSV, type Transaction } from '../src/finance.ts';

const sample: Transaction[] = [
  { id: 'a', description: 'Salário', amount: 100000, kind: 'income', category: 'Salário', date: '2026-10-01', account: 'Conta principal', note: '' },
  { id: 'b', description: 'Almoço; "especial"', amount: 1990, kind: 'expense', category: 'Alimentação', date: '2026-10-12', account: 'Dinheiro', note: 'Com amigos\nno domingo' },
  { id: 'c', description: 'Almoço', amount: 2010, kind: 'expense', category: 'Alimentação', date: '2026-09-12', account: 'Dinheiro', note: '' },
];

test('valores brasileiros são convertidos para centavos sem erro de arredondamento', () => {
  assert.equal(parseMoney('1.234,56'), 123456);
  assert.equal(parseMoney('R$ 49,90'), 4990);
  assert.equal(parseMoney('0,01'), 1);
  assert.equal(parseMoney('100'), 10000);
  assert.equal(parseMoney('12,5'), 1250);
});
test('rejeita valores ambíguos, negativos, nulos e fora do limite', () => {
  for (const value of ['', '0', '0,00', '-10', '12.34', '10,123', '1,000.20', 'NaN', '999999999999999999']) assert.equal(parseMoney(value), null, value);
});
test('totais usam apenas as transações do mês selecionado', () => {
  assert.deepEqual(totals(monthTransactions(sample, '2026-10')), { income: 100000, expense: 1990, balance: 98010 });
  assert.deepEqual(totals(monthTransactions(sample, '2025-10')), { income: 0, expense: 0, balance: 0 });
});
test('despesas podem resultar em saldo negativo', () => {
  assert.equal(totals([sample[1]]).balance, -1990);
});
test('navegação entre meses respeita mudanças de ano', () => {
  assert.equal(moveMonth('2026-01', -1), '2025-12');
  assert.equal(moveMonth('2026-12', 1), '2027-01');
  assert.equal(moveMonth('2026-03', -5), '2025-10');
});
test('exemplos e backups preservam os centavos e possuem IDs únicos', () => {
  const data = seedData();
  assert.equal(data.transactions.length, 84);
  assert.equal(validData(JSON.parse(JSON.stringify(data))), true);
  assert.equal(new Set(data.transactions.map(t => t.id)).size, data.transactions.length);
});
test('validação rejeita backups corrompidos, datas inexistentes e IDs duplicados', () => {
  const base = { version: 1, transactions: sample, budgets: [], demo: false };
  assert.equal(validData(base), true);
  for (const broken of [null, {}, { ...base, transactions: [null] }, { ...base, transactions: [{ ...sample[0], amount: 1.5 }] }, { ...base, transactions: [{ ...sample[0], date: '2026-02-30' }] }, { ...base, transactions: [sample[0], sample[0]] }, { ...base, budgets: [{ category: 'Inventada', amount: 100 }] }]) assert.equal(validData(broken), false);
});
test('CSV preserva descrições, quebras de linha, centavos e sinal das despesas', () => {
  const csv = toCSV(sample);
  assert.ok(csv.startsWith('\uFEFF'));
  assert.ok(csv.includes('"Almoço; ""especial"""'));
  assert.ok(csv.includes('"-19,90"'));
  assert.ok(csv.includes('"1000,00"'));
  assert.ok(csv.includes('"Com amigos\nno domingo"'));
});
