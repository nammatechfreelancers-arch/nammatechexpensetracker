import React, { useMemo, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { BudgetForm, GoalForm } from '../components/forms';
import { AppIcon } from '../components/icons';
import { GlassCard, Header, IconButton, PrimaryButton, ProgressBar, Screen, sectionTitle, styles } from '../components/ui';
import { useAppStore } from '../state/AppStore';
import { themes } from '../theme/palettes';
import { Budget, SavingsGoal } from '../types';
import { categoryFor, formatMoney, isSameDay, spentForBudget } from '../utils/finance';

export const BudgetsScreen = () => {
  const { state, upsertBudget, addGoal, updateGoal, deleteGoal } = useAppStore();
  const theme = themes[state.settings.theme];
  const [budgetForm, setBudgetForm] = useState<Budget | 'new' | undefined>();
  const [goalForm, setGoalForm] = useState<SavingsGoal | 'new' | undefined>();
  const [selectedDay, setSelectedDay] = useState(new Date());

  const selectedTransactions = state.transactions.filter(transaction => isSameDay(transaction.date, selectedDay));

  return (
    <Screen theme={theme}>
      <Header
        eyebrow="Plan"
        title="Budgets"
        subtitle="Monthly limits, savings goals, and calendar spending"
        theme={theme}
        right={<IconButton icon="plus" label="Add budget" theme={theme} tone="primary" onPress={() => setBudgetForm('new')} />}
      />

      <Text style={sectionTitle(theme)}>Monthly Budgets</Text>
      <View style={{ gap: 12 }}>
        {state.budgets.map(budget => {
          const category = categoryFor(state.categories, budget.categoryId);
          const spent = spentForBudget(budget, state);
          const percent = (spent / budget.monthlyLimit) * 100;
          const over = percent >= 100;
          const warning = percent >= budget.alertAtPercent;
          return (
            <GlassCard key={budget.id} theme={theme}>
              <View style={{ gap: 11 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={[styles.iconBubble, { backgroundColor: `${category.color}22` }]}>
                    <AppIcon name={category.icon} color={category.color} size={18} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: theme.text, fontSize: 17, fontWeight: '900' }}>{category.name}</Text>
                    <Text style={[styles.caption, { color: warning ? theme.warning : theme.muted }]}>
                      {over ? 'Overspending alert' : `${formatMoney(Math.max(budget.monthlyLimit - spent, 0), state.settings.currency)} remaining`}
                    </Text>
                  </View>
                  <IconButton icon="edit" label="Edit budget" theme={theme} onPress={() => setBudgetForm(budget)} />
                </View>
                <ProgressBar value={percent} theme={theme} color={over ? theme.danger : warning ? theme.warning : category.color} />
                <Text style={[styles.caption, { color: theme.muted }]}>
                  {formatMoney(spent, state.settings.currency)} used of {formatMoney(budget.monthlyLimit, state.settings.currency)}
                </Text>
              </View>
            </GlassCard>
          );
        })}
      </View>

      <Text style={sectionTitle(theme)}>Savings Goals</Text>
      <View style={{ gap: 12 }}>
        {state.goals.map(goal => {
          const percent = (goal.currentAmount / goal.targetAmount) * 100;
          return (
            <GlassCard key={goal.id} theme={theme}>
              <View style={{ gap: 11 }}>
                <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                  <View style={[styles.iconBubble, { backgroundColor: `${goal.color}22` }]}>
                    <AppIcon name="target" color={goal.color} size={18} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: theme.text, fontSize: 17, fontWeight: '900' }}>{goal.title}</Text>
                    <Text style={[styles.caption, { color: theme.muted }]}>
                      Due {new Date(goal.deadline).toLocaleDateString()} · {Math.round(percent)}% complete
                    </Text>
                  </View>
                  <IconButton icon="edit" label="Edit goal" theme={theme} onPress={() => setGoalForm(goal)} />
                  <IconButton
                    icon="trash"
                    label="Delete goal"
                    theme={theme}
                    tone="danger"
                    onPress={() =>
                      Alert.alert('Delete goal?', 'This only removes the local goal.', [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Delete', style: 'destructive', onPress: () => deleteGoal(goal.id) },
                      ])
                    }
                  />
                </View>
                <ProgressBar value={percent} theme={theme} color={goal.color} />
                <Text style={[styles.caption, { color: theme.muted }]}>
                  {formatMoney(goal.currentAmount, state.settings.currency)} of {formatMoney(goal.targetAmount, state.settings.currency)}
                </Text>
              </View>
            </GlassCard>
          );
        })}
        <PrimaryButton label="Create Savings Goal" icon="plus" theme={theme} tone="subtle" onPress={() => setGoalForm('new')} />
      </View>

      <Text style={sectionTitle(theme)}>Calendar</Text>
      <CalendarCard selectedDay={selectedDay} onSelectDay={setSelectedDay} />
      <GlassCard theme={theme}>
        <View style={{ gap: 10 }}>
          <Text style={{ color: theme.text, fontSize: 17, fontWeight: '900' }}>
            {selectedDay.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}
          </Text>
          {selectedTransactions.length ? (
            selectedTransactions.map(transaction => {
              const category = categoryFor(state.categories, transaction.categoryId);
              return (
                <View key={transaction.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <AppIcon name={category.icon} color={category.color} size={17} />
                  <Text style={{ flex: 1, color: theme.text, fontWeight: '800' }}>{category.name}</Text>
                  <Text style={{ color: transaction.type === 'income' ? theme.success : theme.danger, fontWeight: '900' }}>
                    {transaction.type === 'income' ? '+' : '-'}
                    {formatMoney(transaction.amount, state.settings.currency)}
                  </Text>
                </View>
              );
            })
          ) : (
            <Text style={{ color: theme.muted }}>No transactions on this day.</Text>
          )}
        </View>
      </GlassCard>

      <BudgetForm
        visible={!!budgetForm}
        theme={theme}
        categories={state.categories}
        budget={budgetForm === 'new' ? undefined : budgetForm}
        onClose={() => setBudgetForm(undefined)}
        onSave={upsertBudget}
      />
      <GoalForm
        visible={!!goalForm}
        theme={theme}
        goal={goalForm === 'new' ? undefined : goalForm}
        onClose={() => setGoalForm(undefined)}
        onSave={goal => {
          if ('id' in goal) updateGoal(goal);
          else addGoal(goal);
        }}
      />
    </Screen>
  );
};

