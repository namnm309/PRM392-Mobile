import type { ProductDetail } from '@/constants/productDetailData';
import { useAuth } from '@clerk/clerk-expo';
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useEffect,
  useRef,
} from 'react';
import {
  getCart,
  addCartItem,
  updateCartItem,
  removeCartItem,
  type CartItemDto,
} from '@/lib/cartApi';

export type CartItem = {
  id: string;
  productId: string;
  name: string;
  priceCurrent: number;
  priceOriginal: number;
  imageUri?: string | null;
  quantity: number;
  selected?: boolean;
  isAvailable?: boolean;
  maxQuantity?: number;
  reasonUnavailable?: string | null;
};

type CartContextValue = {
  items: CartItem[];
  addToCart: (product: Pick<ProductDetail, 'id' | 'name' | 'priceCurrent' | 'priceOriginal' | 'imageUri'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  toggleSelect: (id: string) => void;
  selectAll: (selected: boolean) => void;
  selectOnly: (productId: string) => void;
  reloadCart: () => Promise<void>;
  selectedIds: Set<string>;
  subtotal: number;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { getToken, isSignedIn } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const cartLoadedRef = useRef(false);

  // Map CartItemDto to CartItem
  const mapCartItemDtoToCartItem = useCallback((dto: CartItemDto): CartItem => {
    return {
      id: dto.id,
      productId: dto.productId,
      name: dto.productName,
      priceCurrent: dto.productDiscountPrice ?? dto.productPrice,
      priceOriginal: dto.productPrice,
      imageUri: dto.productImageUrl,
      quantity: dto.quantity,
      selected: true,
      isAvailable: dto.isAvailable,
      maxQuantity: dto.maxQuantity,
      reasonUnavailable: dto.reasonUnavailable ?? null,
    };
  }, []);

  // Load cart from backend
  const loadCart = useCallback(async () => {
    if (!isSignedIn || !getToken) return;
    
    try {
      setLoading(true);
      const cart = await getCart(getToken);
      const mappedItems = cart.items.map(mapCartItemDtoToCartItem);
      
      // Preserve selected state from existing items
      setItems((prevItems) => {
        if (prevItems.length === 0) {
          // First load, all items selected by default
          return mappedItems;
        }
        
        // Merge: keep existing selection state
        const prevSelectedMap = new Map(
          prevItems.map(item => [item.id, item.selected ?? true])
        );
        
        return mappedItems.map(item => ({
          ...item,
          selected: prevSelectedMap.get(item.id) ?? true,
        }));
      });
    } catch (error) {
      console.error('Error loading cart:', error);
      // Continue with empty cart if error
    } finally {
      setLoading(false);
    }
  }, [isSignedIn, getToken, mapCartItemDtoToCartItem]);

  // Load cart on mount when user signs in and clear once when signing out
  useEffect(() => {
    if (isSignedIn && !cartLoadedRef.current) {
      cartLoadedRef.current = true;
      loadCart();
    } else if (!isSignedIn && cartLoadedRef.current) {
      // Clear cart only once after user signs out
      setItems([]);
      cartLoadedRef.current = false;
    }
  }, [isSignedIn, loadCart]);

  const addToCart = useCallback(
    async (product: Pick<ProductDetail, 'id' | 'name' | 'priceCurrent' | 'priceOriginal' | 'imageUri'>) => {
      if (!isSignedIn || !getToken) {
        // If not signed in, just update local state
        setItems((prev) => {
          const existing = prev.find((i) => i.id === product.id);
          if (existing) {
            return prev.map((i) =>
              i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
            );
          }
          return [
            ...prev,
            {
              id: product.id,
              productId: product.id,
              name: product.name,
              priceCurrent: product.priceCurrent,
              priceOriginal: product.priceOriginal,
              imageUri: product.imageUri,
              quantity: 1,
              selected: true,
              isAvailable: true,
              maxQuantity: 999,
              reasonUnavailable: null,
            },
          ];
        });
        return;
      }

      try {
        // Sync with backend
        const existing = items.find((i) => i.id === product.id);
        if (existing) {
          // Update quantity
          await updateCartItem(getToken, existing.id, { quantity: existing.quantity + 1 });
        } else {
          // Add new item
          await addCartItem(getToken, {
            productId: product.id,
            quantity: 1,
          });
        }
        // Reload cart to get latest state
        await loadCart();
      } catch (error) {
        console.error('Error adding to cart:', error);
        // Fallback to local state update
        setItems((prev) => {
          const existing = prev.find((i) => i.id === product.id);
          if (existing) {
            return prev.map((i) =>
              i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
            );
          }
          return [
            ...prev,
            {
              id: product.id,
              productId: product.id,
              name: product.name,
              priceCurrent: product.priceCurrent,
              priceOriginal: product.priceOriginal,
              imageUri: product.imageUri,
              quantity: 1,
              selected: true,
              isAvailable: true,
              maxQuantity: 999,
              reasonUnavailable: null,
            },
          ];
        });
      }
    },
    [isSignedIn, getToken, items, loadCart]
  );

  const removeItem = useCallback(
    async (id: string) => {
      if (!isSignedIn || !getToken) {
        // If not signed in, just update local state
        setItems((prev) => prev.filter((i) => i.id !== id));
        return;
      }

      try {
        // Sync with backend
        await removeCartItem(getToken, id);
        // Reload cart to get latest state
        await loadCart();
      } catch (error) {
        console.error('Error removing from cart:', error);
        // Fallback to local state update
        setItems((prev) => prev.filter((i) => i.id !== id));
      }
    },
    [isSignedIn, getToken, loadCart]
  );

  const updateQuantity = useCallback(
    async (id: string, quantity: number) => {
      if (quantity <= 0) {
        removeItem(id);
        return;
      }

      if (!isSignedIn || !getToken) {
        // If not signed in, just update local state
        setItems((prev) => {
          if (quantity <= 0) return prev.filter((i) => i.id !== id);
          return prev.map((i) =>
            i.id === id ? { ...i, quantity } : i
          );
        });
        return;
      }

      try {
        // Sync with backend
        await updateCartItem(getToken, id, { quantity });
        // Reload cart to get latest state
        await loadCart();
      } catch (error) {
        console.error('Error updating cart quantity:', error);
        // Fallback to local state update
        setItems((prev) => {
          if (quantity <= 0) return prev.filter((i) => i.id !== id);
          return prev.map((i) =>
            i.id === id ? { ...i, quantity } : i
          );
        });
      }
    },
    [isSignedIn, getToken, loadCart, removeItem]
  );

  const toggleSelect = useCallback((id: string) => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, selected: !(i.selected === true) } : i
      )
    );
  }, []);

  const selectAll = useCallback((selected: boolean) => {
    setItems((prev) => prev.map((i) => ({ ...i, selected })));
  }, []);

  const selectOnly = useCallback((productId: string) => {
    setItems((prev) =>
      prev.map((i) => ({
        ...i,
        selected: i.productId === productId,
      }))
    );
  }, []);

  const selectedIds = useMemo(
    () => new Set(items.filter((i) => i.selected === true).map((i) => i.id)),
    [items]
  );

  const subtotal = useMemo(
    () =>
      items
        .filter((i) => i.selected === true)
        .reduce((sum, i) => sum + i.priceCurrent * i.quantity, 0),
    [items]
  );

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      addToCart,
      removeItem,
      updateQuantity,
      toggleSelect,
      selectAll,
      selectOnly,
      reloadCart: loadCart,
      selectedIds,
      subtotal,
    }),
    [items, addToCart, removeItem, updateQuantity, toggleSelect, selectAll, selectOnly, loadCart, selectedIds, subtotal]
  );

  return (
    <CartContext.Provider value={value}>{children}</CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
