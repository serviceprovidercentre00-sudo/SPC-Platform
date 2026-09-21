// @ts-nocheck
import { Stack } from "expo-router";
import Head from "expo-router/head"; // <--- Head ko expo-router/head se import karna hota hai
import { CartProvider } from "../context/CartContext";

export default function RootLayout() {
  return (
    <CartProvider>
      <Head>
        <title>SPC - Service Provider Center</title>
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="shortcut icon" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/favicon.png" />
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
