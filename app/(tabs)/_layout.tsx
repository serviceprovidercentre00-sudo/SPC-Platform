// @ts-nocheck
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#002D62', // Dark Blue
        tabBarInactiveTintColor: '#94A3B8', // Greyish Blue
        tabBarStyle: {
          height: Platform.OS === 'ios' ? 90 : 70,
          paddingBottom: 10,
          borderTopWidth: 1,
          borderTopColor: '#E2E8F0',
          backgroundColor: '#FFFFFF',
          elevation: 10, // Shadow for android
        },
        headerStyle: {
          backgroundColor: '#002D62',
        },
        headerTintColor: '#D4AF37', // Gold color
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      {/* 1. HOME TAB */}
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
      
      {/* 2. ORDERS TAB (Maine name badal kar 'orders' kar diya hai) */}
      <Tabs.Screen
        name="orders" 
        options={{
          title: 'Orders',
          headerTitle: 'My Bookings',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "receipt" : "receipt-outline"} size={24} color={color} />
          ),
        }}
      />

      {/* 3. PROFILE TAB */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Account',
          headerTitle: 'My Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "person" : "person-outline"} size={24} color={color} />
          ),
        }}
      />

      {/* 4. CART TAB (Isko hidden rakha hai kyunki ye niche bar mein nahi chahiye) */}
      <Tabs.Screen
        name="cart"
        options={{
          href: null, // Isse ye niche tab bar mein nahi dikhega
          title: 'Cart',
          headerTitle: 'My Cart',
        }}
      />
    </Tabs>
  );
}