import { Metadata } from "next";
import FinancialEducationHub from "@/components/financial-education-hub";

export const metadata: Metadata = {
  title: "Educação Financeira | SuaGrana",
  description:
    "Centro completo de educação financeira com cursos interativos, dicas personalizadas, conquistas e gamificação para desenvolver suas habilidades financeiras.",
};

export default function EducationPage() {
  return (
    <div className="container mx-auto p-6">
      <FinancialEducationHub />
    </div>
  );
}
