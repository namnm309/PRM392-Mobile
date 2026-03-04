import { Stack } from 'expo-router';

export default function ProfileLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen
        name="edit"
        options={{
          headerShown: true,
          headerTitle: 'Thông tin cá nhân',
          headerBackTitle: 'Quay lại',
        }}
      />
      <Stack.Screen name="vouchers" />
      <Stack.Screen name="orders" />
      <Stack.Screen name="addresses" />
      <Stack.Screen name="wishlist" />
      <Stack.Screen name="linked-accounts" />
      <Stack.Screen name="membership" />
    </Stack>
  );
}
