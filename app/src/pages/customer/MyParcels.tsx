import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Calendar } from 'lucide-react';
import { parcelRequests, parcelStatusLabels, parcelStatusColors } from '@/data/parcelData';
import EmptyState from '@/components/shared/EmptyState';

export default function MyParcels() {
  const navigate = useNavigate();

  if (parcelRequests.length === 0) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="px-4 py-4 bg-white border-b border-neutral-200">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-1"><ArrowLeft size={22} className="text-neutral-700" /></button>
            <h1 className="text-lg font-semibold text-gray-900">My Parcels</h1>
          </div>
        </div>
        <EmptyState
          icon={<Package size={40} className="text-neutral-300" />}
          title="No parcels yet"
          description="Book a parcel trip to get started"
          action={{ label: 'Book a Parcel', onClick: () => navigate('/parcel') }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="px-4 py-4 bg-white border-b border-neutral-200">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1"><ArrowLeft size={22} className="text-neutral-700" /></button>
          <h1 className="text-lg font-semibold text-gray-900">My Parcels</h1>
        </div>
      </div>

      <div className="px-4 py-4 space-y-3">
        {parcelRequests.map((pr) => {
          const colors = parcelStatusColors[pr.status];
          return (
            <div key={pr.id} className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center">
                    <Package size={18} className="text-neutral-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{pr.description}</p>
                    <p className="text-[11px] text-neutral-500">{pr.trip.name}</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 ${colors.bg} ${colors.text} text-[10px] font-bold rounded-full`}>
                  {parcelStatusLabels[pr.status]}
                </span>
              </div>

              <div className="mt-3 pt-3 border-t border-neutral-100 space-y-1.5">
                <div className="flex items-center gap-2">
                  <Calendar size={12} className="text-neutral-400" />
                  <span className="text-[11px] text-neutral-600">
                    Trip: {new Date(pr.trip.goingDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} — {new Date(pr.trip.returnDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-500">
                  Pickup: {pr.pickupAddress}
                </p>
                <p className="text-[11px] text-neutral-500">
                  Size: {pr.parcelSize} · Weight: {pr.weightKg}kg · Type: {pr.parcelType}
                </p>
                {pr.instructions && (
                  <p className="text-[11px] text-amber-600 italic">Note: {pr.instructions}</p>
                )}
              </div>

              {/* Status timeline */}
              <div className="flex items-center gap-1.5 mt-3">
                {(['pending', 'collected', 'in_transit', 'delivered'] as const).map((s, i) => {
                  const isDone = ['pending', 'collected', 'in_transit', 'delivered'].indexOf(pr.status) >= i;
                  return (
                    <div key={s} className="flex items-center gap-1.5 flex-1">
                      <div className={`w-2 h-2 rounded-full ${isDone ? 'bg-amber-500' : 'bg-neutral-200'}`} />
                      <span className={`text-[9px] ${isDone ? 'text-neutral-700 font-medium' : 'text-neutral-400'}`}>
                        {parcelStatusLabels[s]}
                      </span>
                      {i < 3 && <div className={`flex-1 h-px ${isDone ? 'bg-amber-300' : 'bg-neutral-200'}`} />}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
