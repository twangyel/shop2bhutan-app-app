import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, Package, Camera } from 'lucide-react';
import { parcelTrips, parcelTypeLabels, parcelSizeLabels } from '@/data/parcelData';
import { DZONGKHAGS } from '@/data/mockData';

const parcelTypes = Object.entries(parcelTypeLabels) as [string, string][];
const parcelSizes = Object.entries(parcelSizeLabels) as [string, string][];

export default function ParcelBooking() {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const trip = parcelTrips.find((t) => t.id === tripId);

  const [form, setForm] = useState({
    pickupAddress: '',
    dzongkhag: '',
    contactNumber: '',
    parcelType: '' as string,
    parcelSize: '' as string,
    weightKg: '',
    description: '',
    instructions: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleSubmit = () => {
    const newErrors: Record<string, string> = {};
    if (!form.pickupAddress) newErrors.pickupAddress = 'Required';
    if (!form.dzongkhag) newErrors.dzongkhag = 'Required';
    if (!form.contactNumber) newErrors.contactNumber = 'Required';
    if (!form.parcelType) newErrors.parcelType = 'Required';
    if (!form.parcelSize) newErrors.parcelSize = 'Required';
    if (!form.weightKg) newErrors.weightKg = 'Required';
    if (!form.description) newErrors.description = 'Required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package size={32} className="text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Parcel Request Submitted</h2>
          <p className="text-sm text-neutral-500 mb-6">
            Your parcel request for <span className="font-semibold">{trip?.name}</span> has been received. We will review and confirm shortly.
          </p>
          <button
            onClick={() => navigate('/my-parcels')}
            className="w-full h-12 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 transition-colors"
          >
            View My Parcels
          </button>
          <button onClick={() => navigate('/')} className="w-full h-11 mt-2 text-sm text-neutral-500 hover:text-neutral-700 transition-colors">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-neutral-500">Trip not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 pb-8">
      <div className="bg-white border-b border-neutral-200 px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1 -ml-1">
            <ArrowLeft size={22} className="text-neutral-700" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Book Parcel</h1>
            <p className="text-xs text-neutral-500">{trip.name}</p>
          </div>
        </div>
      </div>

      {/* Trip Info Card */}
      <div className="mx-4 mt-4 bg-white rounded-xl p-4 shadow-sm border border-amber-100">
        <div className="flex items-center gap-2 mb-2">
          <MapPin size={14} className="text-amber-500" />
          <span className="text-xs text-neutral-600">{trip.fromLocation}</span>
          <ArrowLeft size={10} className="text-neutral-400 rotate-180" />
          <span className="text-xs text-neutral-600">{trip.toLocation}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Calendar size={11} className="text-emerald-500" />
            <span className="text-[11px] text-neutral-600">
              Go: {new Date(trip.goingDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar size={11} className="text-blue-500" />
            <span className="text-[11px] text-neutral-600">
              Return: {new Date(trip.returnDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="px-4 mt-4 space-y-4">
        {/* Pickup Address */}
        <div>
          <label className="text-xs font-medium text-neutral-700 uppercase tracking-wider">Pickup Address</label>
          <textarea
            value={form.pickupAddress}
            onChange={(e) => update('pickupAddress', e.target.value)}
            placeholder="Your full pickup address"
            className={`w-full h-20 mt-1.5 p-3 bg-white border rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-500/20 ${errors.pickupAddress ? 'border-red-400' : 'border-neutral-200'}`}
          />
          {errors.pickupAddress && <p className="text-xs text-red-500 mt-1">{errors.pickupAddress}</p>}
        </div>

        {/* Dzongkhag */}
        <div>
          <label className="text-xs font-medium text-neutral-700 uppercase tracking-wider">Dzongkhag</label>
          <select
            value={form.dzongkhag}
            onChange={(e) => update('dzongkhag', e.target.value)}
            className={`w-full h-11 mt-1.5 px-3 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 ${errors.dzongkhag ? 'border-red-400' : 'border-neutral-200'}`}
          >
            <option value="">Select dzongkhag</option>
            {DZONGKHAGS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          {errors.dzongkhag && <p className="text-xs text-red-500 mt-1">{errors.dzongkhag}</p>}
        </div>

        {/* Contact Number */}
        <div>
          <label className="text-xs font-medium text-neutral-700 uppercase tracking-wider">Contact Number</label>
          <input
            type="tel"
            value={form.contactNumber}
            onChange={(e) => update('contactNumber', e.target.value)}
            placeholder="+975 XXXXXXXX"
            className={`w-full h-11 mt-1.5 px-3 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 ${errors.contactNumber ? 'border-red-400' : 'border-neutral-200'}`}
          />
          {errors.contactNumber && <p className="text-xs text-red-500 mt-1">{errors.contactNumber}</p>}
        </div>

        {/* Parcel Type */}
        <div>
          <label className="text-xs font-medium text-neutral-700 uppercase tracking-wider">Parcel Type</label>
          <div className="grid grid-cols-3 gap-2 mt-1.5">
            {parcelTypes.map(([key, label]) => (
              <button
                key={key}
                onClick={() => update('parcelType', key)}
                className={`p-2.5 rounded-xl border text-center transition-colors ${
                  form.parcelType === key
                    ? 'border-amber-500 bg-amber-50'
                    : 'border-neutral-200 bg-white hover:border-neutral-300'
                }`}
              >
                <p className="text-xs font-medium text-gray-900">{label}</p>
              </button>
            ))}
          </div>
          {errors.parcelType && <p className="text-xs text-red-500 mt-1">{errors.parcelType}</p>}
        </div>

        {/* Parcel Size */}
        <div>
          <label className="text-xs font-medium text-neutral-700 uppercase tracking-wider">Parcel Size</label>
          <div className="grid grid-cols-3 gap-2 mt-1.5">
            {parcelSizes.map(([key, label]) => (
              <button
                key={key}
                onClick={() => update('parcelSize', key)}
                className={`p-2.5 rounded-xl border text-center transition-colors ${
                  form.parcelSize === key
                    ? 'border-amber-500 bg-amber-50'
                    : 'border-neutral-200 bg-white hover:border-neutral-300'
                }`}
              >
                <p className="text-xs font-medium text-gray-900">{label}</p>
              </button>
            ))}
          </div>
          {errors.parcelSize && <p className="text-xs text-red-500 mt-1">{errors.parcelSize}</p>}
        </div>

        {/* Weight */}
        <div>
          <label className="text-xs font-medium text-neutral-700 uppercase tracking-wider">Weight (kg)</label>
          <input
            type="number"
            value={form.weightKg}
            onChange={(e) => update('weightKg', e.target.value)}
            placeholder="e.g. 2.5"
            step="0.1"
            className={`w-full h-11 mt-1.5 px-3 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 ${errors.weightKg ? 'border-red-400' : 'border-neutral-200'}`}
          />
          {errors.weightKg && <p className="text-xs text-red-500 mt-1">{errors.weightKg}</p>}
        </div>

        {/* Description */}
        <div>
          <label className="text-xs font-medium text-neutral-700 uppercase tracking-wider">Parcel Description</label>
          <textarea
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            placeholder="What are you sending? e.g. Phone case, documents, clothes..."
            className={`w-full h-20 mt-1.5 p-3 bg-white border rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-500/20 ${errors.description ? 'border-red-400' : 'border-neutral-200'}`}
          />
          {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
        </div>

        {/* Instructions */}
        <div>
          <label className="text-xs font-medium text-neutral-700 uppercase tracking-wider">
            Special Instructions <span className="text-neutral-400 normal-case">(optional)</span>
          </label>
          <textarea
            value={form.instructions}
            onChange={(e) => update('instructions', e.target.value)}
            placeholder="Any special handling instructions..."
            className="w-full h-16 mt-1.5 p-3 bg-white border border-neutral-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          />
        </div>

        {/* Photo Placeholder */}
        <div>
          <label className="text-xs font-medium text-neutral-700 uppercase tracking-wider">
            Photo <span className="text-neutral-400 normal-case">(optional)</span>
          </label>
          <label className="block w-full h-20 mt-1.5 border-2 border-dashed border-neutral-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-amber-300 transition-colors">
            <Camera size={20} className="text-neutral-400" />
            <p className="text-xs text-neutral-400 mt-1">Tap to upload photo</p>
            <input type="file" accept="image/*" className="hidden" />
          </label>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          className="w-full h-12 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 active:scale-[0.98] transition-all"
        >
          Submit Parcel Request
        </button>
      </div>
    </div>
  );
}
