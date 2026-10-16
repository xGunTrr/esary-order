import type { Order, OrderStatus } from '@/context/session-context';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, '');

export const isApiConfigured = Boolean(API_BASE_URL);

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!API_BASE_URL) throw new Error('Configura EXPO_PUBLIC_API_URL para conectar easyOrder con la API.');

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });

  if (!response.ok) {
    const message = await response.text().catch(() => '');
    throw new Error(message || `La API respondió con estado ${response.status}.`);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const ordersApi = {
  list: () => request<Order[]>('/orders'),
  create: (order: Order) => request<Order | void>('/orders', {
    method: 'POST',
    body: JSON.stringify(order),
  }),
  updateStatus: (id: number, status: OrderStatus) => request<void>(`/orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  }),
};
