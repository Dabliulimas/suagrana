import FinancialSettingsManager from "@/components/financial-settings-manager";

export default function FinancialSettingsPage() {
  return (
    <div className="container mx-auto p-6">
      <FinancialSettingsManager />
    </div>
  );
}

export const metadata = {
  title: "Configurações Financeiras - SuaGrana",
  description: "Configure e personalize seu sistema financeiro",
};
