import { apiClient } from "../lib/api-client";

export const Reports = {
  async cashFlow(params: { start: string; end: string }) {
    const { data } = await apiClient.get("/reports/cash-flow", { params });
    return data;
  },
  async categorySpending(params: { start: string; end: string }) {
    const { data } = await apiClient.get("/reports/category-spending", {
      params,
    });
    return data;
  },
  async budgets(params: { start: string; end: string }) {
    const { data } = await apiClient.get("/reports/budgets", { params });
    return data;
  },
};
