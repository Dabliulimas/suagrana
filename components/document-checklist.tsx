"use client";

import { useState, useEffect } from "react";
import { logComponents } from "../lib/logger";
import { generateStableId } from "../lib/utils/stable-id";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { DatePicker } from "./ui/date-picker";
import {
  FileText,
  Upload,
  Check,
  Plus,
  Edit,
  Trash2,
  StampIcon as Passport,
  Plane,
  Shield,
  MapPin,
  Calendar,
} from "lucide-react";
import type { Trip } from "../lib/storage";
import { toast } from "sonner";

interface Document {
  id: string;
  name: string;
  category: "passport" | "visa" | "ticket" | "insurance" | "hotel" | "other";
  required: boolean;
  completed: boolean;
  fileName?: string;
  fileData?: string; // base64 encoded file data
  fileType?: string; // MIME type
  fileSize?: number; // file size in bytes
  notes?: string;
  expiryDate?: string;
  createdAt: string;
}

interface DocumentChecklistProps {
  trip: Trip;
  onUpdate: () => void;
}

export function DocumentChecklist({ trip, onUpdate }: DocumentChecklistProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState<Document | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "other" as Document["category"],
    required: true,
    notes: "",
    expiryDate: "",
  });

  useEffect(() => {
    loadDocuments();
    initializeDefaultDocuments();
  }, [trip.id]);

  const loadDocuments = () => {
    // DEPRECADO: localStorage será removido em favor do dataService
    console.warn('DEPRECATED: document-checklist localStorage - Use dataService instead');
    const data = localStorage.getItem(`trip-documents-${trip.id}`);
    if (typeof window === "undefined") return;
    if (typeof window === "undefined") return;
    if (data) {
      setDocuments(JSON.parse(data));
    }
  };

  const saveDocuments = (docs: Document[]) => {
    // DEPRECADO: localStorage será removido em favor do dataService
    localStorage.setItem(`trip-documents-${trip.id}`, JSON.stringify(docs));
    setDocuments(docs);
  };

  const initializeDefaultDocuments = () => {
    const existing = localStorage.getItem(`trip-documents-${trip.id}`);
    if (typeof window === "undefined") return;
    if (typeof window === "undefined") return;
    if (!existing) {
      const defaultDocs: Document[] = [
        {
          id: "1",
          name: "Passaporte",
          category: "passport",
          required: true,
          completed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: "2",
          name: "Visto (se necessário)",
          category: "visa",
          required: false,
          completed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: "3",
          name: "Passagem Aérea",
          category: "ticket",
          required: true,
          completed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: "4",
          name: "Seguro Viagem",
          category: "insurance",
          required: true,
          completed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: "5",
          name: "Reserva de Hotel",
          category: "hotel",
          required: true,
          completed: false,
          createdAt: new Date().toISOString(),
        },
      ];
      saveDocuments(defaultDocs);
    }
  };

  const getCategoryIcon = (category: Document["category"]) => {
    switch (category) {
      case "passport":
        return <Passport className="w-4 h-4" />;
      case "visa":
        return <Shield className="w-4 h-4" />;
      case "ticket":
        return <Plane className="w-4 h-4" />;
      case "insurance":
        return <Shield className="w-4 h-4" />;
      case "hotel":
        return <MapPin className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: Document["category"]) => {
    switch (category) {
      case "passport":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "visa":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "ticket":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "insurance":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "hotel":
        return "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
  };

  const getCategoryName = (category: Document["category"]) => {
    switch (category) {
      case "passport":
        return "Passaporte";
      case "visa":
        return "Visto";
      case "ticket":
        return "Passagem";
      case "insurance":
        return "Seguro";
      case "hotel":
        return "Hotel";
      default:
        return "Outro";
    }
  };

  const getCompletionRate = () => {
    const requiredDocs = documents.filter((d) => d.required);
    const completedRequired = requiredDocs.filter((d) => d.completed);
    return requiredDocs.length > 0
      ? (completedRequired.length / requiredDocs.length) * 100
      : 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const docData: Document = {
      id: editingDoc?.id || generateStableId("doc"),
      name: formData.name,
      category: formData.category,
      required: formData.required,
      completed: editingDoc?.completed || false,
      notes: formData.notes,
      expiryDate: formData.expiryDate,
      fileName: editingDoc?.fileName,
      createdAt: editingDoc?.createdAt || new Date().toISOString(),
    };

    let updatedDocs: Document[];
    if (editingDoc) {
      updatedDocs = documents.map((d) =>
        d.id === editingDoc.id ? docData : d,
      );
    } else {
      updatedDocs = [...documents, docData];
    }

    saveDocuments(updatedDocs);
    setShowAddModal(false);
    setEditingDoc(null);
    setFormData({
      name: "",
      category: "other",
      required: true,
      notes: "",
      expiryDate: "",
    });
    toast.success(
      editingDoc ? "Documento atualizado!" : "Documento adicionado!",
    );
  };

  const toggleComplete = (id: string) => {
    const updatedDocs = documents.map((d) =>
      d.id === id ? { ...d, completed: !d.completed } : d,
    );
    saveDocuments(updatedDocs);
    toast.success("Status atualizado!");
  };

  const handleEdit = (doc: Document) => {
    setEditingDoc(doc);
    setFormData({
      name: doc.name,
      category: doc.category,
      required: doc.required,
      notes: doc.notes || "",
      expiryDate: doc.expiryDate || "",
    });
    setShowAddModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este documento?")) {
      const updatedDocs = documents.filter((d) => d.id !== id);
      saveDocuments(updatedDocs);
      toast.success("Documento excluído!");
    }
  };

  const handleFileUpload = async (docId: string, file: File) => {
    try {
      console.log(
        "Iniciando upload do arquivo:",
        file.name,
        "para documento:",
        docId,
      );

      // Convert file to base64 for storage
      const reader = new FileReader();

      reader.onload = () => {
        try {
          const base64 = reader.result as string;
          console.log(
            "Arquivo convertido para base64, tamanho:",
            base64.length,
          );

          const updatedDocs = documents.map((d) =>
            d.id === docId
              ? {
                  ...d,
                  fileName: file.name,
                  fileData: base64,
                  fileType: file.type,
                  fileSize: file.size,
                  completed: true, // Mark as completed when file is attached
                }
              : d,
          );

          saveDocuments(updatedDocs);
          console.log("Documento atualizado com sucesso");
          toast.success(`Arquivo "${file.name}" anexado com sucesso!`);
          onUpdate(); // Notify parent component
        } catch (error) {
          logComponents.error("Erro ao processar resultado do FileReader:", error);
          toast.error("Erro ao processar arquivo");
        }
      };

      reader.onerror = (error) => {
        logComponents.error("Erro no FileReader:", error);
        toast.error("Erro ao ler arquivo");
      };

      reader.onabort = () => {
        console.log("Leitura do arquivo foi cancelada");
        toast.error("Upload cancelado");
      };

      console.log("Iniciando leitura do arquivo...");
      reader.readAsDataURL(file);
    } catch (error) {
      logComponents.error("Erro geral no upload:", error);
      toast.error("Erro ao anexar arquivo");
    }
  };

  const completionRate = getCompletionRate();
  const requiredDocs = documents.filter((d) => d.required);
  const completedRequired = requiredDocs.filter((d) => d.completed).length;

  return (
    <div className="space-y-6">
      {/* Header with Progress */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Checklist de Documentos
            </CardTitle>
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Documento
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-medium">
                Progresso dos Documentos Obrigatórios
              </span>
              <span className="text-sm text-gray-600">
                {completedRequired}/{requiredDocs.length} concluídos
              </span>
            </div>
            <Progress value={completionRate} className="h-3" />
            <div className="flex justify-between text-sm text-gray-600">
              <span>{completionRate.toFixed(0)}% completo</span>
              <span>{requiredDocs.length - completedRequired} pendentes</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      <div className="grid gap-4">
        {documents.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum documento cadastrado</p>
            </CardContent>
          </Card>
        ) : (
          documents.map((doc) => (
            <Card
              key={doc.id}
              className={`${doc.completed ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-700" : "dark:bg-gray-800 dark:border-gray-700"}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <Checkbox
                      checked={doc.completed}
                      onCheckedChange={() => toggleComplete(doc.id)}
                      className="mt-1"
                    />

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3
                          className={`font-medium ${doc.completed ? "line-through text-gray-500" : ""}`}
                        >
                          {doc.name}
                        </h3>
                        <Badge className={getCategoryColor(doc.category)}>
                          {getCategoryIcon(doc.category)}
                          <span className="ml-1">
                            {getCategoryName(doc.category)}
                          </span>
                        </Badge>
                        {doc.required && (
                          <Badge
                            variant="outline"
                            className="text-red-600 border-red-200"
                          >
                            Obrigatório
                          </Badge>
                        )}
                      </div>

                      {doc.notes && (
                        <p className="text-sm text-gray-600 mb-2">
                          {doc.notes}
                        </p>
                      )}

                      {doc.expiryDate && (
                        <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                          <Calendar className="w-3 h-3" />
                          Válido até:{" "}
                          {new Date(doc.expiryDate).toLocaleDateString("pt-BR")}
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        {doc.fileName ? (
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 text-sm text-green-600">
                              <Check className="w-3 h-3" />
                              {doc.fileName}
                            </div>
                            {doc.fileSize && (
                              <span className="text-xs text-gray-500">
                                ({(doc.fileSize / 1024).toFixed(1)} KB)
                              </span>
                            )}
                            {doc.fileData && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs p-1 h-6"
                                onClick={() => {
                                  // Create download link
                                  const link = document.createElement("a");
                                  link.href = doc.fileData!;
                                  link.download = doc.fileName!;
                                  link.click();
                                }}
                              >
                                Baixar
                              </Button>
                            )}
                          </div>
                        ) : (
                          <div>
                            <input
                              type="file"
                              id={`file-upload-${doc.id}`}
                              className="hidden"
                              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  // Check file size (max 5MB)
                                  if (file.size > 5 * 1024 * 1024) {
                                    toast.error(
                                      "Arquivo muito grande. Máximo 5MB.",
                                    );
                                    e.target.value = ""; // Reset input
                                    return;
                                  }
                                  handleFileUpload(doc.id, file);
                                  e.target.value = ""; // Reset input after upload
                                }
                              }}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs"
                              onClick={() => {
                                const input = document.getElementById(
                                  `file-upload-${doc.id}`,
                                ) as HTMLInputElement;
                                if (input) {
                                  input.click();
                                }
                              }}
                            >
                              <Upload className="w-3 h-3 mr-1" />
                              Anexar Arquivo
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(doc)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(doc.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add/Edit Document Modal */}
      {showAddModal && (
        <Dialog
          open={true}
          onOpenChange={() => {
            setShowAddModal(false);
            setEditingDoc(null);
            setFormData({
              name: "",
              category: "other",
              required: true,
              notes: "",
              expiryDate: "",
            });
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingDoc ? "Editar Documento" : "Adicionar Documento"}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nome do Documento *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Ex: Passaporte, Visto..."
                  required
                />
              </div>

              <div>
                <Label htmlFor="category">Categoria</Label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      category: e.target.value as Document["category"],
                    })
                  }
                  className="w-full p-2 border rounded-md"
                >
                  <option value="passport">Passaporte</option>
                  <option value="visa">Visto</option>
                  <option value="ticket">Passagem</option>
                  <option value="insurance">Seguro</option>
                  <option value="hotel">Hotel</option>
                  <option value="other">Outro</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="required"
                  checked={formData.required}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, required: !!checked })
                  }
                />
                <Label htmlFor="required">Documento obrigatório</Label>
              </div>

              <div>
                <Label htmlFor="expiryDate">Data de Validade</Label>
                <DatePicker
                  id="expiryDate"
                  value={formData.expiryDate || ""}
                  onChange={(value) =>
                    setFormData({ ...formData, expiryDate: value })
                  }
                  placeholder="Selecionar data de validade"
                  minDate={new Date()}
                />
              </div>

              <div>
                <Label htmlFor="notes">Observações</Label>
                <Input
                  id="notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Observações adicionais..."
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingDoc(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingDoc ? "Atualizar" : "Adicionar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
