import { Metadata } from "next";
import AISettings from "@/components/ai-settings";

export const metadata: Metadata = {
  title: "Configurações IA | SuaGrana",
  description:
    "Personalize o comportamento do assistente financeiro inteligente",
};

export default function AISettingsPage() {
  return (
    <div className="container mx-auto px-4 py-6">
      <AISettings />
    </div>
  );
}
