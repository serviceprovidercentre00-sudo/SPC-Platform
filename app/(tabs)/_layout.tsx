import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
// Sahi Path: Do baar peeche jana padega (app se bahar nikalne ke liye)
import { CartProvider } from '../../context/CartContext'; 

export default function TabLayout() {
  return (
    <CartProvider>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#002D62', 
          tabBarInactiveTintColor: '#94A3B8',
          tabBarStyle: {
            height: Platform.OS === 'ios' ? 90 : 70,
            paddingBottom: 10,
            borderTopWidth: 1,
            borderTopColor: '#E2E8F0',
            backgroundColor: '#FFFFFF',
          },
          headerStyle: {
            backgroundColor: '#002D62',
          },
          headerTintColor: '#D4AF37',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            headerTitle: 'SPC PATNA',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? "home" : "home-outline"} size={24} color={color} />
            ),
          }}
        />
        
        <Tabs.Screen
          name="cart"
          options={{
            title: 'Orders',
            headerTitle: 'My Cart',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? "cart" : "cart-outline"} size={24} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="profile"
          options={{
            title: 'Account',
            headerTitle: 'Profile',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? "person" : "person-outline"} size={24} color={color} />
            ),
          }}
        />
      </Tabs>
    </CartProvider>
  );
}