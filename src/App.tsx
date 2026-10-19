import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { ArrowDownLeft, ArrowUpRight, ArrowRight, ArrowLeftRight, LayoutDashboard, ChartNoAxesColumnIncreasing, Wallet, Plus, ChevronDown, ChevronLeft, ChevronRight, Search, SlidersHorizontal, Download, X, Check, Utensils, House, ShoppingBag, Car, HeartPulse, GraduationCap, Ellipsis, BriefcaseBusiness, TrendingUp, Music2, Leaf, ShieldCheck, Menu, Pencil, Trash2, CircleHelp, Upload, Database, CheckCircle2, CircleAlert, Sprout, FolderOpen, PiggyBank } from 'lucide-react';
import { ACCOUNTS, EXPENSE_CATEGORIES, INCOME_CATEGORIES, STORAGE_KEY, money, today, parseMoney, totals, monthTransactions, moveMonth, seedData, validData, toCSV, type Transaction, type FinanceData, type Kind, type Budget } from './finance';

type Page = 'overview' | 'transactions' | 'budgets' | 'data';
const titles: Record<Page, string> = { overview: 'Visão geral', transactions: 'Transações', budgets: 'Orçamentos', data: 'Seus dados' };
const categoryColors: Record<string, string> = { Alimentação: '#e6a46e', Moradia: '#5e8c77', Compras: '#9c9ec7', Transporte: '#85aabd', Lazer: '#d5b46e', Saúde: '#c48c9c', Educação: '#86a68c', Outros: '#a8aaa6', Salário: '#5e8c77', Freelance: '#85aabd', Investimentos: '#9c9ec7' };
const categoryIcons: Record<string, typeof House> = { Alimentação: Utensils, Moradia: House, Compras: ShoppingBag, Transporte: Car, Lazer: Music2, Saúde: HeartPulse, Educação: GraduationCap, Outros: Ellipsis, Salário: BriefcaseBusiness, Freelance: BriefcaseBusiness, Investimentos: TrendingUp };
const monthName = (month: string, short = false) => new Intl.DateTimeFormat('pt-BR', { month: short ? 'short' : 'long', ...(!short && { year: 'numeric' }) }).format(new Date(`${month}-02T12:00:00`)).replace(' de ', ' ');
const displayDate = (date: string) => new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(new Date(`${date}T12:00:00`)).replace('.', '');

function IconCategory({ category, small = false }: { category: string; small?: boolean }) {
  const Icon = categoryIcons[category] || Ellipsis;
  const color = categoryColors[category] || '#a8aaa6';
  return <span className={`category-icon ${small ? 'small' : ''}`} style={{ color, background: `${color}19` }}><Icon size={small ? 16 : 19} strokeWidth={1.7} /></span>;
}

function Modal({ title, subtitle, children, onClose, wide = false }: { title: string; subtitle?: string; children: ReactNode; onClose: () => void; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const dialog = ref.current; dialog?.showModal(); return () => dialog?.close(); }, []);
  return <dialog ref={ref} className={`modal ${wide ? 'wide' : ''}`} onCancel={onClose} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
    <div className="modal-head"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div><button className="icon-button" onClick={onClose} aria-label="Fechar"><X size={20} /></button></div>
    {children}
  </dialog>;
}

