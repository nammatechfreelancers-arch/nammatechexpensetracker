import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import { DonutChart, MiniBarChart, StackedComparison, TrendChart } from '../components/charts';
import { AppIcon } from '../components/icons';
import { GlassCard, Header, ProgressBar, Screen, StatCard, sectionTitle, styles } from '../components/ui';
import { useAppStore } from '../state/AppStore';
import { themes } from '../theme/palettes';
import { ThemeTokens } from '../types';
import { categoryTotals, formatMoney, lastNDays, monthlyTransactions, monthlyTrend } from '../utils/finance';

export const AnalyticsScreen = () => {
  const { state, metrics } = useAppStore();
  const theme = themes[state.settings.theme];
  const currency = state.settings.currency;
  const month = monthlyTransactions(state.transactions);
  const categories = useMemo(() => categoryTotals(month, state.categories), [month, state.categories]);
  const trend = monthlyTrend(state.transactions);
  const week = lastNDays(state.transactions, 7);
  const donut = categories.slice(0, 6).map((item, index) => ({
    label: item.category.name,
    value: item.value,
    color: item.category.color || theme.chart[index % theme.chart.length],
  }));
  const dailyAverage = month.length ? metrics.monthlyExpenses / new Date().getDate() : 0;

  return (
    <Screen theme={theme}>
      <Header
        eyebrow="Signals"
        title="Analytics"
        subtitle="Animated, local-only spending intelligence"
        theme={theme}
      />

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        <StatCard label="Daily Spend" value={formatMoney(dailyAverage, currency)} icon="activity" accent={theme.primary} theme={theme} />
        <StatCard label="Cash Flow" value={formatMoney(metrics.savings, currency)} icon="line-chart" accent={metrics.savings >= 0 ? theme.success : theme.danger} theme={theme} />
      </View>

      <Text style={sectionTitle(theme)}>Income vs Expense</Text>
      <GlassCard theme={theme}>
        <View style={{ gap: 14 }}>
          <TrendChart data={trend} theme={theme} />
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Legend color={theme.success} label="Income" theme={theme} />
            <Legend color={theme.danger} label="Expense" theme={theme} />
          </View>
        </View>
      </GlassCard>

      <Text style={sectionTitle(theme)}>Weekly Trend</Text>
      <GlassCard theme={theme}>
        <MiniBarChart data={week.map((item, index) => ({ label: item.label, value: item.value, color: theme.chart[index % theme.chart.length] }))} theme={theme} />
      </GlassCard>

      <Text style={sectionTitle(theme)}>Category Breakdown</Text>
      <GlassCard theme={theme}>
        {donut.length ? (
          <DonutChart data={donut} theme={theme} centerLabel={`${donut.length}`} />
        ) : (
          <Text style={{ color: theme.muted }}>No expenses this month yet.</Text>
        )}
      </GlassCard>

      <Text style={sectionTitle(theme)}>Budget Usage</Text>
      <GlassCard theme={theme}>
        <View style={{ gap: 13 }}>
          {state.budgets.map(budget => {
            const category = state.categories.find(item => item.id === budget.categoryId);
            const spent = month
              .filter(transaction => transaction.type === 'expense' && transaction.categoryId === budget.categoryId)
              .reduce((sum, transaction) => sum + transaction.amount, 0);
            return (
              <View key={budget.id} style={{ gap: 7 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                  <Text style={{ color: theme.text, fontWeight: '900' }}>{category?.name ?? 'Budget'}</Text>
                  <Text style={{ color: theme.muted, fontWeight: '700' }}>
                    {formatMoney(spent, currency)} / {formatMoney(budget.monthlyLimit, currency)}
                  </Text>
                </View>
                <ProgressBar value={(spent / budget.monthlyLimit) * 100} theme={theme} color={category?.color ?? theme.primary} />
              </View>
            );
          })}
        </View>
      </GlassCard>

      <Text style={sectionTitle(theme)}>Year Comparison</Text>
      <GlassCard theme={theme}>
        <StackedComparison data={trend} theme={theme} />
      </GlassCard>

      <Text style={sectionTitle(theme)}>Top Spending Categories</Text>
      <View style={{ gap: 10 }}>
        {categories.slice(0, 5).map((item, index) => (
          <GlassCard key={item.category.id} theme={theme}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={[styles.iconBubble, { backgroundColor: `${item.category.color}22` }]}>
                <AppIcon name={item.category.icon} color={item.category.color} size={18} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.text, fontWeight: '900', fontSize: 16 }}>
                  {index + 1}. {item.category.name}
                </Text>
                <ProgressBar value={(item.value / Math.max(categories[0]?.value ?? 1, 1)) * 100} theme={theme} color={item.category.color} height={6} />
              </View>
              <Text style={{ color: theme.text, fontWeight: '900' }}>{formatMoney(item.value, currency)}</Text>
            </View>
          </GlassCard>
        ))}
      </View>
    </Screen>
  );
};

const Legend = ({ color, label, theme }: { color: string; label: string; theme: ThemeTokens }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
    <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color }} />
    <Text style={[styles.caption, { color: theme.muted }]}>{label}</Text>
  </View>
);
