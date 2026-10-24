"use client";

import { useSyncExternalStore } from "react";

// El carrito vive en el navegador (localStorage): { idDelProducto: cantidad }.
// Aquí solo se guardan ids y cantidades. Los precios SIEMPRE se leen del servidor,
// así que cambiar algo a mano en el navegador no altera lo que se cobra.

export type Cart = Record<string, number>;

export const MAX_PER_PRODUCT = 10;
const KEY = "esman-cart";
const CHANGE = "esman-cart-change";
const EMPTY: Cart = {};

// Lo guardado puede venir alterado: se queda solo con ids numéricos y cantidades válidas.
function parse(raw: string | null): Cart {
  try {
    const cart: Cart = {};
    for (const [id, quantity] of Object.entries(JSON.parse(raw ?? "{}"))) {
      if (/^\d+$/.test(id) && Number.isInteger(quantity) && (quantity as number) > 0) {
        cart[id] = Math.min(quantity as number, MAX_PER_PRODUCT);
      }
    }
    return cart;
  } catch {
    return {};
  }
}

// useSyncExternalStore necesita recibir el mismo objeto mientras nada cambie.
let lastRaw: string | null = null;
let lastCart: Cart = EMPTY;
function read(): Cart {
  const raw = localStorage.getItem(KEY);
  if (raw !== lastRaw) {
    lastRaw = raw;
    lastCart = parse(raw);
  }
  return lastCart;
}

function write(cart: Cart) {
  localStorage.setItem(KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event(CHANGE));
}

// Avisa cuando el carrito cambia en esta pestaña (CHANGE) o en otra (storage).
function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function useCart() {
  // En el servidor (y mientras la página se activa) el carrito se ve vacío.
  const cart = useSyncExternalStore(subscribe, read, () => EMPTY);

  return {
    cart,
    count: Object.values(cart).reduce((total, quantity) => total + quantity, 0),
    add(id: number, quantity = 1) {
      const current = read();
      write({ ...current, [id]: Math.min((current[id] ?? 0) + quantity, MAX_PER_PRODUCT) });
    },
    // Con cantidad 0 el producto sale del carrito.
    setQuantity(id: number, quantity: number) {
      const next = { ...read() };
      if (quantity <= 0) delete next[id];
      else next[id] = Math.min(quantity, MAX_PER_PRODUCT);
      write(next);
    },
    clear: () => write({}),
  };
}
