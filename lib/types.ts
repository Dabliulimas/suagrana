export interface Account {
  id: string;
  name: string;
  balance: number;
  status?: "active" | "inactive";
  bankName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Transaction {
  id: string;
  amount: number;
  description: string;
  category: string;
  account: string;
  date: string;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Goal {
  id: string;
  name: string;
  target: number;
  current: number;
  category?: string;
  priority?: "high" | "medium" | "low";
  deadline?: string;
  description?: string;
  status?: "active" | "completed" | "paused";
  createdAt?: string;
  updatedAt?: string;
}

export interface Investment {
  id: string;
  name: string;
  quantity: number;
  purchasePrice: number;
  currentPrice?: number;
  purchaseDate: string;
  status?: "active" | "sold";
  createdAt?: string;
  updatedAt?: string;
}

export interface Trip {
  id: string;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  budget: number;
  expenses: any[];
  status?: "planned" | "active" | "completed";
}

export interface Contact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  category?: string;
  createdAt?: string;
}
