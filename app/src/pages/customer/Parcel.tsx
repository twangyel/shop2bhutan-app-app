import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, ArrowRight, Package } from 'lucide-react';
import { parcelTrips } from '@/data/parcelData';
import { parcelRequests } from '@/data/parcelData';
import { parcelStatusLabels, parcelStatusColors } from '@/data/parcelData';
import EmptyState from '@/components/shared/EmptyState';

export default function Parcel() {
  const navigate = useNavigate();
  const activeTrips = parcelTrips.filter((t) => t.isActive);
  const myRequests = parcelRequests;

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="bg-white border-b border-neutral-200 px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="p-1 -ml-1">
            <ArrowLeft size={22} className="text-neutral-700" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Parcel Service</h1>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* My Recent Parcels */}
        {myRequests.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[15px] font-bold text-gray-900">My Parcels</h3>
              <button onClick={() => navigate('/my-parcels')} className="text-xs font-semibold text-amber-600">
                View All
              </button>
            </div>
            <div className="space-y-2">
              {myRequests.slice(0, 2).map((pr) => {
                const colors = parcelStatusColors[pr.status];
                return (
                  <button
                    key={pr.id}
                    onClick={() => navigate('/my-parcels')}
                    className="w-full bg-white rounded-xl p-3 shadow-sm flex items-center gap-3 text-left hover:shadow-md transition-shadow"
                  >
                    <div className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Package size={18} className="text-neutral-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{pr.description}</p>
                      <p className="text-[11px] text-neutral-500">{pr.trip.name}</p>
                    </div>
                    <span className={`px-2 py-0.5 ${colors.bg} ${colors.text} text-[10px] font-bold rounded-full`}>
                      {parcelStatusLabels[pr.status]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Available Trips */}
        <div>
          <h3 className="text-[15px] font-bold text-gray-900 mb-3">Available Trips</h3>
          <p className="text-[12px] text-neutral-500 mb-3 -mt-2">Select a trip to book your parcel</p>

          {activeTrips.length === 0 ? (
            <EmptyState
              icon={<Calendar size={40} className="text-neutral-300" />}
              title="No trips available"
              description="Check back soon for new parcel trips."
            />
          ) : (
            <div className="space-y-3">
              {activeTrips.map((trip) => (
                <button
                  key={trip.id}
                  onClick={() => navigate(`/parcel-booking/${trip.id}`)}
                  className="w-full bg-white rounded-xl p-4 shadow-sm border border-neutral-100 hover:border-amber-200 hover:shadow-md active:scale-[0.98] transition-all text-left"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-gray-900">{trip.name}</h4>
                      <p className="text-[11px] text-neutral-500 mt-0.5">{trip.description}</p>

                      <div className="flex items-center gap-1.5 mt-2">
                        <MapPin size={12} className="text-amber-500" />
                        <span className="text-[11px] text-neutral-600">{trip.fromLocation}</span>
                        <ArrowRight size={10} className="text-neutral-400" />
                        <span className="text-[11px] text-neutral-600">{trip.toLocation}</span>
                      </div>

                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-1">
                          <Calendar size={11} className="text-emerald-500" />
                          <span className="text-[11px] text-neutral-600">
                            Go: {new Date(trip.goingDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar size={11} className="text-blue-500" />
                          <span className="text-[11px] text-neutral-600">
                            Return: {new Date(trip.returnDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <ArrowRight size={18} className="text-amber-500 flex-shrink-0 mt-1" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
