
export interface Item {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  imageUrl: string;
}

export interface OrderItem extends Item {
  quantity: number;
}

export interface Receipt {
  id: string;
  date: Date;
  items: OrderItem[];
  total: number;
  paymentMethod: 'Cash' | 'Card';
}

export interface SavedTicket {
  id: string;
  name: string;
  items: OrderItem[];
}
