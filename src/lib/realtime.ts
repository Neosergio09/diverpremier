import { supabase } from './supabase';

/**
 * Generador de sonido sintético para notificaciones en vivo usando Web Audio API.
 * No requiere descargar archivos de audio externos y funciona de inmediato en el navegador.
 */
export function playAlertChime(type: 'order' | 'stock' = 'order') {
  if (typeof window === 'undefined') return;
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    if (type === 'order') {
      // Doble tono ascendente armónico (Chime de notificación)
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';

      // Nota 1 (E5 / 659Hz) -> Nota 2 (A5 / 880Hz)
      osc1.frequency.setValueAtTime(659.25, now);
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15);

      osc2.frequency.setValueAtTime(1318.5, now);
      osc2.frequency.exponentialRampToValueAtTime(1760, now + 0.15);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.6);
      osc2.stop(now + 0.6);
    } else {
      // Tono suave para cambios de stock (C6 / 1046Hz)
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1046.5, now);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    }
  } catch (e) {
    // Si el usuario no ha interactuado aún con la página, el navegador silencia el AudioContext de forma segura
  }
}

export interface OrderSubscriptionCallbacks {
  onInsert?: (order: any) => void;
  onUpdate?: (order: any) => void;
  onDelete?: (orderId: string) => void;
  onStatusChange?: (status: string) => void;
}

/**
 * Suscribe la página a cambios en vivo de la tabla `orders`.
 */
export function subscribeToOrders(callbacks: OrderSubscriptionCallbacks) {
  const channel = supabase
    .channel(`realtime-orders-${Date.now()}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'orders' },
      (payload) => {
        console.log('🚨 [Realtime Orders] INSERT:', payload.new);
        playAlertChime('order');
        callbacks.onInsert?.(payload.new);
      }
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'orders' },
      (payload) => {
        console.log('🔄 [Realtime Orders] UPDATE:', payload.new);
        callbacks.onUpdate?.(payload.new);
      }
    )
    .on(
      'postgres_changes',
      { event: 'DELETE', schema: 'public', table: 'orders' },
      (payload) => {
        console.log('🗑️ [Realtime Orders] DELETE:', payload.old);
        callbacks.onDelete?.(payload.old?.id);
      }
    )
    .subscribe((status) => {
      console.log('📡 [Realtime Orders Channel]:', status);
      callbacks.onStatusChange?.(status);
    });

  return {
    unsubscribe: () => {
      supabase.removeChannel(channel);
    },
    channel,
  };
}

export interface ProductSubscriptionCallbacks {
  onUpdate?: (product: any) => void;
  onInsert?: (product: any) => void;
  onDelete?: (productId: string) => void;
  onStatusChange?: (status: string) => void;
}

/**
 * Suscribe la página a cambios en vivo de la tabla `products` (stock, precios, fotos).
 */
export function subscribeToProducts(callbacks: ProductSubscriptionCallbacks) {
  const channel = supabase
    .channel(`realtime-products-${Date.now()}`)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'products' },
      (payload) => {
        console.log('📦 [Realtime Products] UPDATE:', payload.new);
        playAlertChime('stock');
        callbacks.onUpdate?.(payload.new);
      }
    )
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'products' },
      (payload) => {
        console.log('✨ [Realtime Products] INSERT:', payload.new);
        callbacks.onInsert?.(payload.new);
      }
    )
    .on(
      'postgres_changes',
      { event: 'DELETE', schema: 'public', table: 'products' },
      (payload) => {
        console.log('🗑️ [Realtime Products] DELETE:', payload.old);
        callbacks.onDelete?.(payload.old?.id);
      }
    )
    .subscribe((status) => {
      console.log('📡 [Realtime Products Channel]:', status);
      callbacks.onStatusChange?.(status);
    });

  return {
    unsubscribe: () => {
      supabase.removeChannel(channel);
    },
    channel,
  };
}
