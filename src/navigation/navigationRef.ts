import { createNavigationContainerRef } from '@react-navigation/native';
import type { RootStackParamList } from './RootNavigator';

// Lets code outside a screen (e.g. the 401 handler in AuthContext) navigate.
export const navigationRef = createNavigationContainerRef<RootStackParamList>();
