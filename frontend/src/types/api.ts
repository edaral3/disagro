// Calcados de los DTOs del backend; sin workspace compartido, sincronizar a mano.

export type ItemType = 'SERVICE' | 'PRODUCT';

export interface Item {
  id: string;
  name: string;
  description: string | null;
  price: number;
  type: ItemType;
  category: string | null;
}

export interface StartSessionResponse {
  token: string;
  expiresIn: number;
}

export interface CreateRegistrationRequest {
  firstName: string;
  lastName: string;
  email: string;
  eventDateTime: string; // ISO 8601
  selectedItemIds: string[]; // UUIDs, sin duplicados, mínimo 1
}

export interface RegistrationItemResponse {
  id: string;
  itemId: string;
  itemType: ItemType;
  priceSnapshot: number;
}

export interface RegistrationResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  eventDateTime: string;
  servicesDiscountPct: number;
  productsDiscountPct: number;
  items: RegistrationItemResponse[];
  createdAt: string;
}

// Forma de error uniforme que produce HttpExceptionFilter en el backend.
export interface ApiErrorResponse {
  statusCode: number;
  message: string | string[];
  error?: string;
  timestamp: string;
  path: string;
}
