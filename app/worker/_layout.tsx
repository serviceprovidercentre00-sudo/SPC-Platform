// @ts-nocheck
import { Stack } from "expo-router";
import React from "react";

export default function WorkerLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: "#001529", // Main Dark Deep Theme
        },
        headerTintColor: "#D4AF37", // Gold Text
        headerTitleStyle: {
          fontWeight: "bold",
          fontSize: 18,
        },
        headerBackTitleVisible: false,
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen
        name="dashboard"
        options={{
          title: "SPC Worker Dashboard",
          headerLeft: () => null, // Back button disabled on dashboard
        }}
      />
      <Stack.Screen
        name="auth"
        options={{
          title: "Worker Verification",
          headerShown: false,
        }}
      />
    </Stack>
  );
}
