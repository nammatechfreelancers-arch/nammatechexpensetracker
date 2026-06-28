import React, { useState } from 'react';
import { Alert, Modal, Platform, Pressable, Text, View } from 'react-native';
import { CategoryForm } from '../components/forms';
import { AppIcon } from '../components/icons';
import { GlassCard, Header, LogoMark, PrimaryButton, Screen, ToggleRow, sectionTitle, styles } from '../components/ui';
import { useAppStore } from '../state/AppStore';
import { themes, themeNames } from '../theme/palettes';
import { CurrencyCode, LanguageCode, ThemeTokens } from '../types';
import { toCsv } from '../utils/finance';

const currencies: CurrencyCode[] = ['USD', 'INR', 'EUR', 'GBP', 'JPY'];
const languages: LanguageCode[] = ['English', 'Hindi', 'Spanish', 'French', 'German'];
const appIcons = ['Aurora', 'Graphite', 'Mint', 'Solar'] as const;

const downloadBlob = (content: string, filename: string, mime: string) => {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export const SettingsScreen = () => {
  const { state, updateSettings, importState, addCategory } = useAppStore();
  const theme = themes[state.settings.theme];
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [passcodeOpen, setPasscodeOpen] = useState(false);
  const [passcodeDraft, setPasscodeDraft] = useState('');

  const exportJson = () => {
    if (Platform.OS === 'web') {
      downloadBlob(JSON.stringify(state, null, 2), 'lumora-backup.json', 'application/json');
    } else {
      import('expo-file-system').then(async FileSystem => {
        const uri = `${(FileSystem as any).documentDirectory ?? ''}lumora-backup.json`;
        await (FileSystem as any).writeAsStringAsync(uri, JSON.stringify(state, null, 2));
        const Sharing = await import('expo-sharing');
        if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri);
      }).catch(() => undefined);
    }
  };

  const exportCsv = () => {
    if (Platform.OS === 'web') {
      downloadBlob(toCsv(state), 'lumora-transactions.csv', 'text/csv');
    } else {
      import('expo-file-system').then(async FileSystem => {
        const uri = `${(FileSystem as any).documentDirectory ?? ''}lumora-transactions.csv`;
        await (FileSystem as any).writeAsStringAsync(uri, toCsv(state));
        const Sharing = await import('expo-sharing');
        if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri);
      }).catch(() => undefined);
    }
  };

  const restoreJson = () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/json';
      input.onchange = () => {
        const file = input.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = e => {
          try {
            const ok = importState(JSON.parse(e.target?.result as string));
            Alert.alert(
              ok ? 'Backup restored' : 'Invalid backup',
              ok ? 'Your local data was replaced.' : 'The file did not match the Lumora backup format.',
            );
          } catch {
            Alert.alert('Invalid backup', 'Could not parse the selected file.');
          }
        };
        reader.readAsText(file);
      };
      input.click();
    } else {
      import('expo-document-picker').then(async DocumentPicker => {
        const result = await DocumentPicker.getDocumentAsync({ type: 'application/json', copyToCacheDirectory: true });
        if (result.canceled) return;
        const uri = result.assets[0]?.uri;
        if (!uri) return;
        const FileSystem = await import('expo-file-system');
        const raw = await (FileSystem as any).readAsStringAsync(uri);
        const ok = importState(JSON.parse(raw) as unknown);
        Alert.alert(
          ok ? 'Backup restored' : 'Invalid backup',
          ok ? 'Your local data was replaced by the selected JSON file.' : 'The file did not match the Lumora backup format.',
        );
      }).catch(() => undefined);
    }
  };

  const checkBiometrics = async (enabled: boolean) => {
    if (!enabled) { updateSettings({ biometricsEnabled: false }); return; }
    if (Platform.OS === 'web') {
      Alert.alert('Biometrics unavailable', 'Biometric auth is not supported in the browser.');
      return;
    }
    try {
      const LocalAuth = await import('expo-local-authentication');
      const compatible = await LocalAuth.hasHardwareAsync();
      const enrolled = await LocalAuth.isEnrolledAsync();
      if (!compatible || !enrolled) {
        Alert.alert('Biometrics unavailable', 'Face ID or Touch ID is not available on this device.');
        return;
      }
      const result = await LocalAuth.authenticateAsync({ promptMessage: 'Unlock Lumora' });
      if (result.success) updateSettings({ biometricsEnabled: true });
    } catch {
      Alert.alert('Biometrics unavailable', 'Could not access biometric authentication.');
    }
  };

  const togglePasscode = (enabled: boolean) => {
    if (!enabled) { updateSettings({ passcodeEnabled: false, passcodeCode: '' }); return; }
    setPasscodeDraft('');
    setPasscodeOpen(true);
  };

  return (
    <Screen theme={theme}>
      <Header
        eyebrow="Device Only"
        title="Settings"
        subtitle="Preferences, privacy, and portable local backups"
        theme={theme}
        right={<LogoMark />}
      />

      <Text style={sectionTitle(theme)}>Themes</Text>
      <GlassCard theme={theme}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {themeNames.map(name => {
            const palette = themes[name];
            const active = state.settings.theme === name;
            return (
              <Pressable
                key={name}
                accessibilityRole="button"
                accessibilityLabel={`Use ${name} theme`}
                onPress={() => updateSettings({ theme: name })}
                style={{
                  width: '47%',
                  minHeight: 72,
                  borderRadius: 20,
                  padding: 12,
                  borderWidth: active ? 2 : 1,
                  borderColor: active ? palette.primary : theme.border,
                  backgroundColor: palette.surface,
                  justifyContent: 'space-between',
                }}
              >
                <View style={{ flexDirection: 'row', gap: 5 }}>
                  {palette.chart.slice(0, 4).map(color => (
                    <View key={color} style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: color }} />
                  ))}
                </View>
                <Text style={{ color: palette.text, fontWeight: '900' }}>{name}</Text>
              </Pressable>
            );
          })}
        </View>
      </GlassCard>

      <Text style={sectionTitle(theme)}>Currency & Language</Text>
      <GlassCard theme={theme}>
        <View style={{ gap: 16 }}>
          <PickerRow label="Currency" values={currencies} value={state.settings.currency} theme={theme} onSelect={value => updateSettings({ currency: value })} />
          <PickerRow label="Language" values={languages} value={state.settings.language} theme={theme} onSelect={value => updateSettings({ language: value })} />
        </View>
      </GlassCard>

      <Text style={sectionTitle(theme)}>Backup & Restore</Text>
      <GlassCard theme={theme}>
        <View style={{ gap: 10 }}>
          <PrimaryButton label="Export JSON Backup" icon="file-json" theme={theme} onPress={exportJson} />
          <PrimaryButton label="Export CSV" icon="download" theme={theme} tone="subtle" onPress={exportCsv} />
          <PrimaryButton label="Import JSON Backup" icon="upload" theme={theme} tone="subtle" onPress={restoreJson} />
        </View>
      </GlassCard>

      <Text style={sectionTitle(theme)}>Privacy & Lock</Text>
      <GlassCard theme={theme}>
        <View style={{ gap: 6 }}>
          <ToggleRow
            title="Passcode Lock"
            subtitle={state.settings.passcodeEnabled ? 'Enabled with a device-stored PIN.' : 'Set a local 4-digit PIN.'}
            value={state.settings.passcodeEnabled}
            onValueChange={togglePasscode}
            theme={theme}
            icon="lock"
          />
          <ToggleRow
            title="Face ID / Touch ID"
            subtitle={Platform.OS === 'web' ? 'Not available in browser.' : 'Uses device authentication when supported.'}
            value={state.settings.biometricsEnabled}
            onValueChange={checkBiometrics}
            theme={theme}
            icon="fingerprint"
          />
          <ToggleRow
            title="High Contrast"
            subtitle="Boosts emphasis for cards and controls."
            value={state.settings.highContrast}
            onValueChange={value => updateSettings({ highContrast: value })}
            theme={theme}
            icon="eye"
          />
        </View>
      </GlassCard>

      <Text style={sectionTitle(theme)}>App Icon</Text>
      <GlassCard theme={theme}>
        <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
          {appIcons.map(name => (
            <Pressable
              key={name}
              onPress={() => updateSettings({ selectedAppIcon: name })}
              style={{
                width: '47%',
                minHeight: 74,
                borderRadius: 20,
                padding: 12,
                backgroundColor: state.settings.selectedAppIcon === name ? `${theme.primary}22` : theme.subtle,
                borderWidth: 1,
                borderColor: state.settings.selectedAppIcon === name ? theme.primary : theme.border,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <LogoMark size={34} />
              <Text style={{ color: theme.text, fontWeight: '900' }}>{name}</Text>
            </Pressable>
          ))}
        </View>
      </GlassCard>

      <Text style={sectionTitle(theme)}>Categories</Text>
      <GlassCard theme={theme}>
        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {state.categories.map(category => (
              <View
                key={category.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 7,
                  paddingHorizontal: 10,
                  paddingVertical: 8,
                  borderRadius: 999,
                  backgroundColor: theme.subtle,
                }}
              >
                <AppIcon name={category.icon} color={category.color} size={15} />
                <Text style={{ color: theme.text, fontWeight: '800', fontSize: 13 }}>{category.name}</Text>
              </View>
            ))}
          </View>
          <PrimaryButton label="Add Custom Category" icon="plus" theme={theme} tone="subtle" onPress={() => setCategoryOpen(true)} />
        </View>
      </GlassCard>

      <Text style={sectionTitle(theme)}>About & Privacy</Text>
      <GlassCard theme={theme}>
        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={[styles.iconBubble, { backgroundColor: `${theme.primary}22` }]}>
              <AppIcon name="shield" color={theme.primary} size={18} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.text, fontSize: 17, fontWeight: '900' }}>Lumora Expense Tracker</Text>
              <Text style={[styles.caption, { color: theme.muted }]}>Offline-first finance tracking. No accounts, no ads, no telemetry.</Text>
            </View>
          </View>
          <Text style={{ color: theme.muted, lineHeight: 21 }}>
            Your transactions, categories, budgets, goals, receipts, and settings are stored locally with AsyncStorage and portable JSON backups.
          </Text>
        </View>
      </GlassCard>

      <CategoryForm visible={categoryOpen} theme={theme} onClose={() => setCategoryOpen(false)} onSave={addCategory} />
      <Modal visible={passcodeOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setPasscodeOpen(false)}>
        <View style={{ flex: 1, backgroundColor: theme.background, padding: 22, justifyContent: 'center', gap: 18 }}>
          <LogoMark size={58} />
          <Text style={{ color: theme.text, fontSize: 29, fontWeight: '900' }}>Set Passcode</Text>
          <Text style={{ color: theme.muted, lineHeight: 21 }}>Choose a 4-digit local PIN. It stays in this app's device storage and is included in JSON backups.</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12 }}>
            {[0, 1, 2, 3].map(index => (
              <View
                key={index}
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 8,
                  backgroundColor: passcodeDraft.length > index ? theme.primary : theme.subtle,
                  borderWidth: 1,
                  borderColor: theme.border,
                }}
              />
            ))}
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12 }}>
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].map(digit => (
              <Pressable
                key={digit}
                onPress={() => setPasscodeDraft(value => `${value}${digit}`.slice(0, 4))}
                style={({ pressed }) => ({
                  width: 70,
                  height: 56,
                  borderRadius: 22,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: theme.subtle,
                  opacity: pressed ? 0.75 : 1,
                })}
              >
                <Text style={{ color: theme.text, fontSize: 23, fontWeight: '900' }}>{digit}</Text>
              </Pressable>
            ))}
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <PrimaryButton label="Clear" theme={theme} tone="subtle" onPress={() => setPasscodeDraft('')} />
            <View style={{ flex: 1 }}>
              <PrimaryButton
                label="Enable"
                icon="check"
                theme={theme}
                disabled={passcodeDraft.length !== 4}
                onPress={() => {
                  updateSettings({ passcodeEnabled: true, passcodeCode: passcodeDraft });
                  setPasscodeOpen(false);
                }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
};

const PickerRow = <T extends string>({
  label,
  values,
  value,
  onSelect,
  theme,
}: {
  label: string;
  values: readonly T[];
  value: T;
  onSelect: (value: T) => void;
  theme: ThemeTokens;
}) => (
  <View style={{ gap: 8 }}>
    <Text style={[styles.fieldLabel, { color: theme.muted }]}>{label}</Text>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {values.map(item => (
        <Pressable
          key={item}
          onPress={() => onSelect(item)}
          style={{
            minHeight: 38,
            paddingHorizontal: 12,
            borderRadius: 999,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: value === item ? theme.primary : theme.subtle,
            borderWidth: 1,
            borderColor: value === item ? theme.primary : theme.border,
          }}
        >
          <Text style={{ color: value === item ? '#FFFFFF' : theme.text, fontWeight: '800' }}>{item}</Text>
        </Pressable>
      ))}
    </View>
  </View>
);
