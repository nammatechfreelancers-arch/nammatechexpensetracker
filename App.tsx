import 'react-native-gesture-handler';
import { DefaultTheme, NavigationContainer, Theme as NavigationTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Text, View } from 'react-native';
import { tabIcons } from './src/components/icons';
import { LoadingState } from './src/components/ui';
import { AnalyticsScreen } from './src/screens/AnalyticsScreen';
import { BudgetsScreen } from './src/screens/BudgetsScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { LockScreen } from './src/screens/LockScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { TransactionsScreen } from './src/screens/TransactionsScreen';
import { AppStoreProvider, useAppStore } from './src/state/AppStore';
import { themes } from './src/theme/palettes';

export type RootTabParamList = {
  Dashboard: undefined;
  Transactions: undefined;
  Analytics: undefined;
  Budgets: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

const AppNavigator = () => {
  const { state, isHydrated } = useAppStore();
  const theme = themes[state.settings.theme];
  const [isUnlocked, setIsUnlocked] = React.useState(false);

  if (!isHydrated) return <LoadingState theme={theme} />;
  if (state.settings.passcodeEnabled && state.settings.passcodeCode && !isUnlocked) {
    return <LockScreen onUnlock={() => setIsUnlocked(true)} />;
  }

  const navigationTheme: NavigationTheme = {
    ...DefaultTheme,
    dark: theme.isDark,
    colors: {
      ...DefaultTheme.colors,
      primary: theme.primary,
      background: theme.background,
      card: theme.glass,
      text: theme.text,
      border: theme.border,
      notification: theme.danger,
    },
  };

  return (
    <NavigationContainer theme={navigationTheme}>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      <Tab.Navigator
        initialRouteName="Dashboard"
        screenOptions={({ route }) => {
          const Icon = tabIcons[route.name];
          return {
            headerShown: false,
            tabBarHideOnKeyboard: true,
            tabBarStyle: {
              position: 'absolute',
              left: 14,
              right: 14,
              bottom: 14,
              height: 76,
              borderRadius: 28,
              borderWidth: 1,
              borderColor: theme.border,
              backgroundColor: theme.glass,
              shadowColor: theme.shadow,
              shadowOpacity: 0.18,
              shadowRadius: 24,
              shadowOffset: { width: 0, height: 12 },
              elevation: 12,
            },
            tabBarShowLabel: false,
            tabBarItemStyle: { paddingVertical: 10 },
            tabBarIcon: ({ focused }) => (
              <View
                style={{
                  width: 58,
                  height: 50,
                  borderRadius: 20,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: focused ? `${theme.primary}22` : 'transparent',
                }}
              >
                <Icon color={focused ? theme.primary : theme.muted} size={22} strokeWidth={focused ? 2.7 : 2.1} />
                <Text numberOfLines={1} style={{ color: focused ? theme.primary : theme.muted, fontSize: 10, fontWeight: '800', marginTop: 3 }}>
                  {route.name}
                </Text>
              </View>
            ),
          };
        }}
      >
        <Tab.Screen name="Dashboard" component={DashboardScreen} />
        <Tab.Screen name="Transactions" component={TransactionsScreen} />
        <Tab.Screen name="Analytics" component={AnalyticsScreen} />
        <Tab.Screen name="Budgets" component={BudgetsScreen} />
        <Tab.Screen name="Settings" component={SettingsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <AppStoreProvider>
      <AppNavigator />
    </AppStoreProvider>
  );
}
