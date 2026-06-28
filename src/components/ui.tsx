import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Path, Stop } from 'react-native-svg';
import { ThemeTokens } from '../types';
import { AppIcon } from './icons';

export const LogoMark = ({ size = 46 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 64 64" accessibilityLabel="Lumora app logo">
    <Defs>
      <SvgGradient id="logoGradient" x1="8" y1="56" x2="56" y2="8">
        <Stop offset="0" stopColor="#0F766E" />
        <Stop offset="0.55" stopColor="#38BDF8" />
        <Stop offset="1" stopColor="#F59E0B" />
      </SvgGradient>
    </Defs>
    <Circle cx="32" cy="32" r="28" fill="url(#logoGradient)" />
    <Path d="M19 39.5C25 40 29.5 37.6 32.5 32.2C35.8 26.4 40 23.2 46 24" fill="none" stroke="#FFFFFF" strokeWidth="5.5" strokeLinecap="round" />
    <Path d="M22 44H45" fill="none" stroke="#FFFFFF" strokeOpacity="0.7" strokeWidth="4" strokeLinecap="round" />
    <Circle cx="21" cy="22" r="4.4" fill="#FFFFFF" fillOpacity="0.92" />
  </Svg>
);

export const Screen = ({
  children,
  theme,
  scroll = true,
}: {
  children: React.ReactNode;
  theme: ThemeTokens;
  scroll?: boolean;
}) => {
  const insets = useSafeAreaInsets();
  const content = (
    <View style={[styles.screenInner, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 104 }]}>
      {children}
    </View>
  );

  return (
    <LinearGradient colors={theme.gradient} style={styles.screen}>
      {scroll ? (
        <ScrollView showsVerticalScrollIndicator={false} contentInsetAdjustmentBehavior="automatic">
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </LinearGradient>
  );
};

export const Header = ({
  eyebrow,
  title,
  subtitle,
  theme,
  right,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  theme: ThemeTokens;
  right?: React.ReactNode;
}) => (
  <View style={styles.header}>
    <View style={{ flex: 1 }}>
      {eyebrow ? <Text style={[styles.eyebrow, { color: theme.primary }]}>{eyebrow}</Text> : null}
      <Text allowFontScaling style={[styles.title, { color: theme.text }]}>
        {title}
      </Text>
      {subtitle ? <Text style={[styles.subtitle, { color: theme.muted }]}>{subtitle}</Text> : null}
    </View>
    {right}
  </View>
);

export const GlassCard = ({
  children,
  theme,
  style,
  padded = true,
}: {
  children: React.ReactNode;
  theme: ThemeTokens;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
}) => (
  <BlurView intensity={theme.isDark ? 28 : 42} tint={theme.isDark ? 'dark' : 'light'} style={[styles.cardShell, style]}>
    <View
      style={[
        styles.card,
        padded && styles.cardPadding,
        {
          backgroundColor: theme.glass,
          borderColor: theme.border,
          shadowColor: theme.shadow,
        },
      ]}
    >
      {children}
    </View>
  </BlurView>
);

export const StatCard = ({
  label,
  value,
  icon,
  accent,
  theme,
  caption,
}: {
  label: string;
  value: string;
  icon: string;
  accent: string;
  theme: ThemeTokens;
  caption?: string;
}) => (
  <GlassCard theme={theme} style={styles.statCard}>
    <View style={[styles.iconBubble, { backgroundColor: `${accent}24` }]}>
      <AppIcon name={icon} color={accent} size={19} />
    </View>
    <Text style={[styles.cardLabel, { color: theme.muted }]}>{label}</Text>
    <Text adjustsFontSizeToFit numberOfLines={1} style={[styles.statValue, { color: theme.text }]}>
      {value}
    </Text>
    {caption ? <Text style={[styles.caption, { color: theme.muted }]}>{caption}</Text> : null}
  </GlassCard>
);

export const PrimaryButton = ({
  label,
  icon,
  theme,
  onPress,
  tone = 'primary',
  disabled,
}: {
  label: string;
  icon?: string;
  theme: ThemeTokens;
  onPress: () => void;
  tone?: 'primary' | 'subtle' | 'danger';
  disabled?: boolean;
}) => {
  const background = tone === 'primary' ? theme.primary : tone === 'danger' ? theme.danger : theme.subtle;
  const color = tone === 'subtle' ? theme.text : '#FFFFFF';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: background, opacity: disabled ? 0.5 : pressed ? 0.82 : 1 },
      ]}
    >
      {icon ? <AppIcon name={icon} color={color} size={18} /> : null}
      <Text style={[styles.buttonLabel, { color }]}>{label}</Text>
    </Pressable>
  );
};

export const IconButton = ({
  icon,
  label,
  theme,
  onPress,
  tone = 'default',
}: {
  icon: string;
  label: string;
  theme: ThemeTokens;
  onPress: () => void;
  tone?: 'default' | 'danger' | 'primary';
}) => {
  const color = tone === 'danger' ? theme.danger : tone === 'primary' ? theme.primary : theme.text;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.iconButton,
        { backgroundColor: theme.subtle, opacity: pressed ? 0.72 : 1, borderColor: theme.border },
      ]}
    >
      <AppIcon name={icon} color={color} size={18} />
    </Pressable>
  );
};

