import { AppState, Budget, Category, CurrencyCode, Transaction } from '../types';

export const formatMoney = (value: number, currency: CurrencyCode) =>
  new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);

export const uid = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const startOfMonth = (date = new Date()) => new Date(date.getFullYear(), date.getMonth(), 1);

export const isSameMonth = (isoDate: string, now = new Date()) => {
  const date = new Date(isoDate);
  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
};

export const isSameDay = (isoDate: string, day: Date) => {
  const date = new Date(isoDate);
  return (
    date.getDate() === day.getDate() &&
    date.getMonth() === day.getMonth() &&
    date.getFullYear() === day.getFullYear()
  );
};

export const categoryFor = (categories: Category[], categoryId: string) =>
  categories.find(category => category.id === categoryId) ?? categories[categories.length - 1];

export const sumTransactions = (transactions: Transaction[], type?: Transaction['type']) =>
  transactions
    .filter(transaction => (type ? transaction.type === type : true))
    .reduce((sum, transaction) => sum + transaction.amount, 0);

export const monthlyTransactions = (transactions: Transaction[]) =>
  transactions.filter(transaction => isSameMonth(transaction.date));

export const spentForBudget = (budget: Budget, state: AppState) =>
  monthlyTransactions(state.transactions)
    .filter(transaction => transaction.type === 'expense' && transaction.categoryId === budget.categoryId)
    .reduce((sum, transaction) => sum + transaction.amount, 0);

export const getMetrics = (state: AppState) => {
  const month = monthlyTransactions(state.transactions);
  const allIncome = sumTransactions(state.transactions, 'income');
  const allExpenses = sumTransactions(state.transactions, 'expense');
  const monthlyIncome = sumTransactions(month, 'income');
  const monthlyExpenses = sumTransactions(month, 'expense');
  const totalBudget = state.budgets.reduce((sum, budget) => sum + budget.monthlyLimit, 0);
  const budgetRemaining = Math.max(totalBudget - monthlyExpenses, 0);
  const savings = monthlyIncome - monthlyExpenses;
  const budgetScore = totalBudget > 0 ? Math.max(0, 100 - (monthlyExpenses / totalBudget) * 70) : 85;
  const savingsScore = monthlyIncome > 0 ? Math.min(100, Math.max(0, (savings / monthlyIncome) * 100 + 55)) : 60;
  const healthScore = Math.round((budgetScore + savingsScore) / 2);

  return {
    balance: allIncome - allExpenses,
    monthlyIncome,
    monthlyExpenses,
    savings,
    totalBudget,
    budgetRemaining,
    healthScore,
  };
};

export const categoryTotals = (transactions: Transaction[], categories: Category[]) =>
  categories
    .map(category => ({
      category,
      value: transactions
        .filter(transaction => transaction.type === 'expense' && transaction.categoryId === category.id)
        .reduce((sum, transaction) => sum + transaction.amount, 0),
    }))
    .filter(item => item.value > 0)
    .sort((a, b) => b.value - a.value);

export const lastNDays = (transactions: Transaction[], days: number) => {
  const buckets = Array.from({ length: days }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (days - index - 1));
    return { label: date.toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 2), date, value: 0 };
  });

  transactions
    .filter(transaction => transaction.type === 'expense')
    .forEach(transaction => {
      const bucket = buckets.find(item => isSameDay(transaction.date, item.date));
      if (bucket) bucket.value += transaction.amount;
    });

  return buckets;
};

export const monthlyTrend = (transactions: Transaction[]) => {
  const now = new Date();
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    const monthItems = transactions.filter(transaction => {
      const itemDate = new Date(transaction.date);
      return itemDate.getMonth() === date.getMonth() && itemDate.getFullYear() === date.getFullYear();
    });
    return {
      label: date.toLocaleDateString(undefined, { month: 'short' }),
      income: sumTransactions(monthItems, 'income'),
      expense: sumTransactions(monthItems, 'expense'),
    };
  });
};

export const toCsv = (state: AppState) => {
  const header = ['id', 'date', 'type', 'amount', 'category', 'paymentMethod', 'notes', 'tags'];
  const rows = state.transactions.map(transaction => {
    const category = categoryFor(state.categories, transaction.categoryId);
    return [
      transaction.id,
      transaction.date,
      transaction.type,
      String(transaction.amount),
      category.name,
      transaction.paymentMethod,
      transaction.notes.replaceAll('"', '""'),
      transaction.tags.join('|'),
    ];
  });
  return [header, ...rows].map(row => row.map(value => `"${value}"`).join(',')).join('\n');
};

export const parseTags = (value: string) =>
  value
    .split(',')
    .map(tag => tag.trim())
    .filter(Boolean);
