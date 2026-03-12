import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { WishlistToast } from '@/components/WishlistToast';
import { useAuth } from '@clerk/clerk-expo';
import {
  addToWishlist,
  getWishlist,
  removeFromWishlist,
  type WishlistItemDto,
} from '@/lib/wishlistApi';

type WishlistContextValue = {
  wishlistProductIds: ReadonlySet<string>;
  loading: boolean;
  error: string | null;
  refreshWishlist: () => Promise<void>;
  isWishlisted: (productId: string) => boolean;
  toggleWishlist: (productId: string) => Promise<void>;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { getToken, isSignedIn } = useAuth();
  const [wishlistProductIds, setWishlistProductIds] = useState<Set<string>>(
    () => new Set()
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Prevent concurrent refreshes
  const refreshInFlightRef = useRef<Promise<void> | null>(null);
  // Prevent double-taps spamming same productId
  const toggleInFlightRef = useRef<Set<string>>(new Set());

  const applyWishlistItems = useCallback((items: WishlistItemDto[]) => {
    setWishlistProductIds(new Set(items.map((i) => i.productId)));
  }, []);

  const refreshWishlist = useCallback(async () => {
    if (!isSignedIn) {
      setWishlistProductIds(new Set());
      setError(null);
      return;
    }
    if (refreshInFlightRef.current) return refreshInFlightRef.current;

    const run = (async () => {
      setLoading(true);
      try {
        setError(null);
        const items = await getWishlist(getToken);
        applyWishlistItems(items);
      } catch (e: any) {
        setError(e?.message ?? 'Không thể tải danh sách yêu thích');
      } finally {
        setLoading(false);
        refreshInFlightRef.current = null;
      }
    })();

    refreshInFlightRef.current = run;
    return run;
  }, [applyWishlistItems, getToken, isSignedIn]);

  useEffect(() => {
    if (!isSignedIn) {
      setWishlistProductIds(new Set());
      setError(null);
      setLoading(false);
      refreshInFlightRef.current = null;
      toggleInFlightRef.current = new Set();
      return;
    }
    // Load once after sign-in
    refreshWishlist();
  }, [isSignedIn, refreshWishlist]);

  const isWishlisted = useCallback(
    (productId: string) => wishlistProductIds.has(productId),
    [wishlistProductIds]
  );

  const toggleWishlist = useCallback(
    async (productId: string) => {
      if (!isSignedIn) return;
      if (toggleInFlightRef.current.has(productId)) return;
      toggleInFlightRef.current.add(productId);

      const wasIn = wishlistProductIds.has(productId);

      // Optimistic update
      setWishlistProductIds((prev) => {
        const next = new Set(prev);
        if (next.has(productId)) next.delete(productId);
        else next.add(productId);
        return next;
      });

      try {
        if (wasIn) {
          await removeFromWishlist(getToken, productId);
        } else {
          await addToWishlist(getToken, productId);
        }

        if (toastTimeoutRef.current) {
          clearTimeout(toastTimeoutRef.current);
          toastTimeoutRef.current = null;
        }
        setToastMessage(wasIn ? 'Đã bỏ khỏi sản phẩm yêu thích' : 'Đã thêm vào sản phẩm yêu thích');
        setToastVisible(true);
        toastTimeoutRef.current = setTimeout(() => {
          setToastVisible(false);
        }, 1800);
      } catch (e) {
        // Revert on failure
        setWishlistProductIds((prev) => {
          const next = new Set(prev);
          if (wasIn) next.add(productId);
          else next.delete(productId);
          return next;
        });
        throw e;
      } finally {
        toggleInFlightRef.current.delete(productId);
      }
    },
    [getToken, isSignedIn, wishlistProductIds]
  );

  const value = useMemo<WishlistContextValue>(
    () => ({
      wishlistProductIds,
      loading,
      error,
      refreshWishlist,
      isWishlisted,
      toggleWishlist,
    }),
    [wishlistProductIds, loading, error, refreshWishlist, isWishlisted, toggleWishlist]
  );

  return (
    <WishlistContext.Provider value={value}>
      {children}
      <WishlistToast
        visible={toastVisible}
        message={toastMessage}
        onDismiss={() => setToastVisible(false)}
      />
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) {
    throw new Error('useWishlist must be used within WishlistProvider');
  }
  return ctx;
}

