export type ThemeName =
  | 'Light'
  | 'Dark'
  | 'AMOLED'
  | 'Ocean'
  | 'Forest'
  | 'Purple'
  | 'Sunset'
  | 'Midnight';

export type TransactionType = 'income' | 'expense';

export type PaymentMethod =
  | 'Apple Pay'
  | 'Card'
  | 'Cash'
  | 'Bank'
  | 'UPI'
  | 'Wallet'
  | 'Other';

export type CurrencyCode = 'USD' | 'INR' | 'EUR' | 'GBP' | 'JPY';
export type LanguageCode = 'English' | 'Hindi' | 'Spanish' | 'French' | 'German';

export type Category = {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: TransactionType | 'both';
  isDefault?: boolean;
};

export type Transaction = {
  id: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  date: string;
  notes: string;
  paymentMethod: PaymentMethod;
  tags: string[];
  receiptImageUri?: string;
};

export type Budget = {
  id: string;
  categoryId: string;
  monthlyLimit: number;
  alertAtPercent: number;
};

export type SavingsGoal = {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  color: string;
  deadline: string;
};

export type AppSettings = {
  theme: ThemeName;
  currency: CurrencyCode;
  language: LanguageCode;
  passcodeEnabled: boolean;
  passcodeCode: string;
  biometricsEnabled: boolean;
  highContrast: boolean;
  selectedAppIcon: 'Aurora' | 'Graphite' | 'Mint' | 'Solar';
};

export type AppState = {
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  goals: SavingsGoal[];
  settings: AppSettings;
};

export type SortMode = 'Newest' | 'Oldest' | 'Amount High' | 'Amount Low';

export type ThemeTokens = {
  name: ThemeName;
  isDark: boolean;
  background: string;
  background2: string;
  surface: string;
  elevated: string;
  glass: string;
  text: string;
  muted: string;
  subtle: string;
  border: string;
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  danger: string;
  chart: string[];
  shadow: string;
  gradient: [string, string, ...string[]];
};