function TransactionForm({ transaction, initialKind, initialMonth, onSave, onClose }: { transaction?: Transaction; initialKind: Kind; initialMonth: string; onSave: (transaction: Transaction) => void; onClose: () => void }) {
  const [kind, setKind] = useState<Kind>(transaction?.kind || initialKind);
  const [category, setCategory] = useState(transaction?.category || (kind === 'expense' ? 'Alimentação' : 'Salário'));
  const [amount, setAmount] = useState(transaction ? (transaction.amount / 100).toFixed(2).replace('.', ',') : '');
  const [error, setError] = useState('');
  const categories = kind === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  const defaultDate = initialMonth === today().slice(0, 7) ? today() : `${initialMonth}-01`;
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const cents = parseMoney(amount);
    if (!cents) { setError('Digite um valor válido, como 49,90.'); return; }
    const form = new FormData(e.currentTarget);
    const description = String(form.get('description') || '').trim();
    if (!description) { setError('Dê um nome para esta transação.'); return; }
    onSave({ id: transaction?.id || crypto.randomUUID(), kind, amount: cents, category, description, date: String(form.get('date')), account: String(form.get('account')), note: String(form.get('note') || '').trim() });
  }
  return <Modal title={transaction ? 'Editar transação' : 'Uma nova transação'} subtitle="Poucos detalhes. Tudo organizado." onClose={onClose}>
    <form onSubmit={submit} className="transaction-form">
      <div className="type-toggle"><button type="button" className={kind === 'expense' ? 'selected expense' : ''} onClick={() => { setKind('expense'); setCategory('Alimentação'); }}><ArrowUpRight size={17} /> Despesa</button><button type="button" className={kind === 'income' ? 'selected income' : ''} onClick={() => { setKind('income'); setCategory('Salário'); }}><ArrowDownLeft size={17} /> Receita</button></div>
      <label className="amount-label" htmlFor="amount">Qual é o valor?</label>
      <div className="amount-input"><span>R$</span><input id="amount" name="amount" autoFocus inputMode="decimal" placeholder="0,00" value={amount} onChange={e => { setAmount(e.target.value); setError(''); }} required aria-describedby={error ? 'transaction-error' : undefined} /></div>
      <label>Descrição<input name="description" placeholder={kind === 'expense' ? 'Ex.: almoço com os amigos' : 'Ex.: salário do mês'} defaultValue={transaction?.description} required maxLength={100} /></label>
      <div className="form-grid"><label>Categoria<select value={category} onChange={e => setCategory(e.target.value)}>{categories.map(c => <option key={c}>{c}</option>)}</select></label><label>Data<input name="date" type="date" defaultValue={transaction?.date || defaultDate} min="2000-01-01" max="2100-12-31" required /></label></div>
      <label>De onde sai ou entra?<select name="account" defaultValue={transaction?.account || ACCOUNTS[0]}>{ACCOUNTS.map(a => <option key={a}>{a}</option>)}</select></label>
      <label>Observação <span className="optional">opcional</span><input name="note" placeholder="Algo que você queira lembrar" defaultValue={transaction?.note} maxLength={250} /></label>
      {error && <p className="form-error" id="transaction-error" role="alert">{error}</p>}
      <div className="modal-footer"><button type="button" className="button secondary" onClick={onClose}>Cancelar</button><button className="button primary" type="submit"><Check size={17} /> {transaction ? 'Salvar alterações' : `Adicionar ${kind === 'expense' ? 'despesa' : 'receita'}`}</button></div>
    </form>
  </Modal>;
}

function BudgetForm({ budget, budgets, onSave, onClose }: { budget?: Budget; budgets: Budget[]; onSave: (b: Budget) => void; onClose: () => void }) {
  const [error, setError] = useState('');
  const available = EXPENSE_CATEGORIES.filter(c => c === budget?.category || !budgets.some(b => b.category === c));
  return <Modal title={budget ? 'Ajustar orçamento' : 'Planeje com tranquilidade'} subtitle="Defina quanto quer gastar por mês nesta categoria." onClose={onClose}><form className="transaction-form" onSubmit={e => { e.preventDefault(); const f = new FormData(e.currentTarget); const amount = parseMoney(String(f.get('amount'))); if (!amount) { setError('Digite um limite válido, como 500,00.'); return; } onSave({ category: String(f.get('category')), amount }); }}>
    <label>Categoria<select name="category" defaultValue={budget?.category}>{available.map(c => <option key={c}>{c}</option>)}</select></label>
    <label>Limite mensal (R$)<input name="amount" autoFocus inputMode="decimal" placeholder="500,00" defaultValue={budget ? (budget.amount / 100).toFixed(2).replace('.', ',') : ''} required /></label>
    <p className="form-note">Este limite será usado em todos os meses. Seus gastos são calculados automaticamente a partir das despesas.</p>
    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="modal-footer"><button type="button" className="button secondary" onClick={onClose}>Cancelar</button><button className="button primary" type="submit"><Check size={17} /> Salvar orçamento</button></div>
  </form></Modal>;
}

function CashChart({ transactions, month }: { transactions: Transaction[]; month: string }) {
  const [hover, setHover] = useState<string | null>(null);
  const months = Array.from({ length: 6 }, (_, i) => moveMonth(month, i - 5));
  const values = months.map(m => ({ month: m, ...totals(monthTransactions(transactions, m)) }));
  const maximum = Math.max(...values.map(v => Math.max(v.income, v.expense)), 100000);
  const step = Math.ceil(maximum / 400000) * 100000;
  const top = step * 4;
  return <div className="cash-chart" role="img" aria-label="Gráfico comparativo de receitas e despesas dos últimos seis meses">
    <div className="chart-y">{[4, 3, 2, 1, 0].map(i => <span key={i}>{i === 0 ? 'R$ 0' : `${(step * i / 100000).toLocaleString('pt-BR')} mil`}</span>)}</div>
    <div className="plot"><div className="grid-lines">{[0, 1, 2, 3, 4].map(i => <span key={i} />)}</div><div className="bar-groups">{values.map(v => <div className={`bar-group ${v.month === month ? 'current' : ''}`} key={v.month} onMouseEnter={() => setHover(v.month)} onMouseLeave={() => setHover(null)}>
      <button className="bar-hit" onFocus={() => setHover(v.month)} onBlur={() => setHover(null)} aria-label={`${monthName(v.month)}: receitas ${money(v.income)}, despesas ${money(v.expense)}`}><span className="bar income-bar" style={{ height: `${v.income / top * 100}%` }} /><span className="bar expense-bar" style={{ height: `${v.expense / top * 100}%` }} /></button>
      {hover === v.month && <div className="chart-tooltip"><strong>{monthName(v.month)}</strong><span>Receitas: {money(v.income)}</span><span>Despesas: {money(v.expense)}</span></div>}<span className="bar-label">{monthName(v.month, true).replace('.', '')}</span>
    </div>)}</div></div>
  </div>;
}