export const Chip = ({
  label,
  active,
  theme,
  onPress,
  color,
}: {
  label: string;
  active?: boolean;
  theme: ThemeTokens;
  onPress?: () => void;
  color?: string;
}) => (
  <Pressable
    accessibilityRole={onPress ? 'button' : 'text'}
    onPress={onPress}
    style={[
      styles.chip,
      {
        backgroundColor: active ? color ?? theme.primary : theme.subtle,
        borderColor: active ? color ?? theme.primary : theme.border,
      },
    ]}
  >
    <Text style={[styles.chipText, { color: active ? '#FFFFFF' : theme.text }]}>{label}</Text>
  </Pressable>
);

export const ProgressBar = ({
  value,
  theme,
  color,
  height = 9,
}: {
  value: number;
  theme: ThemeTokens;
  color?: string;
  height?: number;
}) => (
  <View style={[styles.progressTrack, { backgroundColor: theme.subtle, height }]}>
    <View
      style={[
        styles.progressFill,
        {
          backgroundColor: color ?? theme.primary,
          width: `${Math.max(0, Math.min(100, value))}%`,
        },
      ]}
    />
  </View>
);

export const Field = ({
  label,
  value,
  onChangeText,
  theme,
  placeholder,
  keyboardType,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  theme: ThemeTokens;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'decimal-pad';
  multiline?: boolean;
}) => (
  <View style={styles.fieldWrap}>
    <Text style={[styles.fieldLabel, { color: theme.muted }]}>{label}</Text>
    <TextInput
      allowFontScaling
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={theme.muted}
      keyboardType={keyboardType}
      multiline={multiline}
      style={[
        styles.input,
        multiline && styles.multiline,
        { color: theme.text, backgroundColor: theme.subtle, borderColor: theme.border },
      ]}
    />
  </View>
);

export const ToggleRow = ({
  title,
  subtitle,
  value,
  onValueChange,
  theme,
  icon,
}: {
  title: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  theme: ThemeTokens;
  icon: string;
}) => (
  <View style={styles.toggleRow}>
    <View style={[styles.iconBubble, { backgroundColor: `${theme.primary}22` }]}>
      <AppIcon name={icon} color={theme.primary} size={18} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={[styles.rowTitle, { color: theme.text }]}>{title}</Text>
      {subtitle ? <Text style={[styles.caption, { color: theme.muted }]}>{subtitle}</Text> : null}
    </View>
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: theme.subtle, true: `${theme.primary}66` }}
      thumbColor={value ? theme.primary : theme.muted}
    />
  </View>
);

export const LoadingState = ({ theme }: { theme: ThemeTokens }) => (
  <LinearGradient colors={theme.gradient} style={[styles.screen, styles.loading]}>
    <LogoMark size={58} />
    <ActivityIndicator color={theme.primary} style={{ marginTop: 20 }} />
  </LinearGradient>
);

export const sectionTitle = (theme: ThemeTokens): StyleProp<TextStyle> => [
  styles.sectionTitle,
  { color: theme.text },
];

export const styles = StyleSheet.create({
  screen: { flex: 1 },
  screenInner: { paddingHorizontal: 18, gap: 16 },
  loading: { alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 2 },
  eyebrow: { fontSize: 12, fontWeight: '800', letterSpacing: 0, textTransform: 'uppercase' },
  title: { fontSize: 34, fontWeight: '800', letterSpacing: 0 },
  subtitle: { marginTop: 5, fontSize: 15, lineHeight: 21 },
  sectionTitle: { fontSize: 20, fontWeight: '800', letterSpacing: 0 },
  cardShell: { borderRadius: 26, overflow: 'hidden' },
  card: {
    borderWidth: 1,
    borderRadius: 26,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 6,
  },
  cardPadding: { padding: 16 },
  statCard: { flex: 1, minWidth: 154 },
  iconBubble: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLabel: { marginTop: 12, fontSize: 13, fontWeight: '700' },
  statValue: { marginTop: 4, fontSize: 24, fontWeight: '900', letterSpacing: 0 },
  caption: { fontSize: 12, lineHeight: 17 },
  button: {
    minHeight: 50,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
  },
  buttonLabel: { fontSize: 15, fontWeight: '800' },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: { fontSize: 13, fontWeight: '800' },
  progressTrack: { borderRadius: 999, overflow: 'hidden', width: '100%' },
  progressFill: { height: '100%', borderRadius: 999 },
  fieldWrap: { gap: 7 },
  fieldLabel: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
  input: {
    minHeight: 48,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 16,
    fontWeight: '600',
  },
  multiline: { minHeight: 86, paddingTop: 12, textAlignVertical: 'top' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 58 },
  rowTitle: { fontSize: 16, fontWeight: '800' },
});
