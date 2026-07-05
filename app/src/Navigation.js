import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';

import { useAuth } from './auth/AuthContext';
import { colors, FONT } from './theme';
import { HomeIcon, OrdersIcon, PlusIcon, ProfileIcon, ChartIcon } from './components/Icon';

import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import OrdersScreen from './screens/OrdersScreen';
import NewOrderScreen from './screens/NewOrderScreen';
import OrderDetailScreen from './screens/OrderDetailScreen';
import ProfileScreen from './screens/ProfileScreen';
import ActivityScreen from './screens/ActivityScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabItem({ Icon, label, focused }) {
  const color = focused ? colors.ink : colors.muted;
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', width: 60, paddingTop: 2 }}>
      <Icon color={color} size={22} />
      <Text style={{ fontFamily: FONT, fontSize: 10, color, marginTop: 4 }}>{label}</Text>
    </View>
  );
}

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: { height: 72, paddingTop: 10, paddingBottom: 12, backgroundColor: colors.surface, borderTopColor: colors.border, borderTopWidth: 1 },
      }}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen}
        options={{ tabBarIcon: ({ focused }) => <TabItem Icon={HomeIcon} label="الرئيسية" focused={focused} /> }} />
      <Tab.Screen name="OrdersTab" component={OrdersScreen}
        options={{ tabBarIcon: ({ focused }) => <TabItem Icon={OrdersIcon} label="الطلبات" focused={focused} /> }} />
      <Tab.Screen name="NewTab" component={NewOrderScreen}
        options={{ tabBarIcon: ({ focused }) => <TabItem Icon={PlusIcon} label="جديد" focused={focused} /> }} />
      <Tab.Screen name="ActivityTab" component={ActivityScreen}
        options={{ tabBarIcon: ({ focused }) => <TabItem Icon={ChartIcon} label="نشاطي" focused={focused} /> }} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen}
        options={{ tabBarIcon: ({ focused }) => <TabItem Icon={ProfileIcon} label="حسابي" focused={focused} /> }} />
    </Tab.Navigator>
  );
}

export default function Navigation() {
  const { user, booting } = useAuth();

  if (booting) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.ink} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <>
            <Stack.Screen name="Tabs" component={Tabs} />
            <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
            <Stack.Screen name="NewOrder" component={NewOrderScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
