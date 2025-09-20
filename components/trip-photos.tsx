"use client";

import { useState, useEffect } from "react";
import { logComponents } from "../lib/logger";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Badge } from "./ui/badge";
import {
  Camera,
  Upload,
  Trash2,
  Eye,
  Download,
  MapPin,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import type { Trip } from "../lib/storage";

interface TripPhoto {
  id: string;
  url: string;
  name: string;
  description?: string;
  location?: string;
  date: string;
  size: number;
  type: string;
}

interface TripPhotosProps {
  trip: Trip;
  onUpdate: (updatedTrip: Trip) => void;
}

export function TripPhotos({ trip, onUpdate }: TripPhotosProps) {
  const [photos, setPhotos] = useState<TripPhoto[]>([]);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<TripPhoto | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [uploadData, setUploadData] = useState({
    description: "",
    location: "",
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Load photos from localStorage
  useEffect(() => {
    if (isMounted) {
      const savedPhotos = localStorage.getItem(`trip-photos-${trip.id}`);
      if (typeof window === "undefined") return;
      if (typeof window === "undefined") return;
      if (savedPhotos) {
        try {
          setPhotos(JSON.parse(savedPhotos));
        } catch (error) {
          logComponents.error("Error loading trip photos:", error);
        }
      }
    }
  }, [trip.id, isMounted]);

  // Save photos to localStorage
  const savePhotos = (updatedPhotos: TripPhoto[]) => {
    localStorage.setItem(
      `trip-photos-${trip.id}`,
      JSON.stringify(updatedPhotos),
    );
    setPhotos(updatedPhotos);

    // Update trip overview with photo count
    localStorage.setItem(
      `trip-photos-count-${trip.id}`,
      updatedPhotos.length.toString(),
    );
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const newPhoto: TripPhoto = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            url: e.target?.result as string,
            name: file.name,
            description: uploadData.description,
            location: uploadData.location,
            date: new Date().toISOString(),
            size: file.size,
            type: file.type,
          };

          const updatedPhotos = [...photos, newPhoto];
          savePhotos(updatedPhotos);
          toast.success("Foto adicionada com sucesso!");
        };
        reader.readAsDataURL(file);
      } else {
        toast.error("Por favor, selecione apenas arquivos de imagem.");
      }
    });

    setUploadData({ description: "", location: "" });
    setShowUploadDialog(false);
  };

  const deletePhoto = (photoId: string) => {
    const updatedPhotos = photos.filter((photo) => photo.id !== photoId);
    savePhotos(updatedPhotos);
    toast.success("Foto removida com sucesso!");
  };

  const downloadPhoto = (photo: TripPhoto) => {
    const link = document.createElement("a");
    link.href = photo.url;
    link.download = photo.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Fotos da Viagem</h2>
          <p className="text-muted-foreground">
            {photos.length} {photos.length === 1 ? "foto" : "fotos"} adicionadas
          </p>
        </div>

        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogTrigger asChild>
            <Button>
              <Camera className="h-4 w-4 mr-2" />
              Adicionar Fotos
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Fotos</DialogTitle>
              <DialogDescription>
                Selecione as fotos que deseja adicionar à sua viagem.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="photo-upload">Selecionar Fotos</Label>
                <Input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileUpload}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="description">Descrição (opcional)</Label>
                <Input
                  id="description"
                  value={uploadData.description}
                  onChange={(e) =>
                    setUploadData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Descreva as fotos..."
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="location">Local (opcional)</Label>
                <Input
                  id="location"
                  value={uploadData.location}
                  onChange={(e) =>
                    setUploadData((prev) => ({
                      ...prev,
                      location: e.target.value,
                    }))
                  }
                  placeholder="Onde as fotos foram tiradas..."
                  className="mt-1"
                />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Photos Grid */}
      {photos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Camera className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Nenhuma foto adicionada
            </h3>
            <p className="text-muted-foreground text-center mb-4">
              Adicione fotos da sua viagem para criar memórias incríveis!
            </p>
            <Button onClick={() => setShowUploadDialog(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Adicionar Primeira Foto
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {photos.map((photo) => (
            <Card key={photo.id} className="overflow-hidden">
              <div className="relative aspect-video">
                <img
                  src={photo.url}
                  alt={photo.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2 flex gap-1">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setSelectedPhoto(photo)}
                    className="h-8 w-8 p-0"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => downloadPhoto(photo)}
                    className="h-8 w-8 p-0"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deletePhoto(photo.id)}
                    className="h-8 w-8 p-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold truncate mb-2">{photo.name}</h3>
                {photo.description && (
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                    {photo.description}
                  </p>
                )}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {photo.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">{photo.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {new Date(photo.date).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                </div>
                <div className="mt-2">
                  <Badge variant="outline" className="text-xs">
                    {formatFileSize(photo.size)}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Photo Viewer Modal */}
      {selectedPhoto && (
        <Dialog
          open={!!selectedPhoto}
          onOpenChange={() => setSelectedPhoto(null)}
        >
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{selectedPhoto.name}</DialogTitle>
              {selectedPhoto.description && (
                <DialogDescription>
                  {selectedPhoto.description}
                </DialogDescription>
              )}
            </DialogHeader>
            <div className="space-y-4">
              <div className="relative">
                <img
                  src={selectedPhoto.url}
                  alt={selectedPhoto.name}
                  className="w-full max-h-96 object-contain rounded-lg"
                />
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-4">
                  {selectedPhoto.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{selectedPhoto.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {new Date(selectedPhoto.date).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                </div>
                <Badge variant="outline">
                  {formatFileSize(selectedPhoto.size)}
                </Badge>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => downloadPhoto(selectedPhoto)}
                  className="flex-1"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Baixar
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    deletePhoto(selectedPhoto.id);
                    setSelectedPhoto(null);
                  }}
                  className="flex-1"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
