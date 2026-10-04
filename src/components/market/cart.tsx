"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type CartLine = {
  id: string;
  name: string;
  unit: string;
  price: number;
  currency: string;
  minQty: number;
  image: string | null;
  category: string;
  qty: number;
};

type Cart = {
  lines: CartLine[];
  ready: boolean;
  add: (line: CartLine) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
};

const KEY = "tfs-cart-v1";
const CartContext = createContext<Cart | null>(null);

function read(): CartLine[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((l) => l && typeof l.id === "string" && l.qty > 0) : [];
  } catch {
    return [];
  }
}

/**
 * The cart lives in the browser until the order is placed. Prices here are only for display:
 * the database reads the real price of every product when the order is placed.
 */
export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => {
      setLines(read());
      setReady(true);
    };
    const first = setTimeout(sync, 0);
    // Keep tabs in step with each other.
    const onStorage = (e: StorageEvent) => e.key === KEY && sync();
    window.addEventListener("storage", onStorage);
    return () => {
      clearTimeout(first);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const save = useCallback((next: CartLine[]) => {
    setLines(next);
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // Private mode or storage full: the cart still works for this page view.
    }
  }, []);

  const value = useMemo<Cart>(
    () => ({
      lines,
      ready,
      add: (line) => {
        const existing = lines.find((l) => l.id === line.id);
        save(
          existing
            ? lines.map((l) => (l.id === line.id ? { ...line, qty: Math.round((l.qty + line.qty) * 100) / 100 } : l))
            : [...lines, line],
        );
      },
      setQty: (id, qty) => save(lines.map((l) => (l.id === id ? { ...l, qty } : l))),
      remove: (id) => save(lines.filter((l) => l.id !== id)),
      clear: () => save([]),
    }),
    [lines, ready, save],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const cart = useContext(CartContext);
  if (!cart) throw new Error("useCart outside CartProvider");
  return cart;
}
