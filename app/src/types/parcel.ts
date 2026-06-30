export type ParcelStatus = 'pending' | 'collected' | 'in_transit' | 'delivered';

export type ParcelType = 'document' | 'electronics' | 'clothing' | 'food' | 'medicine' | 'other';

export type ParcelSize = 'small' | 'medium' | 'large';

export interface ParcelTrip {
  id: string;
  name: string;
  goingDate: string;
  returnDate: string;
  fromLocation: string;
  toLocation: string;
  description: string;
  isActive: boolean;
  createdAt: string;
}

export interface ParcelRequest {
  id: string;
  userId: string;
  tripId: string;
  trip: ParcelTrip;
  status: ParcelStatus;
  pickupAddress: string;
  contactNumber: string;
  parcelType: ParcelType;
  parcelSize: ParcelSize;
  weightKg: number;
  description: string;
  instructions?: string;
  photoUrl?: string;
  createdAt: string;
  updatedAt: string;
}
