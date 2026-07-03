import { storage } from '../utils/storage';

export const CART_STORAGE_KEY = 'store_cart';

export async function loadCartFromStorage() {
  const cart = await storage.get(CART_STORAGE_KEY);
  return Array.isArray(cart) ? cart : [];
}

export async function saveCartToStorage(cart) {
  await storage.set(CART_STORAGE_KEY, cart);
}

export async function clearCartStorage() {
  await storage.remove(CART_STORAGE_KEY);
}

const CART_ACTIONS = new Set([
  'store/addToCart',
  'store/updateCartQty',
  'store/removeFromCart',
  'store/clearCart',
  'store/setCart',
  'store/hydrateCart',
]);

export const cartPersistMiddleware = (storeApi) => (next) => (action) => {
  const result = next(action);
  if (CART_ACTIONS.has(action.type)) {
    const { cart } = storeApi.getState().store;
    saveCartToStorage(cart).catch(() => {});
  }
  return result;
};