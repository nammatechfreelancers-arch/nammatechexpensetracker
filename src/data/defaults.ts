import { AppSettings, AppState, Budget, Category, SavingsGoal, Transaction } from '../types';

export const defaultSettings: AppSettings = {
  theme: 'Light',
  currency: 'INR',
  language: 'English',
  passcodeEnabled: false,
  passcodeCode: '',
  biometricsEnabled: false,
  highContrast: false,
  selectedAppIcon: 'Aurora',
};

export const defaultCategories: Category[] = [
  { id: 'food', name: 'Food', icon: 'utensils', color: '#EF4444', type: 'expense', isDefault: true },
  { id: 'transport', name: 'Transport', icon: 'car', color: '#3B82F6', type: 'expense', isDefault: true },
  { id: 'shopping', name: 'Shopping', icon: 'shopping-bag', color: '#EC4899', type: 'expense', isDefault: true },
  { id: 'bills', name: 'Bills', icon: 'receipt', color: '#F97316', type: 'expense', isDefault: true },
  { id: 'entertainment', name: 'Entertainment', icon: 'sparkles', color: '#8B5CF6', type: 'expense', isDefault: true },
  { id: 'travel', name: 'Travel', icon: 'plane', color: '#06B6D4', type: 'expense', isDefault: true },
  { id: 'health', name: 'Health', icon: 'heart-pulse', color: '#10B981', type: 'expense', isDefault: true },
  { id: 'education', name: 'Education', icon: 'graduation-cap', color: '#6366F1', type: 'expense', isDefault: true },
  { id: 'salary', name: 'Salary', icon: 'briefcase', color: '#22C55E', type: 'income', isDefault: true },
  { id: 'business', name: 'Business', icon: 'building-2', color: '#14B8A6', type: 'income', isDefault: true },
  { id: 'investment', name: 'Investment', icon: 'trending-up', color: '#84CC16', type: 'income', isDefault: true },
  { id: 'other', name: 'Other', icon: 'circle-dollar-sign', color: '#64748B', type: 'both', isDefault: true },
];

const iso = (daysAgo: number) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
};

export const seedTransactions: Transaction[] = [
  {
    id: 'txn-1',
    amount: 5200,
    type: 'income',
    categoryId: 'salary',
    date: iso(2),
    notes: 'Monthly salary',
    paymentMethod: 'Bank',
    tags: ['work', 'recurring'],
  },
  {
    id: 'txn-2',
    amount: 74.5,
    type: 'expense',
    categoryId: 'food',
    date: iso(1),
    notes: 'Dinner and groceries',
    paymentMethod: 'Apple Pay',
    tags: ['home'],
  },
  {
    id: 'txn-3',
    amount: 49,
    type: 'expense',
    categoryId: 'transport',
    date: iso(4),
    notes: 'Metro card refill',
    paymentMethod: 'Card',
    tags: ['commute'],
  },
  {
    id: 'txn-4',
    amount: 129.99,
    type: 'expense',
    categoryId: 'shopping',
    date: iso(6),
    notes: 'Running shoes',
    paymentMethod: 'Card',
    tags: ['fitness'],
  },
  {
    id: 'txn-5',
    amount: 210,
    type: 'expense',
    categoryId: 'bills',
    date: iso(8),
    notes: 'Electricity and internet',
    paymentMethod: 'Bank',
    tags: ['utilities'],
  },
  {
    id: 'txn-6',
    amount: 620,
    type: 'income',
    categoryId: 'business',
    date: iso(9),
    notes: 'Freelance milestone',
    paymentMethod: 'Bank',
    tags: ['client'],
  },
  {
    id: 'txn-7',
    amount: 36,
    type: 'expense',
    categoryId: 'entertainment',
    date: iso(11),
    notes: 'Movie night',
    paymentMethod: 'Wallet',
    tags: ['weekend'],
  },
  {
    id: 'txn-8',
    amount: 180,
    type: 'expense',
    categoryId: 'health',
    date: iso(14),
    notes: 'Dental appointment',
    paymentMethod: 'Card',
    tags: ['care'],
  },
  {
    id: 'txn-9',
    amount: 350,
    type: 'income',
    categoryId: 'investment',
    date: iso(16),
    notes: 'Dividend payout',
    paymentMethod: 'Bank',
    tags: ['portfolio'],
  },
];

export const seedBudgets: Budget[] = [
  { id: 'budget-food', categoryId: 'food', monthlyLimit: 650, alertAtPercent: 80 },
  { id: 'budget-transport', categoryId: 'transport', monthlyLimit: 220, alertAtPercent: 75 },
  { id: 'budget-shopping', categoryId: 'shopping', monthlyLimit: 500, alertAtPercent: 80 },
  { id: 'budget-bills', categoryId: 'bills', monthlyLimit: 420, alertAtPercent: 90 },
  { id: 'budget-entertainment', categoryId: 'entertainment', monthlyLimit: 240, alertAtPercent: 80 },
];

export const seedGoals: SavingsGoal[] = [
  {
    id: 'goal-emergency',
    title: 'Emergency Fund',
    targetAmount: 12000,
    currentAmount: 7400,
    color: '#0F766E',
    deadline: new Date(new Date().getFullYear(), 11, 31).toISOString(),
  },
  {
    id: 'goal-travel',
    title: 'Japan Trip',
    targetAmount: 4200,
    currentAmount: 1850,
    color: '#7C3AED',
    deadline: new Date(new Date().getFullYear() + 1, 2, 15).toISOString(),
  },
];

export const initialAppState: AppState = {
  transactions: [],
  categories: defaultCategories,
  budgets: [],
  goals: [],
  settings: defaultSettings,
};
