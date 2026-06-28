import React, { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { Budget, Category, PaymentMethod, SavingsGoal, ThemeTokens, Transaction, TransactionType } from '../types';
import { parseTags } from '../utils/finance';
import { AppIcon } from './icons';
import { Chip, Field, GlassCard, IconButton, PrimaryButton, styles } from './ui';

const paymentMethods: PaymentMethod[] = ['Apple Pay', 'Card', 'Cash', 'Bank', 'UPI', 'Wallet', 'Other'];
const categoryIcons = ['utensils', 'car', 'shopping-bag', 'receipt', 'sparkles', 'plane', 'heart-pulse', 'graduation-cap', 'briefcase', 'trending-up', 'circle-dollar-sign'];
const swatches = ['#EF4444', '#F97316', '#F59E0B', '#22C55E', '#0F766E', '#06B6D4', '#2563EB', '#7C3AED', '#DB2777', '#64748B'];

const pickImage = async (): Promise<string | undefined> => {
  if (Platform.OS === 'web') {
    return new Promise(resolve => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = () => {
        const file = input.files?.[0];
        if (!file) { resolve(undefined); return; }
        const reader = new FileReader();
        reader.onload = e => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      };
      input.click();
    });
  }
  try {
    const ImagePicker = await import('expo-image-picker');
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.75,
    });
    if (!result.canceled) return result.assets[0]?.uri;
  } catch {}
  return undefined;
};

