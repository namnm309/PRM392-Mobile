import { ClerkLoaded, ClerkProvider } from '@clerk/clerk-expo';
import { tokenCache } from '@clerk/clerk-expo/token-cache';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import InitialLayout from '@/components/InitialLayout';

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
          <SafeAreaView style={{ flex: 1 , backgroundColor: "black"}}>
            <InitialLayout />
          </SafeAreaView>
        </SafeAreaProvider>
      </ClerkLoaded>
    </ClerkProvider>
  );
}
