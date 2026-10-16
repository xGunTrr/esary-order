import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { isApiConfigured, ordersApi } from '@/services/api';

export type AppRole = 'admin' | 'kitchen' | 'waiter';
export type OrderStatus = 'Pendiente' | 'En preparación' | 'Listo' | 'Entregado';
export const TABLES = Array.from({ length: 10 }, (_, index) => `Mesa ${index + 1}`);
export type OrderItem = { name: string; details: string[]; quantity: number };
export type Order = {
  id: number;
  table: string;
  waiter: string;
  items: OrderItem[];
  createdAt: string;
  status: OrderStatus;
};

type SessionValue = {
  isHydrated: boolean;
  waiter: string | null;
  orders: Order[];
  drafts: Record<string, OrderItem[]>;
  signIn: (name: string) => void;
  signOut: () => void;
  addOrder: (table: string, items: OrderItem[]) => void;
  setDraftItems: (table: string, items: OrderItem[]) => void;
  setOrderStatus: (id: number, status: OrderStatus) => void;
};

const SessionContext = createContext<SessionValue | null>(null);
const STORAGE_KEY = '@easyorder/session-v1';

const initialOrders: Order[] = [
  { id: 104, table: 'Mesa 4', waiter: 'Camila', items: [{ name: 'Hamburguesa de carne', quantity: 1, details: ['Sin ensalada', 'Papas fritas', 'Mayonesa, mostaza, ketchup'] }, { name: 'Inka Cola 1 L', quantity: 1, details: [] }], createdAt: '12:42', status: 'En preparación' },
  { id: 103, table: 'Mesa 2', waiter: 'Diego', items: [{ name: 'Pollo broaster · Pecho', quantity: 1, details: ['Sin papas ni ensalada', 'Sin cremas'] }], createdAt: '12:38', status: 'Listo' },
];

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [waiter, setWaiter] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, OrderItem[]>>({});
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [isHydrated, setIsHydrated] = useState(false);
  const persistQueue = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    let isMounted = true;

    const restore = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as Partial<{ waiter: string | null; orders: Order[]; drafts: Record<string, OrderItem[]> }>;
          if (!isMounted) return;
          if (typeof parsed.waiter === 'string' || parsed.waiter === null) setWaiter(parsed.waiter);
          if (Array.isArray(parsed.orders)) setOrders(parsed.orders);
          if (parsed.drafts && typeof parsed.drafts === 'object') setDrafts(parsed.drafts);
        }
      } catch (error) {
        console.warn('No se pudo restaurar la sesión local de easyOrder.', error);
      } finally {
        if (isMounted) setIsHydrated(true);
      }

      if (isMounted && isApiConfigured) {
        try {
          const remoteOrders = await ordersApi.list();
          if (isMounted && Array.isArray(remoteOrders)) setOrders(remoteOrders);
        } catch (error) {
          console.warn('No se pudo actualizar la lista desde la API; se conservan los datos locales.', error);
        }
      }
    };

    void restore();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    const snapshot = JSON.stringify({ waiter, orders, drafts });
    persistQueue.current = persistQueue.current
      .then(() => AsyncStorage.setItem(STORAGE_KEY, snapshot))
      .catch((error) => console.warn('No se pudo guardar la sesión local de easyOrder.', error));
  }, [waiter, orders, drafts, isHydrated]);

  const value = useMemo<SessionValue>(() => ({
    isHydrated,
    waiter,
    orders,
    drafts,
    signIn: (name) => setWaiter(name.trim() || 'Mesero'),
    signOut: () => setWaiter(null),
    addOrder: (table, items) => {
      const order: Order = { id: Date.now(), table, waiter: waiter ?? 'Mesero', items, createdAt: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }), status: 'Pendiente' };
      setOrders((current) => [order, ...current]);
      if (isApiConfigured) {
        void ordersApi.create(order).then((savedOrder) => {
          if (savedOrder) setOrders((current) => current.map((item) => item.id === order.id ? savedOrder : item));
        }).catch((error) => console.warn('No se pudo enviar el pedido a la API; queda guardado localmente.', error));
      }
    },
    setDraftItems: (table, items) => setDrafts((current) => ({ ...current, [table]: items })),
    setOrderStatus: (id, status) => {
      setOrders((current) => current.map((order) => order.id === id ? { ...order, status } : order));
      if (isApiConfigured) void ordersApi.updateStatus(id, status).catch((error) => console.warn('No se pudo actualizar el estado en la API; el cambio queda local.', error));
    },
  }), [waiter, orders, drafts, isHydrated]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const value = useContext(SessionContext);
  if (!value) throw new Error('useSession debe usarse dentro de SessionProvider');
  return value;
}
