import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CategoryId } from '../types';
import { colors } from '../theme';
import { useAuth } from '../context/AuthContext';

import SplashScreen from '../screens/SplashScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import PhoneScreen from '../screens/PhoneScreen';
import OtpScreen from '../screens/OtpScreen';
import HomeScreen from '../screens/HomeScreen';
import CategoryScreen from '../screens/CategoryScreen';
import SearchScreen from '../screens/SearchScreen';
import CartScreen from '../screens/CartScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import OrderConfirmedScreen from '../screens/OrderConfirmedScreen';
import OrderStatusScreen from '../screens/OrderStatusScreen';
import OrderHistoryScreen from '../screens/OrderHistoryScreen';
import InvoiceScreen from '../screens/InvoiceScreen';
import WalletScreen from '../screens/WalletScreen';
import AccountScreen from '../screens/AccountScreen';
import AddressesScreen from '../screens/AddressesScreen';
import AddAddressScreen from '../screens/AddAddressScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import MapPickerScreen from '../screens/MapPickerScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import NotificationSettingsScreen from '../screens/NotificationSettingsScreen';
import CouponsScreen from '../screens/CouponsScreen';

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Phone: undefined;
  Otp: { phone: string };
  Home: undefined;
  Category: { categoryId: CategoryId };
  Search: undefined;
  Cart: undefined;
  Checkout: undefined;
  OrderConfirmed: { orderId: string };
  OrderStatus: { orderId: string };
  OrderHistory: undefined;
  Invoice: { orderId: string };
  Wallet: undefined;
  Account: undefined;
  Addresses: undefined;
  AddAddress: { editId?: string; firstTime?: boolean; picked?: { lat: number; lng: number; address: string } } | undefined;
  MapPicker: { lat: number; lng: number } | undefined;
  EditProfile: undefined;
  Favorites: undefined;
  NotificationSettings: undefined;
  Coupons: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { isLoggedIn } = useAuth();
  return (
    <Stack.Navigator
      initialRouteName={isLoggedIn ? 'Home' : 'Splash'}
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.surface } }}
    >
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Phone" component={PhoneScreen} />
      <Stack.Screen name="Otp" component={OtpScreen} />
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Category" component={CategoryScreen} />
      <Stack.Screen name="Search" component={SearchScreen} />
      <Stack.Screen name="Cart" component={CartScreen} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} />
      <Stack.Screen name="OrderConfirmed" component={OrderConfirmedScreen} />
      <Stack.Screen name="OrderStatus" component={OrderStatusScreen} />
      <Stack.Screen name="OrderHistory" component={OrderHistoryScreen} />
      <Stack.Screen name="Invoice" component={InvoiceScreen} />
      <Stack.Screen name="Wallet" component={WalletScreen} />
      <Stack.Screen name="Account" component={AccountScreen} />
      <Stack.Screen name="Addresses" component={AddressesScreen} />
      <Stack.Screen name="AddAddress" component={AddAddressScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="MapPicker" component={MapPickerScreen} />
      <Stack.Screen name="Favorites" component={FavoritesScreen} />
      <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
      <Stack.Screen name="Coupons" component={CouponsScreen} />
    </Stack.Navigator>
  );
}
