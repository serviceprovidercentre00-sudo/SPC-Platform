// @ts-nocheck
import { Stack } from 'expo-router';
import { CartProvider } from '../context/CartContext'; 

export default function RootLayout() {
  return (
    <CartProvider>
      <Stack screenOptions={{ headerShown: false }}>
        {/* Main Tab Navigation */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        
        {/* Dynamic Service Details Page - Bracket [id] is important */}
        <Stack.Screen 
          name="[id]" 
          options={{ 
            headerShown: true, 
            headerTitle: 'Service Details',
            headerStyle: { backgroundColor: '#001529' },
            headerTintColor: '#D4AF37',
            headerTitleStyle: { fontWeight: 'bold' }
          }} 
        />

        {/* Other Pages */}
        <Stack.Screen name="checkout" options={{ headerShown: true, headerTitle: 'Checkout' }} />
        <Stack.Screen name="admin/orders" options={{ headerShown: true, title: 'Manage Orders' }} />
      </Stack>
    </CartProvider>
  );
}