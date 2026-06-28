import React, { useState } from 'react';
import { Alert, Platform, Pressable, Text, View } from 'react-native';
import { AppIcon } from '../components/icons';
import { LogoMark } from '../components/ui';
import { useAppStore } from '../state/AppStore';
import { themes } from '../theme/palettes';

export const LockScreen = ({ onUnlock }: { onUnlock: () => void }) => {
  const { state } = useAppStore();
  const theme = themes[state.settings.theme];
  const [pin, setPin] = useState('');

  const addDigit = (digit: string) => {
    const next = `${pin}${digit}`.slice(0, 4);
    setPin(next);
    if (next.length === 4) {
      if (next === state.settings.passcodeCode) {
        onUnlock();
      } else {
        setTimeout(() => setPin(''), 180);
      }
    }
  };

  const unlockWithBiometrics = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Unavailable', 'Biometric unlock is not supported in the browser.');
      return;
    }
    try {
      const LocalAuth = await import('expo-local-authentication');
      const result = await LocalAuth.authenticateAsync({ promptMessage: 'Unlock Lumora' });
      if (result.success) onUnlock();
      else Alert.alert('Unlock failed', 'Try Face ID, Touch ID, or your passcode again.');
    } catch {
      Alert.alert('Unavailable', 'Biometric authentication is not available.');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 26 }}>
      <LogoMark size={72} />
      <View style={{ alignItems: 'center', gap: 8 }}>
        <Text style={{ color: theme.text, fontSize: 30, fontWeight: '900' }}>Lumora Locked</Text>
        <Text style={{ color: theme.muted, fontSize: 15, textAlign: 'center' }}>Enter your local passcode to view expense data.</Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        {[0, 1, 2, 3].map(index => (
          <View
            key={index}
            style={{
              width: 14,
              height: 14,
              borderRadius: 7,
              backgroundColor: pin.length > index ? theme.primary : theme.subtle,
              borderWidth: 1,
              borderColor: theme.border,
            }}
          />
        ))}
      </View>
      <View style={{ width: 250, flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(digit => (
          <Key key={digit} label={digit} onPress={() => addDigit(digit)} />
        ))}
        <Key label="Face" icon="fingerprint" onPress={unlockWithBiometrics} disabled={!state.settings.biometricsEnabled || Platform.OS === 'web'} />
        <Key label="0" onPress={() => addDigit('0')} />
        <Key label="Del" icon="x" onPress={() => setPin(value => value.slice(0, -1))} />
      </View>
    </View>
  );
};

const Key = ({
  label,
  icon,
  onPress,
  disabled,
}: {
  label: string;
  icon?: string;
  onPress: () => void;
  disabled?: boolean;
}) => {
  const { state } = useAppStore();
  const theme = themes[state.settings.theme];
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        width: 70,
        height: 62,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.subtle,
        opacity: disabled ? 0.35 : pressed ? 0.7 : 1,
      })}
    >
      {icon ? <AppIcon name={icon} color={theme.text} size={20} /> : <Text style={{ color: theme.text, fontSize: 24, fontWeight: '900' }}>{label}</Text>}
    </Pressable>
  );
};
