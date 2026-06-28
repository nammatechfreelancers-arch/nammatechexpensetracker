import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState } from 'react';
import { AppState, AppSettings, Budget, Category, SavingsGoal, Transaction } from '../types';
import { initialAppState } from '../data/defaults';
import { getMetrics, uid } from '../utils/finance';

const STORAGE_KEY = '@lumora-expense-tracker/state/v3';

const hapticLight = async () => {
  if (Platform.OS === 'web') return;
  try {
    const H = await import('expo-haptics');
    H.impactAsync(H.ImpactFeedbackStyle.Light);
  } catch {}
};

const hapticSuccess = async () => {
  if (Platform.OS === 'web') return;
  try {
    const H = await import('expo-haptics');
    H.notificationAsync(H.NotificationFeedbackType.Success);
  } catch {}
};

const hapticWarning = async () => {
  if (Platform.OS === 'web') return;
  try {
    const H = await import('expo-haptics');
    H.notificationAsync(H.NotificationFeedbackType.Warning);
  } catch {}
};

type AppAction =
  | { type: 'hydrate'; payload: AppState }
  | { type: 'addTransaction'; payload: Transaction }
  | { type: 'updateTransaction'; payload: Transaction }
  | { type: 'deleteTransaction'; payload: string }
  | { type: 'duplicateTransaction'; payload: string }
  | { type: 'addCategory'; payload: Category }
  | { type: 'upsertBudget'; payload: Budget }
  | { type: 'deleteBudget'; payload: string }
  | { type: 'addGoal'; payload: SavingsGoal }
  | { type: 'updateGoal'; payload: SavingsGoal }
  | { type: 'deleteGoal'; payload: string }
  | { type: 'updateSettings'; payload: Partial<AppSettings> }
  | { type: 'replaceState'; payload: AppState };

type StoreContextValue = {
  state: AppState;
  metrics: ReturnType<typeof getMetrics>;
  isHydrated: boolean;
  dispatch: React.Dispatch<AppAction>;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  updateTransaction: (transaction: Transaction) => void;
  deleteTransaction: (id: string) => void;
  duplicateTransaction: (id: string) => void;
  addCategory: (category: Omit<Category, 'id' | 'isDefault'>) => void;
  upsertBudget: (budget: Omit<Budget, 'id'> & { id?: string }) => void;
  addGoal: (goal: Omit<SavingsGoal, 'id'>) => void;
  updateGoal: (goal: SavingsGoal) => void;
  deleteGoal: (id: string) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  importState: (state: unknown) => boolean;
};

const StoreContext = createContext<StoreContextValue | undefined>(undefined);

const reducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'hydrate':
    case 'replaceState':
      return action.payload;
    case 'addTransaction':
      return { ...state, transactions: [action.payload, ...state.transactions] };
    case 'updateTransaction':
      return {
        ...state,
        transactions: state.transactions.map(transaction =>
          transaction.id === action.payload.id ? action.payload : transaction,
        ),
      };
    case 'deleteTransaction':
      return { ...state, transactions: state.transactions.filter(transaction => transaction.id !== action.payload) };
    case 'duplicateTransaction': {
      const original = state.transactions.find(transaction => transaction.id === action.payload);
      if (!original) return state;
      return {
        ...state,
        transactions: [{ ...original, id: uid('txn'), date: new Date().toISOString() }, ...state.transactions],
      };
    }
    case 'addCategory':
      return { ...state, categories: [...state.categories, action.payload] };
    case 'upsertBudget': {
      const exists = state.budgets.some(budget => budget.id === action.payload.id);
      return {
        ...state,
        budgets: exists
          ? state.budgets.map(budget => (budget.id === action.payload.id ? action.payload : budget))
          : [...state.budgets, action.payload],
      };
    }
    case 'deleteBudget':
      return { ...state, budgets: state.budgets.filter(budget => budget.id !== action.payload) };
    case 'addGoal':
      return { ...state, goals: [...state.goals, action.payload] };
    case 'updateGoal':
      return { ...state, goals: state.goals.map(goal => (goal.id === action.payload.id ? action.payload : goal)) };
    case 'deleteGoal':
      return { ...state, goals: state.goals.filter(goal => goal.id !== action.payload) };
    case 'updateSettings':
      return { ...state, settings: { ...state.settings, ...action.payload } };
    default:
      return state;
  }
};

const isValidState = (value: unknown): value is AppState => {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<AppState>;
  return (
    Array.isArray(candidate.transactions) &&
    Array.isArray(candidate.categories) &&
    Array.isArray(candidate.budgets) &&
    Array.isArray(candidate.goals) &&
    !!candidate.settings
  );
};

export const AppStoreProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(reducer, initialAppState);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let isMounted = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then(raw => {
        if (!raw || !isMounted) return;
        const parsed = JSON.parse(raw) as unknown;
        if (isValidState(parsed)) {
          dispatch({ type: 'hydrate', payload: parsed });
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (isMounted) setIsHydrated(true);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => undefined);
  }, [isHydrated, state]);

  const pulse = useCallback((kind: 'light' | 'success' | 'warning' = 'light') => {
    if (kind === 'success') { hapticSuccess(); return; }
    if (kind === 'warning') { hapticWarning(); return; }
    hapticLight();
  }, []);

  const value = useMemo<StoreContextValue>(() => {
    const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
      pulse('success');
      dispatch({ type: 'addTransaction', payload: { ...transaction, id: uid('txn') } });
    };

    const updateTransaction = (transaction: Transaction) => {
      pulse();
      dispatch({ type: 'updateTransaction', payload: transaction });
    };

    const deleteTransaction = (id: string) => {
      pulse('warning');
      dispatch({ type: 'deleteTransaction', payload: id });
    };

    const duplicateTransaction = (id: string) => {
      pulse('success');
      dispatch({ type: 'duplicateTransaction', payload: id });
    };

    const addCategory = (category: Omit<Category, 'id' | 'isDefault'>) => {
      pulse('success');
      dispatch({ type: 'addCategory', payload: { ...category, id: uid('cat'), isDefault: false } });
    };

    const upsertBudget = (budget: Omit<Budget, 'id'> & { id?: string }) => {
      pulse('success');
      dispatch({ type: 'upsertBudget', payload: { ...budget, id: budget.id ?? uid('budget') } });
    };

    const addGoal = (goal: Omit<SavingsGoal, 'id'>) => {
      pulse('success');
      dispatch({ type: 'addGoal', payload: { ...goal, id: uid('goal') } });
    };

    const updateGoal = (goal: SavingsGoal) => {
      pulse();
      dispatch({ type: 'updateGoal', payload: goal });
    };

    const deleteGoal = (id: string) => {
      pulse('warning');
      dispatch({ type: 'deleteGoal', payload: id });
    };

    const updateSettings = (settings: Partial<AppSettings>) => {
      pulse();
      dispatch({ type: 'updateSettings', payload: settings });
    };

    const importState = (imported: unknown) => {
      if (!isValidState(imported)) {
        pulse('warning');
        return false;
      }
      pulse('success');
      dispatch({ type: 'replaceState', payload: imported });
      return true;
    };

    return {
      state,
      metrics: getMetrics(state),
      isHydrated,
      dispatch,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      duplicateTransaction,
      addCategory,
      upsertBudget,
      addGoal,
      updateGoal,
      deleteGoal,
      updateSettings,
      importState,
    };
  }, [isHydrated, pulse, state]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
};

export const useAppStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useAppStore must be used inside AppStoreProvider');
  return context;
};
