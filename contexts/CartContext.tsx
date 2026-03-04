import type { ProductDetail } from '@/constants/productDetailData';
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

export type CartItem = {
  id: string;
  name: string;
  priceCurrent: number;
  priceOriginal: number;
  imageUri?: string | null;
  quantity: number;
  selected?: boolean;
};

type CartContextValue = {
  items: CartItem[];
  addToCart: (product: Pick<ProductDetail, 'id' | 'name' | 'priceCurrent' | 'priceOriginal' | 'imageUri'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  toggleSelect: (id: string) => void;
  selectAll: (selected: boolean) => void;
  selectedIds: Set<string>;
  subtotal: number;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addToCart = useCallback(
    (product: Pick<ProductDetail, 'id' | 'name' | 'priceCurrent' | 'priceOriginal' | 'imageUri'>) => {
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
            name: product.name,
            priceCurrent: product.priceCurrent,
            priceOriginal: product.priceOriginal,
            imageUri: product.imageUri,
            quantity: 1,
            selected: true,
          },
        ];
      });
    },
    []
  );

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    setItems((prev) => {
      if (quantity <= 0) return prev.filter((i) => i.id !== id);
      return prev.map((i) =>
        i.id === id ? { ...i, quantity } : i
      );
    });
  }, []);

  const toggleSelect = useCallback((id: string) => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, selected: !i.selected } : i
      )
    );
  }, []);

  const selectAll = useCallback((selected: boolean) => {
    setItems((prev) => prev.map((i) => ({ ...i, selected })));
  }, []);

  const selectedIds = useMemo(
    () => new Set(items.filter((i) => i.selected).map((i) => i.id)),
    [items]
  );

  const subtotal = useMemo(
    () =>
      items
        .filter((i) => i.selected)
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
      selectedIds,
      subtotal,
    }),
    [items, addToCart, removeItem, updateQuantity, toggleSelect, selectAll, selectedIds, subtotal]
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