const ModalShell = ({
  visible,
  title,
  theme,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  theme: ThemeTokens;
  onClose: () => void;
  children: React.ReactNode;
}) => (
  <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView contentContainerStyle={{ padding: 18, paddingTop: 24, gap: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Text style={[styles.title, { flex: 1, color: theme.text, fontSize: 27 }]}>{title}</Text>
          <IconButton icon="x" label="Close" theme={theme} onPress={onClose} />
        </View>
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  </Modal>
);

export const TransactionForm = ({
  visible,
  theme,
  categories,
  transaction,
  onClose,
  onSave,
}: {
  visible: boolean;
  theme: ThemeTokens;
  categories: Category[];
  transaction?: Transaction;
  onClose: () => void;
  onSave: (transaction: Omit<Transaction, 'id'> | Transaction) => void;
}) => {
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Apple Pay');
  const [tags, setTags] = useState('');
  const [receiptImageUri, setReceiptImageUri] = useState<string | undefined>();

  useEffect(() => {
    if (!visible) return;
    setType(transaction?.type ?? 'expense');
    setAmount(transaction ? String(transaction.amount) : '');
    setCategoryId(transaction?.categoryId ?? categories.find(category => category.type !== 'income')?.id ?? categories[0]?.id ?? '');
    setDate(transaction ? transaction.date.slice(0, 10) : new Date().toISOString().slice(0, 10));
    setNotes(transaction?.notes ?? '');
    setPaymentMethod(transaction?.paymentMethod ?? 'Apple Pay');
    setTags(transaction?.tags.join(', ') ?? '');
    setReceiptImageUri(transaction?.receiptImageUri);
  }, [categories, transaction, visible]);

  const filteredCategories = useMemo(
    () => categories.filter(category => category.type === type || category.type === 'both'),
    [categories, type],
  );

  const save = () => {
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0 || !categoryId || !date) return;
    const payload = {
      amount: parsedAmount,
      type,
      categoryId,
      date: new Date(`${date}T12:00:00`).toISOString(),
      notes,
      paymentMethod,
      tags: parseTags(tags),
      receiptImageUri,
    };
    onSave(transaction ? { ...payload, id: transaction.id } : payload);
    onClose();
  };

  return (
    <ModalShell visible={visible} title={transaction ? 'Edit Transaction' : 'New Transaction'} theme={theme} onClose={onClose}>
      <GlassCard theme={theme}>
        <View style={{ gap: 14 }}>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Chip label="Expense" active={type === 'expense'} theme={theme} onPress={() => setType('expense')} color={theme.danger} />
            <Chip label="Income" active={type === 'income'} theme={theme} onPress={() => setType('income')} color={theme.success} />
          </View>
          <Field label="Amount" value={amount} onChangeText={setAmount} theme={theme} keyboardType="decimal-pad" placeholder="0.00" />
          <Field label="Date" value={date} onChangeText={setDate} theme={theme} placeholder="YYYY-MM-DD" />
          <View style={{ gap: 8 }}>
            <Text style={[styles.fieldLabel, { color: theme.muted }]}>Category</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {filteredCategories.map(category => (
                <Pressable
                  key={category.id}
                  onPress={() => setCategoryId(category.id)}
                  style={{
                    minHeight: 42,
                    borderRadius: 16,
                    paddingHorizontal: 12,
                    flexDirection: 'row',
                    gap: 8,
                    alignItems: 'center',
                    backgroundColor: categoryId === category.id ? category.color : theme.subtle,
                    borderWidth: 1,
                    borderColor: categoryId === category.id ? category.color : theme.border,
                  }}
                >
                  <AppIcon name={category.icon} color={categoryId === category.id ? '#FFFFFF' : category.color} size={17} />
                  <Text style={{ color: categoryId === category.id ? '#FFFFFF' : theme.text, fontWeight: '800' }}>{category.name}</Text>
                </Pressable>
              ))}
            </View>
          </View>
          <View style={{ gap: 8 }}>
            <Text style={[styles.fieldLabel, { color: theme.muted }]}>Payment Method</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {paymentMethods.map(method => (
                <Chip key={method} label={method} active={paymentMethod === method} theme={theme} onPress={() => setPaymentMethod(method)} />
              ))}
            </View>
          </View>
          <Field label="Notes" value={notes} onChangeText={setNotes} theme={theme} multiline placeholder="What was this for?" />
          <Field label="Tags" value={tags} onChangeText={setTags} theme={theme} placeholder="home, weekend" />
          <PrimaryButton
            label={receiptImageUri ? 'Receipt Attached' : 'Attach Receipt'}
            icon="image"
            theme={theme}
            tone="subtle"
            onPress={async () => {
              const uri = await pickImage();
              if (uri) setReceiptImageUri(uri);
            }}
          />
          <PrimaryButton label="Save Transaction" icon="check" theme={theme} onPress={save} disabled={!amount || !categoryId} />
        </View>
      </GlassCard>
    </ModalShell>
  );
};

export const BudgetForm = ({
  visible,
  theme,
  categories,
  budget,
  onClose,
  onSave,
}: {
  visible: boolean;
  theme: ThemeTokens;
  categories: Category[];
  budget?: Budget;
  onClose: () => void;
  onSave: (budget: Omit<Budget, 'id'> & { id?: string }) => void;
}) => {
  const expenseCategories = categories.filter(category => category.type !== 'income');
  const [categoryId, setCategoryId] = useState(expenseCategories[0]?.id ?? '');
  const [monthlyLimit, setMonthlyLimit] = useState('');
  const [alertAtPercent, setAlertAtPercent] = useState('80');

  useEffect(() => {
    if (!visible) return;
    setCategoryId(budget?.categoryId ?? expenseCategories[0]?.id ?? '');
    setMonthlyLimit(budget ? String(budget.monthlyLimit) : '');
    setAlertAtPercent(budget ? String(budget.alertAtPercent) : '80');
  }, [budget, expenseCategories, visible]);

  const save = () => {
    const limit = Number(monthlyLimit);
    const alert = Number(alertAtPercent);
    if (!Number.isFinite(limit) || limit <= 0) return;
    onSave({ id: budget?.id, categoryId, monthlyLimit: limit, alertAtPercent: Number.isFinite(alert) ? alert : 80 });
    onClose();
  };

  return (
    <ModalShell visible={visible} title={budget ? 'Edit Budget' : 'New Budget'} theme={theme} onClose={onClose}>
      <GlassCard theme={theme}>
        <View style={{ gap: 14 }}>
          <Text style={[styles.fieldLabel, { color: theme.muted }]}>Category</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {expenseCategories.map(category => (
              <Chip key={category.id} label={category.name} active={categoryId === category.id} theme={theme} color={category.color} onPress={() => setCategoryId(category.id)} />
            ))}
          </View>
          <Field label="Monthly Limit" value={monthlyLimit} onChangeText={setMonthlyLimit} theme={theme} keyboardType="decimal-pad" />
          <Field label="Alert At Percent" value={alertAtPercent} onChangeText={setAlertAtPercent} theme={theme} keyboardType="numeric" />
          <PrimaryButton label="Save Budget" icon="check" theme={theme} onPress={save} disabled={!monthlyLimit || !categoryId} />
        </View>
      </GlassCard>
    </ModalShell>
  );
};

export const GoalForm = ({
  visible,
  theme,
  goal,
  onClose,
  onSave,
}: {
  visible: boolean;
  theme: ThemeTokens;
  goal?: SavingsGoal;
  onClose: () => void;
  onSave: (goal: Omit<SavingsGoal, 'id'> | SavingsGoal) => void;
}) => {
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [color, setColor] = useState(swatches[4]);

  useEffect(() => {
    if (!visible) return;
    setTitle(goal?.title ?? '');
    setTargetAmount(goal ? String(goal.targetAmount) : '');
    setCurrentAmount(goal ? String(goal.currentAmount) : '0');
    setDeadline(goal ? goal.deadline.slice(0, 10) : new Date().toISOString().slice(0, 10));
    setColor(goal?.color ?? swatches[4]);
  }, [goal, visible]);

  const save = () => {
    const target = Number(targetAmount);
    const current = Number(currentAmount);
    if (!title.trim() || !Number.isFinite(target) || target <= 0) return;
    const payload = {
      title: title.trim(),
      targetAmount: target,
      currentAmount: Number.isFinite(current) ? current : 0,
      deadline: new Date(`${deadline}T12:00:00`).toISOString(),
      color,
    };
    onSave(goal ? { ...payload, id: goal.id } : payload);
    onClose();
  };

  return (
    <ModalShell visible={visible} title={goal ? 'Edit Goal' : 'New Goal'} theme={theme} onClose={onClose}>
      <GlassCard theme={theme}>
        <View style={{ gap: 14 }}>
          <Field label="Goal Name" value={title} onChangeText={setTitle} theme={theme} placeholder="Emergency fund" />
          <Field label="Target Amount" value={targetAmount} onChangeText={setTargetAmount} theme={theme} keyboardType="decimal-pad" />
          <Field label="Current Amount" value={currentAmount} onChangeText={setCurrentAmount} theme={theme} keyboardType="decimal-pad" />
          <Field label="Deadline" value={deadline} onChangeText={setDeadline} theme={theme} placeholder="YYYY-MM-DD" />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {swatches.map(item => (
              <Pressable
                key={item}
                accessibilityRole="button"
                accessibilityLabel={`Choose ${item}`}
                onPress={() => setColor(item)}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  backgroundColor: item,
                  borderWidth: color === item ? 3 : 1,
                  borderColor: color === item ? theme.text : theme.border,
                }}
              />
            ))}
          </View>
          <PrimaryButton label="Save Goal" icon="check" theme={theme} onPress={save} disabled={!title || !targetAmount} />
        </View>
      </GlassCard>
    </ModalShell>
  );
};

