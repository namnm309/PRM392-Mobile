import type { ProductDetail } from "@/constants/productDetailData";
import {
    addCartItem,
    getCart,
    removeCartItem,
    updateCartItem,
    type CartItemDto,
} from "@/lib/cartApi";
import { fetchProductById } from "@/lib/productsApi";
import { useAuth } from "@clerk/clerk-expo";
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

export type CartItem = {
  id: string;
  productId: string;
  variantId?: string | null;
  variantLabel?: string | null;
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
  addToCart: (
    product: Pick<
      ProductDetail,
      "id" | "name" | "priceCurrent" | "priceOriginal" | "imageUri"
    >,
    opts?: { variantId?: string; variantLabel?: string },
  ) => void;
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
  const variantImageByVariantIdRef = useRef<Map<string, string | null>>(
    new Map(),
  );

  // Map CartItemDto to CartItem
  const mapCartItemDtoToCartItem = useCallback((dto: CartItemDto): CartItem => {
    const parts: string[] = [];
    if (dto.variantRamGb != null) parts.push(`${dto.variantRamGb}GB`);
    if (dto.variantStorageGb != null) parts.push(`${dto.variantStorageGb}GB`);
    if (dto.variantColorName) parts.push(dto.variantColorName);
    const variantLabel =
      parts.length > 0 ? parts.join(" · ") : (dto.variantName ?? null);

    return {
      id: dto.id,
      productId: dto.productId,
      variantId: dto.variantId ?? null,
      variantLabel,
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

  const enrichVariantImages = useCallback(async (cartItems: CartItem[]) => {
    const variantIdsToResolve = cartItems
      .map((i) => i.variantId)
      .filter((id): id is string => typeof id === "string" && id.length > 0)
      .filter((id) => !variantImageByVariantIdRef.current.has(id));

    if (variantIdsToResolve.length === 0) {
      // Still apply cached mappings if any
      return cartItems.map((i) => {
        const vid = i.variantId;
        if (!vid) return i;
        const cached = variantImageByVariantIdRef.current.get(vid);
        return cached ? { ...i, imageUri: cached } : i;
      });
    }

    const productIds = Array.from(
      new Set(
        cartItems
          .filter((i) => i.variantId)
          .map((i) => i.productId)
          .filter(Boolean),
      ),
    );

    await Promise.all(
      productIds.map(async (pid) => {
        try {
          const api = await fetchProductById(pid);
          const variants = api?.variants ?? [];
          for (const v of variants) {
            if (!v?.id) continue;
            if (!variantImageByVariantIdRef.current.has(v.id)) {
              variantImageByVariantIdRef.current.set(v.id, v.imageUrl ?? null);
            }
          }
        } catch {
          // Ignore enrichment failures; keep product image
        }
      }),
    );

    // Ensure requested ids are marked (avoid retry loop if not found)
    for (const vid of variantIdsToResolve) {
      if (!variantImageByVariantIdRef.current.has(vid)) {
        variantImageByVariantIdRef.current.set(vid, null);
      }
    }

    return cartItems.map((i) => {
      const vid = i.variantId;
      if (!vid) return i;
      const resolved = variantImageByVariantIdRef.current.get(vid);
      return resolved ? { ...i, imageUri: resolved } : i;
    });
  }, []);

  // Load cart from backend
  const loadCart = useCallback(async () => {
    if (!isSignedIn || !getToken) return;

    try {
      setLoading(true);
      const cart = await getCart(getToken);
      const mappedItems = cart.items.map(mapCartItemDtoToCartItem);
      const enrichedItems = await enrichVariantImages(mappedItems);

      // Preserve selected state from existing items
      setItems((prevItems) => {
        if (prevItems.length === 0) {
          // First load, all items selected by default
          return enrichedItems;
        }

        // Merge: keep existing selection state
        const prevSelectedMap = new Map(
          prevItems.map((item) => [item.id, item.selected ?? true]),
        );

        return enrichedItems.map((item) => ({
          ...item,
          selected: prevSelectedMap.get(item.id) ?? true,
        }));
      });
    } catch (error) {
      console.error("Error loading cart:", error);
      // Continue with empty cart if error
    } finally {
      setLoading(false);
    }
  }, [isSignedIn, getToken, mapCartItemDtoToCartItem, enrichVariantImages]);

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
    async (
      product: Pick<
        ProductDetail,
        "id" | "name" | "priceCurrent" | "priceOriginal" | "imageUri"
      >,
      opts?: { variantId?: string; variantLabel?: string },
    ) => {
      const variantId = opts?.variantId;
      const variantLabel = opts?.variantLabel ?? null;
      if (!isSignedIn || !getToken) {
        // If not signed in, just update local state
        setItems((prev) => {
          const localId = variantId
            ? `${product.id}::${variantId}`
            : product.id;
          const existing = prev.find((i) => i.id === localId);
          if (existing) {
            return prev.map((i) =>
              i.id === localId ? { ...i, quantity: i.quantity + 1 } : i,
            );
          }
          return [
            ...prev,
            {
              id: localId,
              productId: product.id,
              variantId: variantId ?? null,
              variantLabel,
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
        const existing = items.find(
          (i) =>
            i.productId === product.id &&
            (variantId ? i.variantId === variantId : true),
        );
        if (existing) {
          // Update quantity
          await updateCartItem(getToken, existing.id, {
            quantity: existing.quantity + 1,
          });
        } else {
          // Add new item
          await addCartItem(getToken, {
            productId: product.id,
            ...(variantId ? { variantId } : {}),
            quantity: 1,
          });
        }
        // Reload cart to get latest state
        await loadCart();
      } catch (error) {
        console.error("Error adding to cart:", error);
        // Fallback to local state update
        setItems((prev) => {
          const localId = variantId
            ? `${product.id}::${variantId}`
            : product.id;
          const existing = prev.find((i) => i.id === localId);
          if (existing) {
            return prev.map((i) =>
              i.id === localId ? { ...i, quantity: i.quantity + 1 } : i,
            );
          }
          return [
            ...prev,
            {
              id: localId,
              productId: product.id,
              variantId: variantId ?? null,
              variantLabel,
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
    [isSignedIn, getToken, items, loadCart],
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
        console.error("Error removing from cart:", error);
        // Fallback to local state update
        setItems((prev) => prev.filter((i) => i.id !== id));
      }
    },
    [isSignedIn, getToken, loadCart],
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
          return prev.map((i) => (i.id === id ? { ...i, quantity } : i));
        });
        return;
      }

      try {
        // Sync with backend
        await updateCartItem(getToken, id, { quantity });
        // Reload cart to get latest state
        await loadCart();
      } catch (error) {
        console.error("Error updating cart quantity:", error);
        // Fallback to local state update
        setItems((prev) => {
          if (quantity <= 0) return prev.filter((i) => i.id !== id);
          return prev.map((i) => (i.id === id ? { ...i, quantity } : i));
        });
      }
    },
    [isSignedIn, getToken, loadCart, removeItem],
  );

  const toggleSelect = useCallback((id: string) => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, selected: !(i.selected === true) } : i,
      ),
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
      })),
    );
  }, []);

  const selectedIds = useMemo(
    () => new Set(items.filter((i) => i.selected === true).map((i) => i.id)),
    [items],
  );

  const subtotal = useMemo(
    () =>
      items
        .filter((i) => i.selected === true)
        .reduce((sum, i) => sum + i.priceCurrent * i.quantity, 0),
    [items],
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
    [
      items,
      addToCart,
      removeItem,
      updateQuantity,
      toggleSelect,
      selectAll,
      selectOnly,
      loadCart,
      selectedIds,
      subtotal,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