function SpendingChart({ transactions, onCategory }: { transactions: Transaction[]; onCategory: (category: string) => void }) {
  const expenses = totals(transactions).expense;
  const groups = EXPENSE_CATEGORIES.map(category => ({ category, amount: transactions.filter(t => t.kind === 'expense' && t.category === category).reduce((s, t) => s + t.amount, 0) })).filter(g => g.amount > 0).sort((a, b) => b.amount - a.amount);
  let previous = 0;
  const slices = groups.map(g => { const start = previous; previous += g.amount / expenses * 100; return `${categoryColors[g.category]} ${start}% ${previous}%`; });
  return <><div className="donut-wrap"><div className="donut" style={{ background: slices.length ? `conic-gradient(${slices.join(',')})` : '#e9eeea' }}><div className="donut-center"><span>Total de gastos</span><strong>{money(expenses)}</strong><small>neste mês</small></div></div></div>
    <div className="category-legend">{groups.slice(0, 4).map(g => <button key={g.category} onClick={() => onCategory(g.category)}><span className="legend-name"><i style={{ background: categoryColors[g.category] }} />{g.category}</span><span>{Math.round(g.amount / expenses * 100)}% <ChevronRight size={13} /></span></button>)}{groups.length === 0 && <p className="muted">Suas categorias aparecerão aqui.</p>}</div>
  </>;
}

