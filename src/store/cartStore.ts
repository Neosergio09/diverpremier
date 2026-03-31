import { map, computed, atom } from 'nanostores';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  priceFormatted: string;
  image: string;
  quantity: number;
}

// Sync with localStorage
const isBrowser = typeof window !== "undefined";
const savedCart = isBrowser ? localStorage.getItem("bunker_cart") : null;
const initialCart = savedCart ? JSON.parse(savedCart) : {};

export const cartItems = map<Record<string, CartItem>>(initialCart);
export const isCartOpen = atom(false);

if (isBrowser) {
  cartItems.subscribe((items) => {
    localStorage.setItem("bunker_cart", JSON.stringify(items));
  });
}

const parsePrice = (priceStr: string): number => {
  return parseInt(priceStr.replace(/[^0-9]/g, ''), 10);
};

export const addItem = (product: { name: string; price: string; image_url: string }) => {
  const items = cartItems.get();
  const existing = items[product.name];
  
  if (existing) {
    cartItems.setKey(product.name, {
      ...existing,
      quantity: existing.quantity + 1,
    });
  } else {
    cartItems.setKey(product.name, {
      id: product.name,
      name: product.name,
      price: parsePrice(product.price),
      priceFormatted: product.price,
      image: product.image_url,
      quantity: 1,
    });
  }
};

export const removeItem = (id: string) => {
  const items = cartItems.get();
  const existing = items[id];
  
  if (existing) {
    if (existing.quantity > 1) {
      cartItems.setKey(id, {
        ...existing,
        quantity: existing.quantity - 1,
      });
    } else {
      const newItems = { ...items };
      delete newItems[id];
      cartItems.set(newItems);
    }
  }
};

export const clearCart = () => cartItems.set({});

export const cartTotal = computed(cartItems, (items) => {
  return Object.values(items).reduce((acc, item) => acc + item.price * item.quantity, 0);
});

export const cartCount = computed(cartItems, (items) => {
  return Object.values(items).reduce((acc, item) => acc + item.quantity, 0);
});