const CalendarCard = ({ selectedDay, onSelectDay }: { selectedDay: Date; onSelectDay: (date: Date) => void }) => {
  const { state } = useAppStore();
  const theme = themes[state.settings.theme];
  const days = useMemo(() => {
    const now = new Date();
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    const total = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const blanks = first.getDay();
    return [
      ...Array.from({ length: blanks }, () => undefined),
      ...Array.from({ length: total }, (_, index) => new Date(now.getFullYear(), now.getMonth(), index + 1)),
    ];
  }, []);

  return (
    <GlassCard theme={theme}>
      <View style={{ gap: 10 }}>
        <Text style={{ color: theme.text, fontSize: 17, fontWeight: '900' }}>
          {new Date().toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
            <Text key={`${day}-${index}`} style={{ width: `${100 / 7}%`, textAlign: 'center', color: theme.muted, fontWeight: '900', marginBottom: 8 }}>
              {day}
            </Text>
          ))}
          {days.map((day, index) => {
            const active = !!day && isSameDay(day.toISOString(), selectedDay);
            const hasExpense = !!day && state.transactions.some(transaction => transaction.type === 'expense' && isSameDay(transaction.date, day));
            return (
              <Pressable
                key={`${day?.toISOString() ?? 'blank'}-${index}`}
                disabled={!day}
                onPress={() => day && onSelectDay(day)}
                style={{
                  width: `${100 / 7}%`,
                  aspectRatio: 1,
                  padding: 3,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {day ? (
                  <View
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 17,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: active ? theme.primary : hasExpense ? `${theme.danger}22` : 'transparent',
                    }}
                  >
                    <Text style={{ color: active ? '#FFFFFF' : theme.text, fontWeight: '800' }}>{day.getDate()}</Text>
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </View>
    </GlassCard>
  );
};
