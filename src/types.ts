export interface Client {
  id: number;
  name: string;
  phone: string;
}

export interface Sale {
  id: number;
  clientId: number | null;
  clientName?: string;
  clientPhone?: string;
  productName: string;
  weight: number;
  pricePerKg: number;
  total: number;
  timestamp: string;
  orderId: string;
}

export const PRODUCTS = [
  "Linguiça do sol",
  "Carne de sol",
  "Bacon",
  "Copa lombo",
  "Salame",
  "Salame defumado",
  "Mortadela Artesanal",
  "Linguiça Calabresa"
];
