"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Badge } from "./ui/badge";
import { Switch } from "./ui/switch";
import {
  Share2,
  Copy,
  Mail,
  MessageSquare,
  Facebook,
  Twitter,
  Instagram,
  Link,
  QrCode,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import type { Trip } from "../lib/storage";

interface TripSharingProps {
  trip: Trip;
  onUpdate: (updatedTrip: Trip) => void;
}

export function TripSharing({ trip, onUpdate }: TripSharingProps) {
  const [shareSettings, setShareSettings] = useState({
    includeExpenses: true,
    includePhotos: true,
    includeItinerary: true,
    includeDocuments: false,
    includeChecklist: false,
    publicLink: false,
    allowComments: false,
  });
  const [customMessage, setCustomMessage] = useState("");
  const [showQRCode, setShowQRCode] = useState(false);

  const generateShareableLink = () => {
    const baseUrl = window.location.origin;
    const shareId = `${trip.id}-${Date.now()}`;
    return `${baseUrl}/shared/trip/${shareId}`;
  };

  const generateTripSummary = () => {
    const expenses = JSON.parse(
      localStorage.getItem(`trip-expenses-${trip.id}`) || "[]",
    );
    if (typeof window === "undefined") return;
    const totalExpenses = expenses.reduce(
      (sum: number, expense: any) => sum + expense.amount,
      0,
    );
    const photos = JSON.parse(
      localStorage.getItem(`trip-photos-${trip.id}`) || "[]",
    );
    if (typeof window === "undefined") return;

    return {
      destination: trip.destination,
      startDate: trip.startDate,
      endDate: trip.endDate,
      duration: Math.ceil(
        (new Date(trip.endDate).getTime() -
          new Date(trip.startDate).getTime()) /
          (1000 * 60 * 60 * 24),
      ),
      totalExpenses: shareSettings.includeExpenses ? totalExpenses : null,
      photosCount: shareSettings.includePhotos ? photos.length : null,
      participants: trip.participants?.length || 0,
    };
  };

  const copyToClipboard = async (text: string) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        toast.success("Copiado para a área de transferência!");
      } else {
        // Fallback para navegadores que não suportam clipboard API
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
          document.execCommand("copy");
          toast.success("Copiado para a área de transferência!");
        } catch (err) {
          toast.error("Não foi possível copiar. Copie manualmente o texto.");
        } finally {
          document.body.removeChild(textArea);
        }
      }
    } catch (err) {
      toast.error("Erro ao copiar para a área de transferência");
    }
  };

  const shareViaEmail = () => {
    const summary = generateTripSummary();
    const subject = `Confira minha viagem para ${summary.destination}!`;
    const body = `
Olá!

Gostaria de compartilhar os detalhes da minha viagem para ${summary.destination}:

📍 Destino: ${summary.destination}
📅 Data: ${new Date(summary.startDate).toLocaleDateString("pt-BR")} - ${new Date(summary.endDate).toLocaleDateString("pt-BR")}
⏱️ Duração: ${summary.duration} dias
👥 Participantes: ${summary.participants}
${summary.totalExpenses ? `💰 Gastos totais: R$ ${summary.totalExpenses.toFixed(2)}` : ""}
${summary.photosCount ? `📸 Fotos: ${summary.photosCount}` : ""}

${customMessage ? `\n${customMessage}\n` : ""}
Confira mais detalhes: ${generateShareableLink()}

Abraços!
    `;

    window.open(
      `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
    );
  };

  const shareViaWhatsApp = () => {
    const summary = generateTripSummary();
    const message = `🌎 *Minha viagem para ${summary.destination}*\n\n📅 ${new Date(summary.startDate).toLocaleDateString("pt-BR")} - ${new Date(summary.endDate).toLocaleDateString("pt-BR")}\n⏱️ ${summary.duration} dias\n👥 ${summary.participants} participantes\n${summary.totalExpenses ? `💰 R$ ${summary.totalExpenses.toFixed(2)}` : ""}\n${summary.photosCount ? `📸 ${summary.photosCount} fotos` : ""}\n\n${customMessage ? `${customMessage}\n\n` : ""}Veja mais detalhes: ${generateShareableLink()}`;

    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`);
  };

  const shareViaFacebook = () => {
    const url = generateShareableLink();
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    );
  };

  const shareViaTwitter = () => {
    const summary = generateTripSummary();
    const text = `Acabei de planejar minha viagem para ${summary.destination}! ${summary.duration} dias de aventura 🌎✈️`;
    const url = generateShareableLink();
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
    );
  };

  const generateQRCode = () => {
    const url = generateShareableLink();
    // Usando um serviço gratuito de QR Code
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
  };

  const exportTripData = () => {
    const summary = generateTripSummary();
    const expenses = shareSettings.includeExpenses
      ? JSON.parse(localStorage.getItem(`trip-expenses-${trip.id}`) || "[]")
      : [];
    if (typeof window === "undefined") return;
    const photos = shareSettings.includePhotos
      ? JSON.parse(localStorage.getItem(`trip-photos-${trip.id}`) || "[]")
      : [];
    if (typeof window === "undefined") return;
    const itinerary = shareSettings.includeItinerary
      ? JSON.parse(localStorage.getItem(`trip-itinerary-${trip.id}`) || "[]")
      : [];
    if (typeof window === "undefined") return;

    const exportData = {
      trip: {
        ...trip,
        summary,
      },
      expenses: expenses,
      photos: photos.map((photo: any) => ({
        ...photo,
        url: "[Base64 Image Data]",
      })), // Remove base64 data for export
      itinerary: itinerary,
      exportDate: new Date().toISOString(),
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `viagem-${trip.destination.replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("Dados da viagem exportados com sucesso!");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Compartilhar Viagem</h2>
        <p className="text-muted-foreground">
          Compartilhe os detalhes da sua viagem com amigos e família
        </p>
      </div>

      {/* Share Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Configurações de Compartilhamento</CardTitle>
          <CardDescription>
            Escolha quais informações incluir no compartilhamento
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="include-expenses">Incluir gastos</Label>
              <Switch
                id="include-expenses"
                checked={shareSettings.includeExpenses}
                onCheckedChange={(checked) =>
                  setShareSettings((prev) => ({
                    ...prev,
                    includeExpenses: checked,
                  }))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="include-photos">Incluir fotos</Label>
              <Switch
                id="include-photos"
                checked={shareSettings.includePhotos}
                onCheckedChange={(checked) =>
                  setShareSettings((prev) => ({
                    ...prev,
                    includePhotos: checked,
                  }))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="include-itinerary">Incluir roteiro</Label>
              <Switch
                id="include-itinerary"
                checked={shareSettings.includeItinerary}
                onCheckedChange={(checked) =>
                  setShareSettings((prev) => ({
                    ...prev,
                    includeItinerary: checked,
                  }))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="include-documents">Incluir documentos</Label>
              <Switch
                id="include-documents"
                checked={shareSettings.includeDocuments}
                onCheckedChange={(checked) =>
                  setShareSettings((prev) => ({
                    ...prev,
                    includeDocuments: checked,
                  }))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="include-checklist">Incluir checklist</Label>
              <Switch
                id="include-checklist"
                checked={shareSettings.includeChecklist}
                onCheckedChange={(checked) =>
                  setShareSettings((prev) => ({
                    ...prev,
                    includeChecklist: checked,
                  }))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="public-link">Link público</Label>
              <Switch
                id="public-link"
                checked={shareSettings.publicLink}
                onCheckedChange={(checked) =>
                  setShareSettings((prev) => ({ ...prev, publicLink: checked }))
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Custom Message */}
      <Card>
        <CardHeader>
          <CardTitle>Mensagem Personalizada</CardTitle>
          <CardDescription>
            Adicione uma mensagem pessoal ao compartilhamento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Escreva uma mensagem para acompanhar o compartilhamento da sua viagem..."
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Share Options */}
      <Card>
        <CardHeader>
          <CardTitle>Opções de Compartilhamento</CardTitle>
          <CardDescription>
            Escolha como deseja compartilhar sua viagem
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              variant="outline"
              onClick={shareViaEmail}
              className="flex flex-col items-center gap-2 h-auto py-4"
            >
              <Mail className="h-6 w-6" />
              <span className="text-sm">Email</span>
            </Button>
            <Button
              variant="outline"
              onClick={shareViaWhatsApp}
              className="flex flex-col items-center gap-2 h-auto py-4"
            >
              <MessageSquare className="h-6 w-6" />
              <span className="text-sm">WhatsApp</span>
            </Button>
            <Button
              variant="outline"
              onClick={shareViaFacebook}
              className="flex flex-col items-center gap-2 h-auto py-4"
            >
              <Facebook className="h-6 w-6" />
              <span className="text-sm">Facebook</span>
            </Button>
            <Button
              variant="outline"
              onClick={shareViaTwitter}
              className="flex flex-col items-center gap-2 h-auto py-4"
            >
              <Twitter className="h-6 w-6" />
              <span className="text-sm">Twitter</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Direct Link */}
      <Card>
        <CardHeader>
          <CardTitle>Link Direto</CardTitle>
          <CardDescription>
            Copie o link para compartilhar diretamente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={generateShareableLink()}
              readOnly
              className="flex-1"
            />
            <Button
              variant="outline"
              onClick={() => copyToClipboard(generateShareableLink())}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex gap-2">
            <Dialog open={showQRCode} onOpenChange={setShowQRCode}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex-1">
                  <QrCode className="h-4 w-4 mr-2" />
                  Gerar QR Code
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>QR Code da Viagem</DialogTitle>
                  <DialogDescription>
                    Escaneie este código para acessar os detalhes da viagem
                  </DialogDescription>
                </DialogHeader>
                <div className="flex justify-center py-4">
                  <img
                    src={generateQRCode()}
                    alt="QR Code da viagem"
                    className="border rounded-lg"
                  />
                </div>
                <Button
                  onClick={() => {
                    const link = document.createElement("a");
                    link.href = generateQRCode();
                    link.download = `qr-code-viagem-${trip.destination.replace(/\s+/g, "-").toLowerCase()}.png`;
                    link.click();
                  }}
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Baixar QR Code
                </Button>
              </DialogContent>
            </Dialog>

            <Button
              variant="outline"
              onClick={exportTripData}
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar Dados
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Trip Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Prévia do Compartilhamento</CardTitle>
          <CardDescription>
            Veja como sua viagem será exibida para outros
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg p-4 bg-muted/50">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">{trip.destination}</h3>
                <p className="text-sm text-muted-foreground">
                  {new Date(trip.startDate).toLocaleDateString("pt-BR")} -{" "}
                  {new Date(trip.endDate).toLocaleDateString("pt-BR")}
                </p>
              </div>
              <Badge variant="secondary">
                {generateTripSummary().duration} dias
              </Badge>
            </div>

            {trip.description && (
              <p className="text-sm mb-4">{trip.description}</p>
            )}

            <div className="flex flex-wrap gap-2 mb-4">
              {shareSettings.includeExpenses && (
                <Badge variant="outline">💰 Gastos incluídos</Badge>
              )}
              {shareSettings.includePhotos && (
                <Badge variant="outline">📸 Fotos incluídas</Badge>
              )}
              {shareSettings.includeItinerary && (
                <Badge variant="outline">🗺️ Roteiro incluído</Badge>
              )}
              {shareSettings.includeDocuments && (
                <Badge variant="outline">📄 Documentos incluídos</Badge>
              )}
              {shareSettings.includeChecklist && (
                <Badge variant="outline">✅ Checklist incluído</Badge>
              )}
            </div>

            {customMessage && (
              <div className="border-l-4 border-primary pl-4 italic text-sm">
                "{customMessage}"
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
