import { useState } from 'react';
import { Check, Truck, Package } from 'lucide-react';
import { parcelRequests as initialRequests, parcelStatusLabels, parcelStatusColors } from '@/data/parcelData';
import type { ParcelRequest } from '@/types/parcel';

const statusButtons: { status: string; label: string; color: string }[] = [
  { status: 'collected', label: 'Mark Collected', color: 'bg-blue-500 hover:bg-blue-600' },
  { status: 'in_transit', label: 'Mark In Transit', color: 'bg-violet-500 hover:bg-violet-600' },
  { status: 'delivered', label: 'Mark Delivered', color: 'bg-emerald-500 hover:bg-emerald-600' },
];

export default function ParcelRequests() {
  const [requests, setRequests] = useState<ParcelRequest[]>(initialRequests);
  const [filter, setFilter] = useState('all');

  const updateStatus = (id: string, newStatus: string) => {
    setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: newStatus as ParcelRequest['status'] } : r));
  };

  const filtered = filter === 'all' ? requests : requests.filter((r) => r.status === filter);

  const tabs = [
    { key: 'all', label: 'All', count: requests.length },
    { key: 'pending', label: 'Pending', count: requests.filter((r) => r.status === 'pending').length },
    { key: 'collected', label: 'Collected', count: requests.filter((r) => r.status === 'collected').length },
    { key: 'in_transit', label: 'In Transit', count: requests.filter((r) => r.status === 'in_transit').length },
    { key: 'delivered', label: 'Delivered', count: requests.filter((r) => r.status === 'delivered').length },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Parcel Requests</h2>
        <p className="text-sm text-neutral-500">Manage customer parcel bookings</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-white rounded-xl p-1 shadow-card w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              filter === tab.key ? 'bg-amber-500 text-white' : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Requests */}
      <div className="space-y-3">
        {filtered.map((req) => {
          const colors = parcelStatusColors[req.status];
          const nextActions = statusButtons.filter((b) => {
            const order = ['pending', 'collected', 'in_transit', 'delivered'];
            return order.indexOf(b.status) > order.indexOf(req.status);
          });

          return (
            <div key={req.id} className="bg-white rounded-xl p-5 shadow-card">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center">
                    <Package size={18} className="text-neutral-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{req.description}</p>
                    <p className="text-xs text-neutral-500">{req.trip.name}</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 ${colors.bg} ${colors.text} text-xs font-bold rounded-full`}>
                  {parcelStatusLabels[req.status]}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
                <div>
                  <p className="text-xs text-neutral-500">Pickup</p>
                  <p className="font-medium">{req.pickupAddress}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500">Contact</p>
                  <p className="font-medium">{req.contactNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500">Type</p>
                  <p className="font-medium capitalize">{req.parcelType} · {req.parcelSize}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500">Weight</p>
                  <p className="font-medium">{req.weightKg} kg</p>
                </div>
              </div>

              {req.instructions && (
                <div className="mt-2 p-2 bg-amber-50 rounded-lg">
                  <p className="text-xs text-amber-700 italic">Note: {req.instructions}</p>
                </div>
              )}

              {/* Status timeline */}
              <div className="flex items-center gap-1.5 mt-4">
                {(['pending', 'collected', 'in_transit', 'delivered'] as const).map((s, i) => {
                  const isDone = ['pending', 'collected', 'in_transit', 'delivered'].indexOf(req.status) >= i;
                  return (
                    <div key={s} className="flex items-center gap-1 flex-1">
                      <div className={`w-2.5 h-2.5 rounded-full ${isDone ? 'bg-amber-500' : 'bg-neutral-200'}`} />
                      <span className={`text-[10px] ${isDone ? 'text-neutral-700 font-medium' : 'text-neutral-400'}`}>{parcelStatusLabels[s]}</span>
                      {i < 3 && <div className={`flex-1 h-px ${isDone ? 'bg-amber-300' : 'bg-neutral-200'}`} />}
                    </div>
                  );
                })}
              </div>

              {/* Action buttons */}
              {nextActions.length > 0 && (
                <div className="flex gap-2 mt-4">
                  {nextActions.slice(0, 1).map((action) => (
                    <button
                      key={action.status}
                      onClick={() => updateStatus(req.id, action.status)}
                      className={`flex-1 h-9 ${action.color} text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5`}
                    >
                      {action.status === 'collected' && <Package size={14} />}
                      {action.status === 'in_transit' && <Truck size={14} />}
                      {action.status === 'delivered' && <Check size={14} />}
                      {action.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
