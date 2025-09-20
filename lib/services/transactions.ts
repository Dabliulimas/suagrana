import { apiClient } from "../lib/api-client";

export const Transactions = {
  async list(params?: any) {
    const { data } = await apiClient.get("/transactions", { params });
    return data.transactions || [];
  },
  async create(payload: any) {
    const { data } = await apiClient.post("/transactions", payload);
    return data.transaction || data;
  },
};
