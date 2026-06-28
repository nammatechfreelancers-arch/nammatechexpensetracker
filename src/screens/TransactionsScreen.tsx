import React, { useMemo, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { TransactionForm } from '../components/forms';
import { AppIcon } from '../components/icons';
import { Chip, Field, GlassCard, Header, IconButton, PrimaryButton, Screen, styles } from '../components/ui';
import { useAppStore } from '../state/AppStore';
import { themes } from '../theme/palettes';
import { SortMode, Transaction, TransactionType } from '../types';
import { categoryFor, formatMoney } from '../utils/finance';

const sortModes: SortMode[] = ['Newest', 'Oldest', 'Amount High', 'Amount Low'];

export const TransactionsScreen = () => {
  const { state, addTransaction, updateTransaction, deleteTransaction, duplicateTransaction } = useAppStore();
  const theme = themes[state.settings.theme];
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | undefined>();
  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState<TransactionType | 'all'>('all');
  const [categoryId, setCategoryId] = useState('all');
  const [sort, setSort] = useState<SortMode>('Newest');

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const items = state.transactions.filter(transaction => {
      const category = categoryFor(state.categories, transaction.categoryId);
      const matchesQuery =
        !normalized ||
        transaction.notes.toLowerCase().includes(normalized) ||
        category.name.toLowerCase().includes(normalized) ||
        transaction.tags.some(tag => tag.toLowerCase().includes(normalized)) ||
        String(transaction.amount).includes(normalized);
      const matchesType = filterType === 'all' || transaction.type === filterType;
      const matchesCategory = categoryId === 'all' || transaction.categoryId === categoryId;
      return matchesQuery && matchesType && matchesCategory;
    });

    return items.sort((a, b) => {
      if (sort === 'Oldest') return +new Date(a.date) - +new Date(b.date);
      if (sort === 'Amount High') return b.amount - a.amount;
      if (sort === 'Amount Low') return a.amount - b.amount;
      return +new Date(b.date) - +new Date(a.date);
    });
  }, [categoryId, filterType, query, sort, state.categories, state.transactions]);

  const confirmDelete = (id: string) => {
    Alert.alert('Delete transaction?', 'This removes it from local storage on this device.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteTransaction(id) },
    ]);
  };

  return (
    <Screen theme={theme}>
      <Header
        eyebrow="Ledger"
        title="Transactions"
        subtitle={`${filtered.length} visible · ${state.transactions.length} saved locally`}
        theme={theme}
        right={<IconButton icon="plus" label="Add transaction" theme={theme} tone="primary" onPress={() => setFormOpen(true)} />}
      />

      <GlassCard theme={theme}>
        <View style={{ gap: 12 }}>
          <Field label="Instant Search" value={query} onChangeText={setQuery} theme={theme} placeholder="Search notes, category, amount, tags" />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <Chip label="All" active={filterType === 'all'} theme={theme} onPress={() => setFilterType('all')} />
            <Chip label="Expense" active={filterType === 'expense'} theme={theme} color={theme.danger} onPress={() => setFilterType('expense')} />
            <Chip label="Income" active={filterType === 'income'} theme={theme} color={theme.success} onPress={() => setFilterType('income')} />
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <Chip label="All categories" active={categoryId === 'all'} theme={theme} onPress={() => setCategoryId('all')} />
            {state.categories.slice(0, 8).map(category => (
              <Chip
                key={category.id}
                label={category.name}
                active={categoryId === category.id}
                theme={theme}
                color={category.color}
                onPress={() => setCategoryId(category.id)}
              />
            ))}
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {sortModes.map(mode => (
              <Chip key={mode} label={mode} active={sort === mode} theme={theme} onPress={() => setSort(mode)} />
            ))}
          </View>
        </View>
      </GlassCard>

      <View style={{ gap: 12 }}>
        {filtered.map(transaction => {
          const category = categoryFor(state.categories, transaction.categoryId);
          return (
            <GlassCard key={transaction.id} theme={theme}>
              <Pressable onPress={() => setEditing(transaction)} style={{ gap: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={[styles.iconBubble, { backgroundColor: `${category.color}22` }]}>
                    <AppIcon name={category.icon} color={category.color} size={18} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: theme.text, fontSize: 17, fontWeight: '900' }}>{category.name}</Text>
                    <Text style={[styles.caption, { color: theme.muted }]}>
                      {new Date(transaction.date).toLocaleDateString()} · {transaction.paymentMethod}
                    </Text>
                  </View>
                  <Text style={{ color: transaction.type === 'income' ? theme.success : theme.danger, fontSize: 17, fontWeight: '900' }}>
                    {transaction.type === 'income' ? '+' : '-'}
                    {formatMoney(transaction.amount, state.settings.currency)}
                  </Text>
                </View>
                {transaction.notes ? <Text style={{ color: theme.text, lineHeight: 20 }}>{transaction.notes}</Text> : null}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                  <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', flex: 1 }}>
                    {transaction.tags.map(tag => (
                      <Chip key={tag} label={tag} theme={theme} />
                    ))}
                    {transaction.receiptImageUri ? <Chip label="Receipt" theme={theme} active color={theme.secondary} /> : null}
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <IconButton icon="copy" label="Duplicate" theme={theme} onPress={() => duplicateTransaction(transaction.id)} />
                    <IconButton icon="edit" label="Edit" theme={theme} onPress={() => setEditing(transaction)} />
                    <IconButton icon="trash" label="Delete" theme={theme} tone="danger" onPress={() => confirmDelete(transaction.id)} />
                  </View>
                </View>
              </Pressable>
            </GlassCard>
          );
        })}
      </View>

      {filtered.length === 0 ? (
        <GlassCard theme={theme}>
          <View style={{ gap: 12, alignItems: 'center' }}>
            <AppIcon name="search" color={theme.primary} size={30} />
            <Text style={{ color: theme.text, fontSize: 18, fontWeight: '900' }}>No matching transactions</Text>
            <PrimaryButton label="Add Transaction" icon="plus" theme={theme} onPress={() => setFormOpen(true)} />
          </View>
        </GlassCard>
      ) : null}

      <TransactionForm
        visible={formOpen || !!editing}
        theme={theme}
        categories={state.categories}
        transaction={editing}
        onClose={() => {
          setEditing(undefined);
          setFormOpen(false);
        }}
        onSave={transaction => {
          if ('id' in transaction) updateTransaction(transaction);
          else addTransaction(transaction);
        }}
      />
    </Screen>
  );
};
