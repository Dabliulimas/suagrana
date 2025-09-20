import { apiClient } from "@/lib/api-client";

export const Accounts = {
  async list() {
    const { data } = await apiClient.get("/accounts");
    return data.accounts || [];
  },
};
