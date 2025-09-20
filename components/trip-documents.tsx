"use client";
import type { Trip } from "../lib/storage";
import { DocumentChecklist } from "./document-checklist";

interface TripDocumentsProps {
  trip: Trip;
}

export function TripDocuments({ trip }: TripDocumentsProps) {
  return (
    <div className="space-y-6">
      <DocumentChecklist trip={trip} onUpdate={() => {}} />
    </div>
  );
}