export const CategoryForm = ({
  visible,
  theme,
  onClose,
  onSave,
}: {
  visible: boolean;
  theme: ThemeTokens;
  onClose: () => void;
  onSave: (category: Omit<Category, 'id' | 'isDefault'>) => void;
}) => {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState(categoryIcons[0]);
  const [color, setColor] = useState(swatches[0]);
  const [type, setType] = useState<TransactionType | 'both'>('expense');

  useEffect(() => {
    if (!visible) return;
    setName('');
    setIcon(categoryIcons[0]);
    setColor(swatches[0]);
    setType('expense');
  }, [visible]);

  const save = () => {
    if (!name.trim()) return;
    onSave({ name: name.trim(), icon, color, type });
    onClose();
  };

  return (
    <ModalShell visible={visible} title="Custom Category" theme={theme} onClose={onClose}>
      <GlassCard theme={theme}>
        <View style={{ gap: 14 }}>
          <Field label="Name" value={name} onChangeText={setName} theme={theme} placeholder="Coffee" />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {(['expense', 'income', 'both'] as const).map(item => (
              <Chip key={item} label={item} active={type === item} theme={theme} onPress={() => setType(item)} />
            ))}
          </View>
          <Text style={[styles.fieldLabel, { color: theme.muted }]}>Icon</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {categoryIcons.map(item => (
              <Pressable
                key={item}
                onPress={() => setIcon(item)}
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: icon === item ? color : theme.subtle,
                  borderWidth: 1,
                  borderColor: icon === item ? color : theme.border,
                }}
              >
                <AppIcon name={item} color={icon === item ? '#FFFFFF' : color} size={18} />
              </Pressable>
            ))}
          </View>
          <Text style={[styles.fieldLabel, { color: theme.muted }]}>Color</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {swatches.map(item => (
              <Pressable
                key={item}
                onPress={() => setColor(item)}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  backgroundColor: item,
                  borderWidth: color === item ? 3 : 1,
                  borderColor: color === item ? theme.text : theme.border,
                }}
              />
            ))}
          </View>
          <PrimaryButton label="Save Category" icon="check" theme={theme} onPress={save} disabled={!name} />
        </View>
      </GlassCard>
    </ModalShell>
  );
};
