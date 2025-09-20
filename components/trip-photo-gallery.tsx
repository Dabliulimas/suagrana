"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Badge } from "./ui/badge";
import { Camera, Trash2, MapPin, Calendar, Plus, Download } from "lucide-react";
import type { Trip } from "../lib/storage";
import { toast } from "sonner";

interface TripPhoto {
  id: string;
  file: File;
  url: string;
  caption: string;
  location?: string;
  date: string;
  category: "food" | "attraction" | "hotel" | "transport" | "people" | "other";
  createdAt: string;
}

interface TripPhotoGalleryProps {
  trip: Trip;
  onUpdate: () => void;
}

export function TripPhotoGallery({ trip, onUpdate }: TripPhotoGalleryProps) {
  const [photos, setPhotos] = useState<TripPhoto[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<TripPhoto | null>(null);
  const [formData, setFormData] = useState({
    caption: "",
    location: "",
    category: "other" as TripPhoto["category"],
  });

  useEffect(() => {
    loadPhotos();
  }, [trip.id]);

  const loadPhotos = () => {
    const data = localStorage.getItem(`trip-photos-${trip.id}`);
    if (typeof window === "undefined") return;
    if (typeof window === "undefined") return;
    if (data) {
      const savedPhotos = JSON.parse(data);
      // Convert base64 back to File objects for display
      const photosWithFiles = savedPhotos.map((photo: any) => ({
        ...photo,
        url: photo.url, // Keep the base64 URL for display
      }));
      setPhotos(photosWithFiles);
    }
  };

  const savePhotos = (newPhotos: TripPhoto[]) => {
    // Convert File objects to base64 for storage
    const photosForStorage = newPhotos.map((photo) => ({
      ...photo,
      file: null, // Don't store the File object
      url: photo.url, // Keep the base64 URL
    }));
    localStorage.setItem(
      `trip-photos-${trip.id}`,
      JSON.stringify(photosForStorage),
    );
    setPhotos(newPhotos);
  };

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const newPhoto: TripPhoto = {
            id: Date.now().toString() + Math.random().toString(36).substr(2),
            file,
            url: e.target?.result as string,
            caption: formData.caption || file.name,
            location: formData.location,
            date: new Date().toISOString().split("T")[0],
            category: formData.category,
            createdAt: new Date().toISOString(),
          };

          const updatedPhotos = [...photos, newPhoto];
          savePhotos(updatedPhotos);
          toast.success("Foto adicionada!");
        };
        reader.readAsDataURL(file);
      }
    });

    setShowAddModal(false);
    setFormData({ caption: "", location: "", category: "other" });
  };

  const deletePhoto = (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta foto?")) {
      const updatedPhotos = photos.filter((p) => p.id !== id);
      savePhotos(updatedPhotos);
      toast.success("Foto excluída!");
    }
  };

  const getCategoryColor = (category: TripPhoto["category"]) => {
    switch (category) {
      case "food":
        return "bg-orange-100 text-orange-800";
      case "attraction":
        return "bg-blue-100 text-blue-800";
      case "hotel":
        return "bg-purple-100 text-purple-800";
      case "transport":
        return "bg-green-100 text-green-800";
      case "people":
        return "bg-pink-100 text-pink-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getCategoryName = (category: TripPhoto["category"]) => {
    switch (category) {
      case "food":
        return "Comida";
      case "attraction":
        return "Atração";
      case "hotel":
        return "Hotel";
      case "transport":
        return "Transporte";
      case "people":
        return "Pessoas";
      default:
        return "Outro";
    }
  };

  const exportPhotos = () => {
    // Create a simple HTML gallery for export
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Fotos - ${trip.name}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
            .photo { border: 1px solid #ddd; border-radius: 8px; overflow: hidden; }
            .photo img { width: 100%; height: 200px; object-fit: cover; }
            .photo-info { padding: 15px; }
            .category { background: #f0f0f0; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Galeria de Fotos - ${trip.name}</h1>
            <p>${trip.destination} | ${new Date(trip.startDate).toLocaleDateString("pt-BR")} - ${new Date(trip.endDate).toLocaleDateString("pt-BR")}</p>
          </div>
          <div class="gallery">
            ${photos
              .map(
                (photo) => `
              <div class="photo">
                <img src="${photo.url}" alt="${photo.caption}" />
                <div class="photo-info">
                  <h3>${photo.caption}</h3>
                  <span class="category">${getCategoryName(photo.category)}</span>
                  ${photo.location ? `<p><strong>Local:</strong> ${photo.location}</p>` : ""}
                  <p><strong>Data:</strong> ${new Date(photo.date).toLocaleDateString("pt-BR")}</p>
                </div>
              </div>
            `,
              )
              .join("")}
          </div>
        </body>
      </html>
    `;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `galeria-${trip.name.toLowerCase().replace(/\s+/g, "-")}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Galeria exportada!");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Galeria de Fotos
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={exportPhotos}
                disabled={photos.length === 0}
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
              <Button onClick={() => setShowAddModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Fotos
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
            <span>
              {photos.length} foto{photos.length !== 1 ? "s" : ""}
            </span>
            <span>•</span>
            <span>Organize suas memórias da viagem</span>
          </div>
        </CardContent>
      </Card>

      {/* Photo Gallery */}
      {photos.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Camera className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              Nenhuma foto adicionada
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Comece adicionando suas primeiras fotos da viagem!
            </p>
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Primeira Foto
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {photos.map((photo) => (
            <Card
              key={photo.id}
              className="overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="relative">
                <img
                  src={photo.url || "/placeholder.svg"}
                  alt={photo.caption}
                  className="w-full h-48 object-cover cursor-pointer"
                  onClick={() => setSelectedPhoto(photo)}
                />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => deletePhoto(photo.id)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium truncate">{photo.caption}</h3>
                    <Badge className={getCategoryColor(photo.category)}>
                      {getCategoryName(photo.category)}
                    </Badge>
                  </div>

                  {photo.location && (
                    <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">{photo.location}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
                    <Calendar className="w-3 h-3" />
                    <span>
                      {new Date(photo.date).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Photos Modal */}
      {showAddModal && (
        <Dialog open={true} onOpenChange={setShowAddModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Fotos</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="photos">Selecionar Fotos *</Label>
                <Input
                  id="photos"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e.target.files)}
                  className="cursor-pointer"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Selecione uma ou várias fotos (JPG, PNG, etc.)
                </p>
              </div>

              <div>
                <Label htmlFor="caption">Legenda Padrão</Label>
                <Input
                  id="caption"
                  value={formData.caption}
                  onChange={(e) =>
                    setFormData({ ...formData, caption: e.target.value })
                  }
                  placeholder="Legenda para as fotos..."
                />
              </div>

              <div>
                <Label htmlFor="location">Local</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  placeholder="Onde as fotos foram tiradas..."
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
                      category: e.target.value as TripPhoto["category"],
                    })
                  }
                  className="w-full p-2 border rounded-md"
                >
                  <option value="other">Outro</option>
                  <option value="food">Comida</option>
                  <option value="attraction">Atração</option>
                  <option value="hotel">Hotel</option>
                  <option value="transport">Transporte</option>
                  <option value="people">Pessoas</option>
                </select>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Photo Viewer Modal */}
      {selectedPhoto && (
        <Dialog open={true} onOpenChange={() => setSelectedPhoto(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{selectedPhoto.caption}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <img
                src={selectedPhoto.url || "/placeholder.svg"}
                alt={selectedPhoto.caption}
                className="w-full max-h-96 object-contain rounded-lg"
              />

              <div className="flex items-center gap-4">
                <Badge className={getCategoryColor(selectedPhoto.category)}>
                  {getCategoryName(selectedPhoto.category)}
                </Badge>

                {selectedPhoto.location && (
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <MapPin className="w-3 h-3" />
                    {selectedPhoto.location}
                  </div>
                )}

                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Calendar className="w-3 h-3" />
                  {new Date(selectedPhoto.date).toLocaleDateString("pt-BR")}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
