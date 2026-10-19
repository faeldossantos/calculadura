export type Kind = 'expense' | 'income';
export type Transaction = { id: string; description: string; amount: number; kind: Kind; category: string; date: string; account: string; note: string };
export type Budget = { category: string; amount: number };
export type FinanceData = { version: 1; transactions: Transaction[]; budgets: Budget[]; demo: boolean };

export const EXPENSE_CATEGORIES = ['Alimentação', 'Moradia', 'Compras', 'Transporte', 'Lazer', 'Saúde', 'Educação', 'Outros'];
export const INCOME_CATEGORIES = ['Salário', 'Freelance', 'Investimentos', 'Outros'];
export const ACCOUNTS = ['Conta principal', 'Cartão de crédito', 'Dinheiro'];
export const STORAGE_KEY = 'calma-financas-v1';
export const money = (cents: number) => (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
export const today = () => new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Sao_Paulo' }).format(new Date());
export function parseMoney(value: string): number | null {
  const clean = value.trim().replace(/R\$\s?/g, '').replace(/\s/g, '');
  if (!/^\d+(?:\.\d{3})*(?:,\d{1,2})?$/.test(clean)) return null;
  const amount = Number(clean.replace(/\./g, '').replace(',', '.'));
  const cents = Math.round(amount * 100);
  return Number.isSafeInteger(cents) && cents > 0 && cents <= 99999999999 ? cents : null;
}
export function monthTransactions(transactions: Transaction[], month: string) {
  return transactions.filter(t => t.date.startsWith(month));
}
export function totals(transactions: Transaction[]) {
  const income = transactions.filter(t => t.kind === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = transactions.filter(t => t.kind === 'expense').reduce((s, t) => s + t.amount, 0);
  return { income, expense, balance: income - expense };
}
export function moveMonth(month: string, offset: number) {
  const [year, m] = month.split('-').map(Number);
  const date = new Date(year, m - 1 + offset, 1, 12);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}
export function seedData(): FinanceData {
  const month = today().slice(0, 7);
  const items: Omit<Transaction, 'id' | 'date' | 'note'>[] = [
    { description: 'Salário', amount: 650000, kind: 'income', category: 'Salário', account: 'Conta principal' },
    { description: 'Aluguel do apartamento', amount: 160000, kind: 'expense', category: 'Moradia', account: 'Conta principal' },
    { description: 'Supermercado', amount: 38650, kind: 'expense', category: 'Alimentação', account: 'Cartão de crédito' },
    { description: 'Café e boas conversas', amount: 3250, kind: 'expense', category: 'Alimentação', account: 'Cartão de crédito' },
    { description: 'Uber', amount: 2490, kind: 'expense', category: 'Transporte', account: 'Cartão de crédito' },
    { description: 'Projeto freelance', amount: 120000, kind: 'income', category: 'Freelance', account: 'Conta principal' },
    { description: 'Farmácia', amount: 8750, kind: 'expense', category: 'Saúde', account: 'Cartão de crédito' },
    { description: 'Jantar de sexta', amount: 12800, kind: 'expense', category: 'Alimentação', account: 'Cartão de crédito' },
    { description: 'Tênis novo', amount: 24990, kind: 'expense', category: 'Compras', account: 'Cartão de crédito' },
    { description: 'Cinema', amount: 6400, kind: 'expense', category: 'Lazer', account: 'Cartão de crédito' },
    { description: 'Conta de luz', amount: 18470, kind: 'expense', category: 'Moradia', account: 'Conta principal' },
    { description: 'Spotify', amount: 2190, kind: 'expense', category: 'Lazer', account: 'Cartão de crédito' },
    { description: 'Almoço no trabalho', amount: 4290, kind: 'expense', category: 'Alimentação', account: 'Cartão de crédito' },
    { description: 'Combustível', amount: 18000, kind: 'expense', category: 'Transporte', account: 'Cartão de crédito' },
  ];
  const transactions: Transaction[] = [];
  for (let offset = -5; offset <= 0; offset++) {
    const target = moveMonth(month, offset);
    const multiplier = offset === 0 ? 1 : [0.91, 1.14, 0.86, 1.06, 0.95][offset + 5];
    items.forEach((item, i) => transactions.push({ ...item, id: crypto.randomUUID(), date: `${target}-${String(i + 2).padStart(2, '0')}`, amount: Math.round(item.amount * multiplier), note: '' }));
  }
  return { version: 1, transactions, demo: true, budgets: [ { category: 'Alimentação', amount: 100000 }, { category: 'Moradia', amount: 200000 }, { category: 'Transporte', amount: 50000 }, { category: 'Lazer', amount: 30000 }, { category: 'Compras', amount: 40000 }, { category: 'Saúde', amount: 25000 } ] };
}
export function validData(value: unknown): value is FinanceData {
  if (!value || typeof value !== 'object') return false;
  const v = value as FinanceData;
  return v.version === 1 && typeof v.demo === 'boolean' && Array.isArray(v.transactions) && Array.isArray(v.budgets)
    && v.transactions.every(t => t && typeof t.id === 'string' && t.id.length > 0 && typeof t.description === 'string' && t.description.trim().length > 0 && typeof t.category === 'string' && (t.kind === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).includes(t.category) && ACCOUNTS.includes(t.account) && typeof t.note === 'string' && Number.isSafeInteger(t.amount) && t.amount > 0 && t.amount <= 99999999999 && ['income', 'expense'].includes(t.kind) && typeof t.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(t.date) && !Number.isNaN(Date.parse(t.date)) && new Date(t.date).toISOString().slice(0, 10) === t.date)
    && new Set(v.transactions.map(t => t.id)).size === v.transactions.length
    && v.budgets.every(b => b && EXPENSE_CATEGORIES.includes(b.category) && Number.isSafeInteger(b.amount) && b.amount > 0 && b.amount <= 99999999999)
    && new Set(v.budgets.map(b => b.category)).size === v.budgets.length;
}
export function toCSV(transactions: Transaction[]) {
  const cell = (value: string) => `"${value.replace(/"/g, '""')}"`;
  return '\uFEFF' + [ ['Data', 'Descrição', 'Tipo', 'Categoria', 'Conta', 'Valor (R$)', 'Observação'], ...transactions.map(t => [t.date, t.description, t.kind === 'income' ? 'Receita' : 'Despesa', t.category, t.account, ((t.kind === 'expense' ? -t.amount : t.amount) / 100).toFixed(2).replace('.', ','), t.note]) ].map(row => row.map(cell).join(';')).join('\r\n');
}
