import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { TransactionForm } from '../components/forms';
import { AppIcon } from '../components/icons';
import { GlassCard, Header, LogoMark, ProgressBar, Screen, StatCard, sectionTitle, styles } from '../components/ui';
import { useAppStore } from '../state/AppStore';
import { themes } from '../theme/palettes';
import { Transaction } from '../types';
import { categoryFor, formatMoney, monthlyTransactions, spentForBudget } from '../utils/finance';

export const DashboardScreen = () => {
  const { state, metrics, addTransaction } = useAppStore();
  const theme = themes[state.settings.theme];
  const [formOpen, setFormOpen] = useState(false);
  const currency = state.settings.currency;
  const month = monthlyTransactions(state.transactions);
  const recent = [...state.transactions].sort((a, b) => +new Date(b.date) - +new Date(a.date)).slice(0, 4);

  const topBudget = useMemo(
    () =>
      state.budgets
        .map(budget => ({ budget, spent: spentForBudget(budget, state) }))
        .sort((a, b) => b.spent / b.budget.monthlyLimit - a.spent / a.budget.monthlyLimit)[0],
    [state],
  );

  const insight =
    metrics.savings >= 0
      ? `You kept ${formatMoney(metrics.savings, currency)} this month. Keep the pace steady.`
      : `Expenses are ${formatMoney(Math.abs(metrics.savings), currency)} above income this month.`;

  return (
    <Screen theme={theme}>
      <Header
        eyebrow="Lumora"
        title="Dashboard"
        subtitle={new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
        theme={theme}
        right={<LogoMark />}
      />

      <GlassCard theme={theme}>
        <View style={{ gap: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={[styles.iconBubble, { backgroundColor: `${theme.primary}25` }]}>
              <AppIcon name="wallet" color={theme.primary} size={21} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardLabel, { color: theme.muted, marginTop: 0 }]}>Current Balance</Text>
              <Text adjustsFontSizeToFit numberOfLines={1} style={[styles.title, { color: theme.text, fontSize: 38 }]}>
                {formatMoney(metrics.balance, currency)}
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.caption, { color: theme.muted }]}>Income</Text>
              <Text style={{ color: theme.success, fontSize: 18, fontWeight: '900' }}>
                {formatMoney(metrics.monthlyIncome, currency)}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.caption, { color: theme.muted }]}>Expenses</Text>
              <Text style={{ color: theme.danger, fontSize: 18, fontWeight: '900' }}>
                {formatMoney(metrics.monthlyExpenses, currency)}
              </Text>
            </View>
          </View>
        </View>
      </GlassCard>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        <StatCard label="Savings" value={formatMoney(metrics.savings, currency)} icon="trending-up" accent={theme.success} theme={theme} />
        <StatCard label="Budget Left" value={formatMoney(metrics.budgetRemaining, currency)} icon="target" accent={theme.secondary} theme={theme} />
        <StatCard label="Month Items" value={String(month.length)} icon="receipt" accent={theme.warning} theme={theme} />
        <StatCard label="Health Score" value={`${metrics.healthScore}`} icon="activity" accent={theme.primary} theme={theme} caption="Out of 100" />
      </View>

      <Text style={sectionTitle(theme)}>Spending Insights</Text>
      <GlassCard theme={theme}>
        <View style={{ gap: 14 }}>
          <Text style={{ color: theme.text, fontSize: 17, fontWeight: '800', lineHeight: 23 }}>{insight}</Text>
          <ProgressBar value={metrics.healthScore} theme={theme} color={metrics.healthScore > 70 ? theme.success : theme.warning} />
          {topBudget ? (
            <Text style={[styles.caption, { color: theme.muted }]}>
              Closest budget: {categoryFor(state.categories, topBudget.budget.categoryId).name} at{' '}
              {Math.round((topBudget.spent / topBudget.budget.monthlyLimit) * 100)}%.
            </Text>
          ) : null}
        </View>
      </GlassCard>

      <Text style={sectionTitle(theme)}>Recent Transactions</Text>
      <GlassCard theme={theme}>
        <View style={{ gap: 12 }}>
          {recent.map(transaction => (
            <TransactionRow key={transaction.id} transaction={transaction} />
          ))}
        </View>
      </GlassCard>

      <Text style={sectionTitle(theme)}>Goal Progress</Text>
      <View style={{ gap: 12 }}>
        {state.goals.map(goal => {
          const value = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
          return (
            <GlassCard key={goal.id} theme={theme}>
              <View style={{ gap: 10 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
                  <Text style={{ color: theme.text, fontSize: 17, fontWeight: '900', flex: 1 }}>{goal.title}</Text>
                  <Text style={{ color: goal.color, fontWeight: '900' }}>{Math.round(value)}%</Text>
                </View>
                <ProgressBar value={value} theme={theme} color={goal.color} />
                <Text style={[styles.caption, { color: theme.muted }]}>
                  {formatMoney(goal.currentAmount, currency)} of {formatMoney(goal.targetAmount, currency)}
                </Text>
              </View>
            </GlassCard>
          );
        })}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add transaction"
        onPress={() => setFormOpen(true)}
        style={({ pressed }) => ({
          position: 'absolute',
          right: 22,
          bottom: 28,
          width: 62,
          height: 62,
          borderRadius: 31,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.primary,
          opacity: pressed ? 0.82 : 1,
          shadowColor: theme.shadow,
          shadowOpacity: 0.25,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 12 },
        })}
      >
        <AppIcon name="plus" color="#FFFFFF" size={28} />
      </Pressable>

      <TransactionForm
        visible={formOpen}
        theme={theme}
        categories={state.categories}
        onClose={() => setFormOpen(false)}
        onSave={transaction => addTransaction(transaction as Omit<Transaction, 'id'>)}
      />
    </Screen>
  );
};

const TransactionRow = ({ transaction }: { transaction: Transaction }) => {
  const { state } = useAppStore();
  const theme = themes[state.settings.theme];
  const category = categoryFor(state.categories, transaction.categoryId);
  const amountColor = transaction.type === 'income' ? theme.success : theme.danger;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View style={[styles.iconBubble, { backgroundColor: `${category.color}22` }]}>
        <AppIcon name={category.icon} color={category.color} size={18} />
      </View>
      <View style={{ flex: 1 }}>
        <Text numberOfLines={1} style={{ color: theme.text, fontWeight: '900', fontSize: 15 }}>
          {category.name}
        </Text>
        <Text style={[styles.caption, { color: theme.muted }]}>
          {new Date(transaction.date).toLocaleDateString()} · {transaction.paymentMethod}
        </Text>
      </View>
      <Text style={{ color: amountColor, fontWeight: '900' }}>
        {transaction.type === 'income' ? '+' : '-'}
        {formatMoney(transaction.amount, state.settings.currency)}
      </Text>
    </View>
  );
};
