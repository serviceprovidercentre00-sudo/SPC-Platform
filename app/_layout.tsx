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

        {/* Absolute Favicon URLs for Google Search Crawlers */}
        <link
          rel="icon"
          type="image/png"
          href="https://spc-platform.vercel.app/favicon.png"
        />
        <link
          rel="shortcut icon"
          href="https://spc-platform.vercel.app/favicon.png"
          type="image/x-icon"
        />
        <link
          rel="apple-touch-icon"
          href="https://spc-platform.vercel.app/favicon.png"
        />

        {/* Global & Google Search Site Name Meta Tags */}
        <meta name="application-name" content="Service Provider Center" />
        <meta
          name="apple-mobile-web-app-title"
          content="Service Provider Center"
        />
        <meta name="site_name" content="Service Provider Center" />
        <meta property="og:site_name" content="Service Provider Center" />
        <meta
          name="description"
          content="Service Provider Center (SPC) - Doorstep home repair, electrician, plumber, fan, and utility services in Patna & Fatwah."
        />
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
