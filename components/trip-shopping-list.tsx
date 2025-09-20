"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Checkbox } from "./ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Badge } from "./ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Plus,
  ShoppingCart,
  Check,
  X,
  Edit,
  Trash2,
  Package,
  Tag,
} from "lucide-react";
import type { Trip } from "../lib/storage";
import { toast } from "sonner";

interface ShoppingItem {
  id: string;
  tripId: string;
  name: string;
  category: string;
  quantity: number;
  estimatedPrice: number;
  actualPrice?: number;
  isPurchased: boolean;
  notes?: string;
  purchaseDate?: string;
  purchaseLocation?: string;
  createdAt: string;
  updatedAt: string;
}

interface TripShoppingListProps {
  trip: Trip;
  onUpdate: (trip: Trip) => void;
}

const SHOPPING_CATEGORIES = [
  "Roupas",
  "Eletrônicos", 
  "Souvenirs",
  "Medicamentos",
  "Cosméticos",
  "Acessórios",
  "Livros",
  "Comida",
  "Bebidas",
  "Outros",
];

export function TripShoppingList({ trip, onUpdate }: TripShoppingListProps) {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    quantity: "1",
    estimatedPrice: "",
    notes: "",
  });
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    loadShoppingList();
  }, [trip.id]);

  const loadShoppingList = () => {
    try {
      const saved = localStorage.getItem('shopping-lists');
      if (saved) {
        const allItems: ShoppingItem[] = JSON.parse(saved);
        const tripItems = allItems.filter(item => item.tripId === trip.id);
        setItems(tripItems);
      }
    } catch (error) {
      console.error('Erro ao carregar lista de compras:', error);
    }
  };

  const saveItem = () => {
    if (!formData.name || !formData.category) {
      toast.error("Preencha nome e categoria");
      return;
    }

    const item: ShoppingItem = {
      id: editingItem?.id || Date.now().toString(),
      tripId: trip.id,
      name: formData.name,
      category: formData.category,
      quantity: parseInt(formData.quantity) || 1,
      estimatedPrice: parseFloat(formData.estimatedPrice) || 0,
      isPurchased: editingItem?.isPurchased || false,
      notes: formData.notes,
      actualPrice: editingItem?.actualPrice,
      purchaseDate: editingItem?.purchaseDate,
      purchaseLocation: editingItem?.purchaseLocation,
      createdAt: editingItem?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const saved = localStorage.getItem('shopping-lists') || '[]';
      let allItems: ShoppingItem[] = JSON.parse(saved);

      if (editingItem) {
        const index = allItems.findIndex(i => i.id === editingItem.id);
        if (index >= 0) {
          allItems[index] = item;
        }
      } else {
        allItems.push(item);
      }

      localStorage.setItem('shopping-lists', JSON.stringify(allItems));
      loadShoppingList();
      resetForm();
      setShowAddModal(false);
      setEditingItem(null);
      toast.success(editingItem ? "Item atualizado!" : "Item adicionado!");
    } catch (error) {
      console.error('Erro ao salvar item:', error);
      toast.error("Erro ao salvar item");
    }
  };

  const togglePurchased = (item: ShoppingItem) => {
    try {
      const saved = localStorage.getItem('shopping-lists') || '[]';
      let allItems: ShoppingItem[] = JSON.parse(saved);
      
      const index = allItems.findIndex(i => i.id === item.id);
      if (index >= 0) {
        allItems[index] = {
          ...item,
          isPurchased: !item.isPurchased,
          purchaseDate: !item.isPurchased ? new Date().toISOString() : undefined,
          updatedAt: new Date().toISOString(),
        };
        
        localStorage.setItem('shopping-lists', JSON.stringify(allItems));
        loadShoppingList();
        toast.success(!item.isPurchased ? "Item marcado como comprado!" : "Item desmarcado");
      }
    } catch (error) {
      console.error('Erro ao atualizar item:', error);
      toast.error("Erro ao atualizar item");
    }
  };

  const deleteItem = (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este item?")) return;

    try {
      const saved = localStorage.getItem('shopping-lists') || '[]';
      let allItems: ShoppingItem[] = JSON.parse(saved);
      allItems = allItems.filter(i => i.id !== id);
      localStorage.setItem('shopping-lists', JSON.stringify(allItems));
      loadShoppingList();
      toast.success("Item excluído!");
    } catch (error) {
      console.error('Erro ao excluir item:', error);
      toast.error("Erro ao excluir item");
    }
  };

  const editItem = (item: ShoppingItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      quantity: item.quantity.toString(),
      estimatedPrice: item.estimatedPrice.toString(),
      notes: item.notes || "",
    });
    setShowAddModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      category: "",
      quantity: "1",
      estimatedPrice: "",
      notes: "",
    });
  };

  const getFilteredItems = () => {
    return items.filter(item => {
      const categoryMatch = filterCategory === "all" || item.category === filterCategory;
      const statusMatch = filterStatus === "all" || 
        (filterStatus === "purchased" && item.isPurchased) ||
        (filterStatus === "pending" && !item.isPurchased);
      
      return categoryMatch && statusMatch;
    });
  };

  const getStats = () => {
    const total = items.length;
    const purchased = items.filter(item => item.isPurchased).length;
    const pending = total - purchased;
    const totalEstimated = items.reduce((sum, item) => sum + item.estimatedPrice, 0);
    const totalSpent = items.reduce((sum, item) => sum + (item.actualPrice || 0), 0);

    return {
      total,
      purchased,
      pending,
      totalEstimated,
      totalSpent,
      completionPercent: total > 0 ? Math.round((purchased / total) * 100) : 0,
    };
  };

  const filteredItems = getFilteredItems();
  const stats = getStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">Lista de Compras</h3>
          <p className="text-muted-foreground">
            Organize o que você quer comprar em {trip.destination}
          </p>
        </div>
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setEditingItem(null); }}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Item
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? "Editar" : "Adicionar"} Item
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome do Item</Label>
                  <Input
                    id="name"
                    placeholder="Ex: Camiseta, Tênis..."
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="category">Categoria</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {SHOPPING_CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="quantity">Quantidade</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="estimatedPrice">Preço Estimado ({trip.currency})</Label>
                  <Input
                    id="estimatedPrice"
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={formData.estimatedPrice}
                    onChange={(e) => setFormData({ ...formData, estimatedPrice: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  placeholder="Cor, tamanho, marca..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowAddModal(false)}>
                  Cancelar
                </Button>
                <Button onClick={saveItem}>
                  {editingItem ? "Atualizar" : "Adicionar"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Itens</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.purchased} comprados, {stats.pending} pendentes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progresso</CardTitle>
            <Check className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completionPercent}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.purchased} de {stats.total} itens
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orçamento</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalEstimated.toFixed(2)} {trip.currency}
            </div>
            <p className="text-xs text-muted-foreground">
              Estimado para compras
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gasto Real</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalSpent.toFixed(2)} {trip.currency}
            </div>
            <p className="text-xs text-muted-foreground">
              Valor já gasto
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Todas categorias" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas categorias</SelectItem>
            {SHOPPING_CATEGORIES.map(cat => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Todos status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os itens</SelectItem>
            <SelectItem value="pending">Pendentes</SelectItem>
            <SelectItem value="purchased">Comprados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Shopping List */}
      <Card>
        <CardHeader>
          <CardTitle>Itens para Comprar</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredItems.length > 0 ? (
            <div className="space-y-4">
              {filteredItems.map((item) => (
                <div 
                  key={item.id} 
                  className={`flex items-center gap-4 p-4 border rounded-lg ${
                    item.isPurchased ? 'bg-green-50 border-green-200' : 'bg-white'
                  }`}
                >
                  <Checkbox
                    checked={item.isPurchased}
                    onCheckedChange={() => togglePurchased(item)}
                  />
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className={`font-medium ${item.isPurchased ? 'line-through text-muted-foreground' : ''}`}>
                        {item.name}
                      </h4>
                      <Badge variant="secondary">{item.category}</Badge>
                      {item.quantity > 1 && (
                        <Badge variant="outline">x{item.quantity}</Badge>
                      )}
                    </div>
                    
                    <div className="text-sm text-muted-foreground mt-1">
                      Preço estimado: {item.estimatedPrice.toFixed(2)} {trip.currency}
                      {item.notes && ` • ${item.notes}`}
                    </div>
                    
                    {item.isPurchased && item.purchaseDate && (
                      <div className="text-xs text-green-600 mt-1">
                        Comprado em {new Date(item.purchaseDate).toLocaleDateString('pt-BR')}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => editItem(item)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteItem(item.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum item na lista ainda</p>
              <p className="text-sm">Adicione itens que você quer comprar na viagem</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
