// @ts-nocheck
import { Stack } from "expo-router";
import Head from "expo-router/head";
import { CartProvider } from "../context/CartContext";

export default function RootLayout() {
  return (
    <CartProvider>
      <Head>
        {/* Global Site Title & Branding */}
        <title>
          Service Provider Center (SPC) | Home Repair & Utility Services
        </title>

        {/* Web Favicon Icons */}
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="shortcut icon" href="/favicon.png" type="image/x-icon" />
        <link rel="apple-touch-icon" href="/favicon.png" />

        {/* Global Meta Tags */}
        <meta name="application-name" content="Service Provider Center (SPC)" />
        <meta name="apple-mobile-web-app-title" content="SPC Repair" />
        <meta
          name="description"
          content="Service Provider Center (SPC) - Doorstep home repair, electrician, plumber, fan, and utility services in Patna & Fatwah."
        />
        <meta property="og:site_name" content="Service Provider Center (SPC)" />
      </Head>

      <Stack screenOptions={{ headerShown: false }}>
        {/* Main Tab Navigation */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

        {/* Dynamic Service Details Page */}
        <Stack.Screen
          name="[id]"
          options={{
            headerShown: true,
            headerTitle: "Service Details",
            headerStyle: { backgroundColor: "#001529" },
            headerTintColor: "#D4AF37",
            headerTitleStyle: { fontWeight: "bold" },
          }}
        />

        {/* Other Pages */}
        <Stack.Screen
          name="checkout"
          options={{ headerShown: true, headerTitle: "Checkout" }}
        />
        <Stack.Screen
          name="admin/orders"
          options={{ headerShown: true, title: "Manage Orders" }}
        />
      </Stack>
    </CartProvider>
  );
}
