import { ClerkLoaded, ClerkProvider } from '@clerk/clerk-expo';
import { tokenCache } from '@clerk/clerk-expo/token-cache';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View } from 'react-native';
import InitialLayout from '@/components/InitialLayout';
import { CartProvider } from '@/contexts/CartContext';
import { COLORS } from '@/constants/theme';

//Tạo biến để tải clerk key từ env.local ( chỉ có máy của mình)
const publishablekey=process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!

if (!publishablekey) {
  throw new Error (
    'Thiếu key cho Clerk Auth . Hãy tạo file .env.local nếu chưa có và nạp key vào '
  )
}

export default function RootLayout() { 
  return (
    <ClerkProvider publishableKey={publishablekey} tokenCache={tokenCache} >
      <ClerkLoaded>
        <SafeAreaProvider>
          <CartProvider>
            <View style={{ flex: 1, backgroundColor: COLORS.background }}>
              <InitialLayout />
            </View>
          </CartProvider>
        </SafeAreaProvider>
      </ClerkLoaded>
    </ClerkProvider>
  );
}
