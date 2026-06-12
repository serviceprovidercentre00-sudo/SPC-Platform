// @ts-nocheck
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Platform } from "react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#002D62", // Dark Blue
        tabBarInactiveTintColor: "#94A3B8", // Greyish Blue
        tabBarStyle: {
          height: Platform.OS === "ios" ? 90 : 70,
          paddingBottom: 10,
          borderTopWidth: 1,
          borderTopColor: "#E2E8F0",
          backgroundColor: "#FFFFFF",
          elevation: 10, // Shadow for android
        },
        headerStyle: {
          backgroundColor: "#002D62",
        },
        headerTintColor: "#D4AF37", // Gold color
        headerTitleStyle: {
          fontWeight: "bold",
        },
      }}
    >
      {/* 1. HOME TAB */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          headerTitle: "SPC PATNA",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />

      {/* 2. ORDERS TAB */}
      <Tabs.Screen
        name="orders"
        options={{
          title: "Orders",
          headerTitle: "My Bookings",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "receipt" : "receipt-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />

      {/* 3. PROFILE TAB */}
      <Tabs.Screen
        name="profile"
        options={{
          title: "Account",
          headerTitle: "My Profile",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />

      {/* 🌟 4. ABOUT SPC TAB (Broken Icon Fixed Here) */}
      <Tabs.Screen
        name="about"
        options={{
          title: "About SPC",
          headerTitle: "About Us",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={
                focused ? "information-circle" : "information-circle-outline"
              }
              size={24}
              color={color}
            />
          ),
        }}
      />

      {/* 🌟 5. SPC WALLET TAB (Broken Icon Fixed Here) */}
      <Tabs.Screen
        name="wallet"
        options={{
          title: "SPC Wallet",
          headerTitle: "My Wallet",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "wallet" : "wallet-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />

      {/* 6. CART TAB (Hidden from bottom bar) */}
      <Tabs.Screen
        name="cart"
        options={{
          href: null, // Isse ye niche tab bar mein nahi dikhega
          title: "Cart",
          headerTitle: "My Cart",
        }}
      />
    </Tabs>
  );
}
