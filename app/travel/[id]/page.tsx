"use client";

import { ModernAppLayout } from "@/components/modern-app-layout";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAccounts, useTransactions } from "@/contexts/unified-context";

import { storage, type Trip } from "@/lib/storage";
import { TripDetails } from "@/components/trip-details";

export default function TripPage() {
  const { accounts, create: createAccount, update: updateAccount, delete: deleteAccount } = useAccounts();
  const { transactions, create: createTransaction, update: updateTransaction, delete: deleteTransaction } = useTransactions();
  const params = useParams();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && params.id) {
      console.log('Carregando viagem com ID:', params.id);
      const trips = storage.getTrips();
      console.log('Viagens encontradas no storage:', trips.length, trips);
      const foundTrip = trips.find((t) => t.id === params.id);
      console.log('Viagem encontrada:', foundTrip);
      setTrip(foundTrip || null);
      setLoading(false);
    }
  }, [isMounted, params.id]);

  if (!isMounted || loading) {
    return (
      <ModernAppLayout
        title="Detalhes da Viagem"
        subtitle="Gerencie os gastos e planejamento da sua viagem"
      >
        <div className="p-4 md:p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </ModernAppLayout>
    );
  }

  if (!trip) {
    return (
      <ModernAppLayout
        title="Viagem não encontrada"
        subtitle="A viagem solicitada não foi encontrada"
      >
        <div className="p-4 md:p-6">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-foreground mb-4">
              Viagem não encontrada
            </h1>
            <p className="text-gray-600">
              A viagem que você está procurando não existe.
            </p>
          </div>
        </div>
      </ModernAppLayout>
    );
  }

  return (
    <ModernAppLayout
      title={`Viagem: ${trip.name}`}
      subtitle="Gerencie os gastos e planejamento da sua viagem"
    >
      <div className="p-4 md:p-6">
        <TripDetails
          trip={trip}
          onUpdate={(updatedTrip) => {
            setTrip(updatedTrip);
            // Optionally save to storage
            storage.updateTrip(updatedTrip.id, updatedTrip);
          }}
        />
      </div>
    </ModernAppLayout>
  );
}