function download(content: string, filename: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a'); link.href = url; link.download = filename; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function App() {
  const [initial] = useState(() => {
    try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) { const parsed: unknown = JSON.parse(raw); if (!validData(parsed)) throw new Error('invalid'); return { data: parsed, error: '' }; } return { data: seedData(), error: '' }; }
    catch { return { data: { version: 1, transactions: [], budgets: [], demo: false } as FinanceData, error: 'Não foi possível ler seus dados salvos. Importe um backup ou verifique o armazenamento do navegador.' }; }
  });
  const [data, setData] = useState<FinanceData>(initial.data);
  const [storageError, setStorageError] = useState(initial.error);
  const [page, setPage] = useState<Page>('overview');
  const [month, setMonth] = useState(today().slice(0, 7));
  const [mobileNav, setMobileNav] = useState(false);
  const [form, setForm] = useState<{ kind: Kind; transaction?: Transaction } | null>(null);
  const [budgetForm, setBudgetForm] = useState<{ budget?: Budget } | null>(null);
  const [confirm, setConfirm] = useState<{ title: string; message: string; action: () => void; label: string } | null>(null);
  const [help, setHelp] = useState(false);
  const [toast, setToast] = useState('');
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [tablePage, setTablePage] = useState(1);
  const importRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (initial.error) return; try { if (!localStorage.getItem(STORAGE_KEY)) localStorage.setItem(STORAGE_KEY, JSON.stringify(initial.data)); } catch { setStorageError('O navegador não permitiu salvar seus dados. Exporte um backup antes de sair.'); } }, [initial]);
  useEffect(() => { if (toast) { const timer = setTimeout(() => setToast(''), 4500); return () => clearTimeout(timer); } }, [toast]);
  useEffect(() => { setTablePage(1); }, [query, typeFilter, categoryFilter, month]);

  function persist(next: FinanceData, message: string) {
    setData(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); setStorageError(''); setToast(message); }
    catch { setStorageError('Não foi possível salvar neste navegador. Seus dados estão apenas nesta sessão. Exporte um backup antes de sair.'); }
  }
  function navigate(next: Page) { setPage(next); setMobileNav(false); setQuery(''); setTypeFilter('all'); setCategoryFilter('all'); setTablePage(1); }
  function saveTransaction(t: Transaction) {
    const exists = data.transactions.some(item => item.id === t.id);
    persist({ ...data, transactions: exists ? data.transactions.map(item => item.id === t.id ? t : item) : [...data.transactions, t] }, exists ? 'Transação atualizada.' : `${t.kind === 'expense' ? 'Despesa' : 'Receita'} adicionada. Tudo em dia!`);
    setMonth(t.date.slice(0, 7)); setForm(null);
  }
  function saveBudget(b: Budget) {
    persist({ ...data, budgets: [...data.budgets.filter(item => item.category !== b.category), b] }, 'Orçamento salvo. Um passo a mais para se organizar!'); setBudgetForm(null);
  }
  function startFresh() { setConfirm({ title: 'Pronto para começar?', message: 'Vamos remover todos os dados de exemplo, incluindo os orçamentos. Seu espaço ficará pronto para você registrar suas próprias finanças.', label: 'Sim, começar do zero', action: () => { persist({ version: 1, transactions: [], budgets: [], demo: false }, 'Seu espaço está pronto. Adicione sua primeira transação!'); setMonth(today().slice(0, 7)); navigate('overview'); } }); }
  const current = monthTransactions(data.transactions, month);
  const summary = totals(current);
  const budgetTotal = data.budgets.reduce((s, b) => s + b.amount, 0);
  const budgetSpent = current.filter(t => t.kind === 'expense' && data.budgets.some(b => b.category === t.category)).reduce((s, t) => s + t.amount, 0);
  const budgetLeft = budgetTotal - budgetSpent;
  const previousSummary = totals(monthTransactions(data.transactions, moveMonth(month, -1)));
  const expenseChange = previousSummary.expense ? (summary.expense - previousSummary.expense) / previousSummary.expense * 100 : null;
  const filtered = current.filter(t => (typeFilter === 'all' || t.kind === typeFilter) && (categoryFilter === 'all' || t.category === categoryFilter) && `${t.description} ${t.category} ${t.account} ${t.note}`.toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR'))).sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  const pageSize = page === 'overview' ? 5 : 10;
  const shown = filtered.slice((tablePage - 1) * pageSize, tablePage * pageSize);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  useEffect(() => { setTablePage(p => Math.min(p, totalPages)); }, [totalPages]);
  const budgetAvailable = EXPENSE_CATEGORIES.some(c => !data.budgets.some(b => b.category === c));
  function exportCSV() { download(toCSV(filtered), `calma-transacoes-${month}.csv`, 'text/csv;charset=utf-8;'); setToast('Exportação pronta para download.'); }
  const menuItems: { key: Page; icon: typeof House }[] = [{ key: 'overview', icon: LayoutDashboard }, { key: 'transactions', icon: ArrowLeftRight }, { key: 'budgets', icon: ChartNoAxesColumnIncreasing }];

  return <div className="app-shell">
    {mobileNav && <div className="nav-overlay" onClick={() => setMobileNav(false)} />}
    <aside className={`sidebar ${mobileNav ? 'open' : ''}`}>
      <a className="brand" href="#" onClick={e => { e.preventDefault(); navigate('overview'); }} aria-label="Calma, início"><span className="brand-icon"><Leaf size={23} fill="currentColor" /></span>calma<span className="brand-period">.</span></a>
      <div className="workspace-label"><span className="workspace-icon"><Wallet size={17} /></span><div>Meu espaço <small>Finanças pessoais</small></div><span className="workspace-dot" /></div>
      <div className="nav-label">ORGANIZE SEU DIA</div>
      <nav aria-label="Navegação principal">{menuItems.map(({ key, icon: Icon }) => <button key={key} className={`nav-item ${page === key ? 'active' : ''}`} onClick={() => navigate(key)} aria-current={page === key ? 'page' : undefined}><Icon size={19} strokeWidth={1.7} />{titles[key]}{page === key && <span className="nav-active-dot" />}</button>)}</nav>
      <div className="sidebar-bottom"><div className="calm-note"><div className="note-illustration"><Sprout size={34} strokeWidth={1.3} /><span className="note-circle one" /><span className="note-circle two" /></div><h3>Um passo de cada vez.</h3><p>Pequenos hábitos hoje.<br />Mais tranquilidade amanhã.</p><button onClick={() => setHelp(true)}>Conheça a Calma <ArrowUpRight size={14} /></button></div>
        <button className={`nav-item ${page === 'data' ? 'active' : ''}`} onClick={() => navigate('data')}><Database size={18} strokeWidth={1.7} />Seus dados</button><button className="nav-item help-link" onClick={() => setHelp(true)}><CircleHelp size={18} strokeWidth={1.7} />Como funciona</button>
        <div className="sidebar-foot"><span className="user-avatar">EU</span><div>Meu perfil<small>Uma vida mais leve</small></div><Leaf size={15} /></div>
      </div>
    </aside>
    <div className="main-shell"><header className="topbar"><div className="breadcrumb"><button className="icon-button mobile-menu" onClick={() => setMobileNav(true)} aria-label="Abrir menu"><Menu size={21} /></button><span>Meu espaço</span><ChevronRight size={13} /><strong>{titles[page]}</strong></div><div className="topbar-right"><span className={`saved-status ${storageError ? 'error' : ''}`}><span />{storageError ? 'Salvamento indisponível' : 'Salvo neste dispositivo'}</span><span className="topbar-separator" /><span className="mini-avatar">EU</span></div></header>
      <main>
        {storageError && <div className="storage-error" role="alert"><CircleAlert size={18} /><span>{storageError}</span><button onClick={() => navigate('data')}>Fazer backup <ArrowRight size={14} /></button></div>}
        <div className="page-heading"><div><p className="eyebrow">SEU DINHEIRO, COM CALMA</p><h1>{titles[page]}<span className="heading-dot">.</span></h1><p className="page-subtitle">{page === 'overview' ? 'Mais clareza para hoje. Mais tranquilidade para amanhã.' : page === 'transactions' ? 'Cada movimento conta. Acompanhe os seus por aqui.' : page === 'budgets' ? 'Dê um destino ao seu dinheiro, antes de ele ir.' : 'Seu dinheiro é pessoal. Seus dados também.'}</p></div>
          <div className="heading-actions">{page !== 'data' && <div className="month-control"><button onClick={() => setMonth(moveMonth(month, -1))} className="icon-button" aria-label="Mês anterior"><ChevronLeft size={15} /></button><label className="month-select"><span>{monthName(month)}</span><input aria-label="Selecionar mês" type="month" value={month} min="2000-01" max="2100-12" onChange={e => { if (e.target.value) setMonth(e.target.value); }} /><ChevronDown size={14} /></label><button onClick={() => setMonth(moveMonth(month, 1))} className="icon-button" aria-label="Próximo mês"><ChevronRight size={15} /></button></div>}{page !== 'data' && <button className="button primary" onClick={() => page === 'budgets' ? setBudgetForm({}) : setForm({ kind: 'expense' })} disabled={page === 'budgets' && !budgetAvailable}><Plus size={18} />{page === 'budgets' ? 'Novo orçamento' : 'Nova transação'}</button>}</div>
        </div>

        {data.demo && <div className="demo-banner"><span className="demo-badge"><span />EXPERIMENTE</span><p>Uma prévia da sua vida mais organizada. <span>Estes são dados de exemplo.</span></p><button onClick={startFresh}>Usar meus dados <ArrowRight size={15} /></button></div>}

        {(page === 'overview' || page === 'transactions') && <>
          <section className="summary-grid" aria-label="Resumo financeiro do mês">
            <div className="summary-card balance-card"><div className="card-label">Saldo do mês <span className="stat-icon"><Wallet size={18} /></span></div><strong className="stat-amount">{money(summary.balance)}</strong><div className="stat-foot"><span className="balance-dot" />{summary.balance >= 0 ? 'Um respiro para os seus planos' : 'Vamos equilibrar as contas?'}</div><div className="balance-decoration" /></div>
            <div className="summary-card"><div className="card-label">Receitas <span className="stat-icon income"><ArrowDownLeft size={20} /></span></div><strong className="stat-amount">{money(summary.income)}</strong><div className="stat-foot"><span className="tiny-dot income" />{current.filter(t => t.kind === 'income').length} entradas neste mês</div></div>
            <div className="summary-card"><div className="card-label">Despesas <span className="stat-icon expense"><ArrowUpRight size={20} /></span></div><strong className="stat-amount">{money(summary.expense)}</strong><div className={`stat-foot ${expenseChange !== null && expenseChange <= 0 ? 'positive' : ''}`}>{expenseChange !== null ? <><TrendingUp size={13} className={expenseChange < 0 ? 'rotate-down' : ''} />{Math.abs(expenseChange).toFixed(1).replace('.', ',')}% {expenseChange <= 0 ? 'a menos' : 'a mais'} que no mês anterior</> : <><span className="tiny-dot expense" />{current.filter(t => t.kind === 'expense').length} saídas neste mês</>}</div></div>
            <div className="summary-card"><div className="card-label">Disponível no orçamento <span className="stat-icon budget"><PiggyBank size={19} /></span></div><strong className="stat-amount">{budgetTotal ? money(budgetLeft) : '—'}</strong><div className="stat-foot">{budgetTotal ? <><span className="tiny-dot budget" />de {money(budgetTotal)} planejados</> : <button className="text-button" onClick={() => navigate('budgets')}>Definir meu orçamento <ArrowRight size={13} /></button>}</div></div>
          </section>
          {page === 'overview' && <section className="charts-grid"><article className="panel flow-panel"><div className="panel-heading"><div><h2>Seu dinheiro em movimento</h2><p>Uma visão dos últimos seis meses</p></div><div className="chart-legend"><span><i className="income" />Receitas</span><span><i className="expense" />Despesas</span></div></div><CashChart transactions={data.transactions} month={month} /><div className="chart-insight"><span className="insight-icon"><Leaf size={15} /></span>{summary.income > 0 && summary.balance >= 0 ? <p>Você guardou <strong>{Math.round(summary.balance / summary.income * 100)}% da sua receita</strong> neste mês. Cada passo faz diferença.</p> : summary.expense > 0 ? <p>Acompanhar os gastos é o primeiro passo para <strong>encontrar seu equilíbrio.</strong></p> : <p>Adicione uma transação e comece a <strong>cuidar dos seus próximos passos.</strong></p>}</div></article>
            <article className="panel spending-panel"><div className="panel-heading"><div><h2>Para onde foi?</h2><p>Suas despesas por categoria</p></div><span className="round-icon"><ChartNoAxesColumnIncreasing size={17} /></span></div><SpendingChart transactions={current} onCategory={category => { navigate('transactions'); setCategoryFilter(category); setShowFilters(true); }} /></article>
          </section>}
          <section className="panel transactions-panel"><div className="panel-heading"><div><h2>{page === 'overview' ? 'Últimas transações' : 'Suas transações'}<span className="count-badge">{current.length}</span></h2><p>{page === 'overview' ? 'Os pequenos movimentos do seu dia a dia' : 'Tudo o que entrou e saiu, em um só lugar'}</p></div>{page === 'overview' ? <button className="text-button" onClick={() => navigate('transactions')}>Ver todas <ArrowRight size={15} /></button> : <button className="button secondary compact" onClick={exportCSV}><Download size={15} /> Exportar CSV</button>}</div>
            <div className="table-tools"><div className="segmented-tabs" aria-label="Tipo de transação">{[{ value: 'all', label: 'Todas' }, { value: 'expense', label: 'Despesas' }, { value: 'income', label: 'Receitas' }].map(t => <button key={t.value} className={typeFilter === t.value ? 'selected' : ''} onClick={() => setTypeFilter(t.value)} aria-pressed={typeFilter === t.value}>{t.label}</button>)}</div><div className="table-search-actions"><div className="search-field"><Search size={16} /><input aria-label="Buscar transação" placeholder="Buscar transação..." value={query} onChange={e => setQuery(e.target.value)} />{query && <button className="icon-button" onClick={() => setQuery('')} aria-label="Limpar busca"><X size={13} /></button>}</div><button className={`filter-button ${showFilters || categoryFilter !== 'all' ? 'active' : ''}`} onClick={() => setShowFilters(!showFilters)} aria-expanded={showFilters}><SlidersHorizontal size={15} /><span>Filtros</span>{categoryFilter !== 'all' && <i />}</button></div></div>
            {showFilters && <div className="filter-row"><label>Categoria<select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}><option value="all">Todas as categorias</option>{Array.from(new Set([...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES])).map(c => <option key={c}>{c}</option>)}</select></label><button className="text-button" onClick={() => { setCategoryFilter('all'); setTypeFilter('all'); setQuery(''); }}>Limpar filtros <X size={13} /></button></div>}
            <div className="table-wrap"><table><thead><tr><th>Descrição</th><th>Categoria</th><th>Data <ChevronDown size={12} /></th><th>Conta</th><th className="amount-cell">Valor</th><th><span className="sr-only">Ações</span></th></tr></thead><tbody>{shown.map(t => <tr key={t.id}><td><div className="description-cell"><IconCategory category={t.category} /><div><strong>{t.description}</strong><small>{t.kind === 'income' ? 'Receita' : 'Despesa'}<span className="mobile-date"> · {displayDate(t.date)}</span>{t.note ? ` · ${t.note}` : ''}</small></div></div></td><td><span className="category-tag">{t.category}</span></td><td className="date-cell">{displayDate(t.date)}</td><td className="account-cell"><span className={`account-dot ${t.account === 'Conta principal' ? 'green' : t.account === 'Dinheiro' ? 'gold' : 'purple'}`} />{t.account}</td><td className={`amount-cell transaction-amount ${t.kind}`}>{t.kind === 'income' ? '+' : '−'} {money(t.amount)}</td><td><div className="row-actions"><button className="icon-button" onClick={() => setForm({ kind: t.kind, transaction: t })} aria-label={`Editar ${t.description}`} title="Editar"><Pencil size={14} /></button><button className="icon-button delete-button" onClick={() => setConfirm({ title: 'Excluir esta transação?', message: `“${t.description}”, no valor de ${money(t.amount)}, será removida. Seus totais serão atualizados.`, label: 'Excluir transação', action: () => persist({ ...data, transactions: data.transactions.filter(item => item.id !== t.id) }, 'Transação excluída.') })} aria-label={`Excluir ${t.description}`} title="Excluir"><Trash2 size={14} /></button></div></td></tr>)}</tbody></table></div>
            {shown.length === 0 && <div className="empty-state"><span><FolderOpen size={30} strokeWidth={1.3} /></span><h3>{current.length ? 'Nenhuma transação encontrada' : 'Um novo começo por aqui'}</h3><p>{current.length ? 'Tente outra busca ou ajuste os filtros.' : 'Registre sua primeira receita ou despesa deste mês.'}</p>{current.length ? <button className="button secondary" onClick={() => { setQuery(''); setTypeFilter('all'); setCategoryFilter('all'); }}>Limpar filtros</button> : <button className="button primary" onClick={() => setForm({ kind: 'expense' })}><Plus size={17} />Adicionar transação</button>}</div>}
            {filtered.length > 0 && <div className="table-footer"><span>Mostrando <strong>{(tablePage - 1) * pageSize + 1}–{Math.min(tablePage * pageSize, filtered.length)}</strong> de {filtered.length} transações</span><div><button className="icon-button" disabled={tablePage <= 1} onClick={() => setTablePage(tablePage - 1)} aria-label="Página anterior"><ChevronLeft size={16} /></button><span>{tablePage} <span>/ {totalPages}</span></span><button className="icon-button" disabled={tablePage >= totalPages} onClick={() => setTablePage(tablePage + 1)} aria-label="Próxima página"><ChevronRight size={16} /></button></div></div>}
          </section>
          {page === 'overview' && <div className="bottom-note"><span><Sprout size={16} />Organizar seu dinheiro é uma forma de cuidar de você.</span><span>Um dia de cada vez.</span></div>}
        </>}

        {page === 'budgets' && <><div className="budget-intro"><span className="budget-hero-icon"><PiggyBank size={32} strokeWidth={1.4} /></span><div><p>SEU PLANEJAMENTO DO MÊS</p><h2>{money(budgetSpent)} <span>de {money(budgetTotal)}</span></h2><span>{budgetTotal ? budgetLeft >= 0 ? `Você ainda tem ${money(budgetLeft)} nos seus orçamentos.` : `Você ultrapassou seus orçamentos em ${money(-budgetLeft)}.` : 'Comece definindo um limite para uma categoria.'} Despesas sem orçamento não entram neste total.</span></div></div><section className="budgets-grid">{data.budgets.map(b => { const spent = current.filter(t => t.kind === 'expense' && t.category === b.category).reduce((s, t) => s + t.amount, 0); const percentage = Math.round(spent / b.amount * 100); return <article className="panel budget-card" key={b.category}><div className="budget-card-head"><IconCategory category={b.category} /><h2>{b.category}</h2><div className="row-actions"><button className="icon-button" aria-label={`Editar orçamento de ${b.category}`} onClick={() => setBudgetForm({ budget: b })}><Pencil size={15} /></button><button className="icon-button delete-button" aria-label={`Excluir orçamento de ${b.category}`} onClick={() => setConfirm({ title: 'Remover este orçamento?', message: `O limite de ${b.category} será removido. Suas transações serão mantidas.`, label: 'Remover orçamento', action: () => persist({ ...data, budgets: data.budgets.filter(item => item.category !== b.category) }, 'Orçamento removido.') })}><Trash2 size={15} /></button></div></div><div className="budget-values"><strong>{money(spent)}</strong><span>de {money(b.amount)}</span></div><div className={`progress-track ${percentage > 100 ? 'over' : percentage >= 80 ? 'near' : ''}`}><span style={{ width: `${Math.min(percentage, 100)}%` }} /></div><div className={`budget-status ${percentage > 100 ? 'over' : ''}`}><span>{percentage}% utilizado</span><span>{spent > b.amount ? `${money(spent - b.amount)} acima` : `${money(b.amount - spent)} disponíveis`}</span></div></article>; })}{budgetAvailable && <button className="add-budget-card" onClick={() => setBudgetForm({})}><span><Plus size={24} /></span><strong>Um novo plano</strong><p>Defina um limite para outra categoria</p></button>}</section></>}

        {page === 'data' && <div className="data-layout"><section className="panel data-panel"><span className="data-feature-icon"><ShieldCheck size={28} strokeWidth={1.5} /></span><h2>Seus dados ficam com você.</h2><p>A Calma salva suas informações neste navegador, neste dispositivo. Não é preciso criar uma conta. Para levar seus dados a outro lugar ou protegê-los, faça um backup regularmente.</p><div className="data-stats"><span><strong>{data.transactions.length}</strong>transações</span><span><strong>{data.budgets.length}</strong>orçamentos</span><span><strong>BRL</strong>real brasileiro</span></div><div className="data-action"><div><h3>Guardar uma cópia</h3><p>O backup inclui todas as transações e orçamentos.</p></div><button className="button primary" onClick={() => { download(JSON.stringify(data, null, 2), `calma-backup-${today()}.json`, 'application/json'); setToast('Backup pronto para download.'); }}><Download size={16} />Fazer backup</button></div><div className="data-action"><div><h3>Restaurar um backup</h3><p>Substitui os dados atuais pelos dados do arquivo.</p></div><button className="button secondary" onClick={() => importRef.current?.click()}><Upload size={16} />Importar backup</button><input type="file" accept=".json,application/json" ref={importRef} hidden onChange={async e => { const file = e.target.files?.[0]; e.target.value = ''; if (!file) return; try { if (file.size > 10000000) throw new Error(); const parsed: unknown = JSON.parse(await file.text()); if (!validData(parsed)) throw new Error(); setConfirm({ title: 'Restaurar este backup?', message: `O arquivo contém ${parsed.transactions.length} transações e ${parsed.budgets.length} orçamentos. Os dados atuais serão substituídos. Faça um backup antes, caso queira mantê-los.`, label: 'Restaurar backup', action: () => persist(parsed, 'Backup restaurado com sucesso.') }); } catch { setToast('Arquivo inválido. Selecione um backup JSON exportado pela Calma.'); } }} /></div><div className="data-action"><div><h3>Planilha do mês</h3><p>Exporte as transações de {monthName(month)} em CSV.</p></div><button className="button secondary" onClick={exportCSV}><Download size={16} />Exportar CSV</button></div></section><aside className="panel data-aside"><Leaf size={30} strokeWidth={1.4} /><h2>Um espaço só seu</h2><p>Se limpar os dados do navegador, trocar de dispositivo ou usar uma janela anônima, suas informações podem não estar aqui na próxima visita.</p><p>Baixe um backup para continuar de onde parou.</p><hr /><h3>{data.demo ? 'Vamos deixar com a sua cara?' : 'Precisa recomeçar?'}</h3><p>{data.demo ? 'Remova os exemplos e registre suas próprias finanças.' : 'Apague as transações e os orçamentos para começar do zero.'}</p><button className="button secondary" onClick={() => data.demo ? startFresh() : setConfirm({ title: 'Apagar todos os dados?', message: 'Todas as transações e orçamentos serão apagados deste navegador. Essa ação não pode ser desfeita. Faça um backup antes de continuar.', label: 'Apagar e recomeçar', action: () => persist({ version: 1, transactions: [], budgets: [], demo: false }, 'Dados removidos. Um novo começo.') })}>{data.demo ? 'Usar meus dados' : 'Apagar e recomeçar'}<ArrowRight size={15} /></button></aside></div>}
        <footer className="main-footer"><span>calma<span>.</span><small>Finanças leves. Vida leve.</small></span><span><ShieldCheck size={13} />Seu espaço pessoal, sem complicação.</span></footer>
      </main>
    </div>
    {form && <TransactionForm transaction={form.transaction} initialKind={form.kind} initialMonth={month} onSave={saveTransaction} onClose={() => setForm(null)} />}
    {budgetForm && <BudgetForm budget={budgetForm.budget} budgets={data.budgets} onSave={saveBudget} onClose={() => setBudgetForm(null)} />}
    {confirm && <Modal title={confirm.title} onClose={() => setConfirm(null)}><p className="confirm-message">{confirm.message}</p><div className="modal-footer"><button className="button secondary" onClick={() => setConfirm(null)}>Cancelar</button><button className="button primary" onClick={() => { confirm.action(); setConfirm(null); }}>{confirm.label}</button></div></Modal>}
    {help && <Modal title="Menos planilhas. Mais calma." subtitle="Seu dinheiro, com um pouco mais de clareza." onClose={() => setHelp(false)}><div className="help-steps"><div><span>01</span><section><h3>Registre os pequenos movimentos</h3><p>Use “Nova transação” para adicionar receitas e despesas. Basta um valor, uma descrição e uma categoria.</p></section></div><div><span>02</span><section><h3>Encontre seu ritmo</h3><p>Acompanhe seu saldo do mês e veja para onde o dinheiro vai. Use os orçamentos para planejar limites por categoria.</p></section></div><div><span>03</span><section><h3>Cuide do que é seu</h3><p>Os dados ficam neste navegador. Em “Seus dados”, baixe um backup para guardar ou transferir suas informações.</p></section></div></div><div className="help-note"><ShieldCheck size={18} /><span>As transações representam os valores registrados. Não há conexão automática com bancos ou cálculo de faturas.</span></div><div className="modal-footer"><button className="button primary" onClick={() => setHelp(false)}>Vamos começar <ArrowRight size={16} /></button></div></Modal>}
    {toast && <div className="toast" role="status"><CheckCircle2 size={19} /><span>{toast}</span><button aria-label="Fechar mensagem" onClick={() => setToast('')}><X size={15} /></button></div>}
  </div>;
}
