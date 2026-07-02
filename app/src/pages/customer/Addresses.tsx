import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  Home,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Save,
  Star,
  Trash2,
  Truck,
  X,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

const DELIVERY_DZONGKHAGS = ['Thimphu', 'Paro', 'Chhukha'] as const;

type CustomerAddress = {
  id: string;
  user_id: string;
  label: string;
  recipient_name: string;
  phone: string;
  dzongkhag: string;
  town: string | null;
  gewog: string | null;
  village: string | null;
  landmark: string | null;
  address_line: string | null;
  is_default: boolean;
  created_at?: string | null;
};

type AddressForm = {
  label: string;
  recipientName: string;
  phone: string;
  dzongkhag: string;
  town: string;
  gewog: string;
  village: string;
  landmark: string;
  addressLine: string;
  isDefault: boolean;
};

const emptyForm: AddressForm = {
  label: 'Home',
  recipientName: '',
  phone: '',
  dzongkhag: '',
  town: '',
  gewog: '',
  village: '',
  landmark: '',
  addressLine: '',
  isDefault: false,
};

function normalizeBhutanPhone(input: string): string | null {
  const digits = input.replace(/\D/g, '');
  const phone8 = digits.startsWith('975') ? digits.slice(3) : digits;

  if (!/^(17|77)\d{6}$/.test(phone8)) return null;

  return phone8;
}

function formatPhone(phone: string) {
  return phone ? `+975 ${phone}` : '';
}

function formFromAddress(address: CustomerAddress): AddressForm {
  return {
    label: address.label || 'Home',
    recipientName: address.recipient_name || '',
    phone: address.phone || '',
    dzongkhag: address.dzongkhag || '',
    town: address.town || '',
    gewog: address.gewog || '',
    village: address.village || '',
    landmark: address.landmark || '',
    addressLine: address.address_line || '',
    isDefault: Boolean(address.is_default),
  };
}

export default function Addresses() {
  const navigate = useNavigate();
  const { user, context } = useAuth();

  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [form, setForm] = useState<AddressForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const profile = context?.profile as { full_name?: string | null; name?: string | null; phone?: string | null } | null;

  const hasAddresses = addresses.length > 0;

  const defaultAddressId = useMemo(
    () => addresses.find((address) => address.is_default)?.id || null,
    [addresses]
  );

  const update = (field: keyof AddressForm, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError('');
    setSuccess('');
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({
      ...emptyForm,
      recipientName: profile?.full_name || profile?.name || '',
      phone: profile?.phone || '',
      isDefault: addresses.length === 0,
    });
    setShowForm(false);
    setError('');
    setSuccess('');
  };

  const loadAddresses = async () => {
    if (!user) {
      setAddresses([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const { data, error: loadError } = await supabase
      .from('customer_addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    setLoading(false);

    if (loadError) {
      setError(loadError.message || 'Unable to load saved addresses.');
      return;
    }

    setAddresses((data || []) as CustomerAddress[]);
  };

  useEffect(() => {
    void loadAddresses();
  }, [user]);

  useEffect(() => {
    if (!showForm || editingId) return;

    setForm((prev) => ({
      ...prev,
      recipientName: prev.recipientName || profile?.full_name || profile?.name || '',
      phone: prev.phone || profile?.phone || '',
      isDefault: addresses.length === 0,
    }));
  }, [showForm, editingId, profile, addresses.length]);

  const openAddForm = () => {
    setEditingId(null);
    setForm({
      ...emptyForm,
      recipientName: profile?.full_name || profile?.name || '',
      phone: profile?.phone || '',
      isDefault: addresses.length === 0,
    });
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  const openEditForm = (address: CustomerAddress) => {
    setEditingId(address.id);
    setForm(formFromAddress(address));
    setShowForm(true);
    setError('');
    setSuccess('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const validateForm = () => {
    const normalizedPhone = normalizeBhutanPhone(form.phone);

    if (!form.label.trim()) return 'Address label is required.';
    if (!form.recipientName.trim()) return 'Recipient name is required.';
    if (!form.phone.trim()) return 'Phone number is required.';
    if (!normalizedPhone) return 'Enter a valid Bhutan mobile number starting with 17 or 77.';
    if (!form.dzongkhag) return 'Please select the delivery dzongkhag.';
    if (!DELIVERY_DZONGKHAGS.includes(form.dzongkhag as (typeof DELIVERY_DZONGKHAGS)[number])) {
      return 'Delivery is currently available only in Thimphu, Paro, and Chhukha.';
    }
    if (!form.town.trim() && !form.gewog.trim() && !form.village.trim()) {
      return 'Please add at least town, gewog, or village.';
    }

    return '';
  };

  const saveAddress = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!user) {
      setError('Please sign in to save addresses.');
      return;
    }

    const validationError = validateForm();
    const normalizedPhone = normalizeBhutanPhone(form.phone);

    if (validationError || !normalizedPhone) {
      setError(validationError || 'Please check your address details.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    const shouldBeDefault = form.isDefault || addresses.length === 0;

    if (shouldBeDefault) {
      const { error: clearDefaultError } = await supabase
        .from('customer_addresses')
        .update({ is_default: false })
        .eq('user_id', user.id);

      if (clearDefaultError) {
        setSaving(false);
        setError(clearDefaultError.message || 'Unable to update default address.');
        return;
      }
    }

    const payload = {
      user_id: user.id,
      label: form.label.trim(),
      recipient_name: form.recipientName.trim(),
      phone: normalizedPhone,
      dzongkhag: form.dzongkhag,
      town: form.town.trim() || null,
      gewog: form.gewog.trim() || null,
      village: form.village.trim() || null,
      landmark: form.landmark.trim() || null,
      address_line: form.addressLine.trim() || null,
      is_default: shouldBeDefault,
    };

    const result = editingId
      ? await supabase.from('customer_addresses').update(payload).eq('id', editingId).eq('user_id', user.id)
      : await supabase.from('customer_addresses').insert(payload);

    setSaving(false);

    if (result.error) {
      setError(result.error.message || 'Unable to save address.');
      return;
    }

    setSuccess(editingId ? 'Address updated successfully.' : 'Address added successfully.');
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    await loadAddresses();
  };

  const setDefaultAddress = async (id: string) => {
    if (!user || defaultAddressId === id) return;

    setError('');
    setSuccess('');

    const { error: clearError } = await supabase
      .from('customer_addresses')
      .update({ is_default: false })
      .eq('user_id', user.id);

    if (clearError) {
      setError(clearError.message || 'Unable to update default address.');
      return;
    }

    const { error: setErrorResult } = await supabase
      .from('customer_addresses')
      .update({ is_default: true })
      .eq('id', id)
      .eq('user_id', user.id);

    if (setErrorResult) {
      setError(setErrorResult.message || 'Unable to update default address.');
      return;
    }

    setSuccess('Default address updated.');
    await loadAddresses();
  };

  const deleteAddress = async (address: CustomerAddress) => {
    if (!user) return;

    const confirmed = window.confirm('Delete this saved address?');
    if (!confirmed) return;

    const { error: deleteError } = await supabase
      .from('customer_addresses')
      .delete()
      .eq('id', address.id)
      .eq('user_id', user.id);

    if (deleteError) {
      setError(deleteError.message || 'Unable to delete address.');
      return;
    }

    setSuccess('Address deleted.');
    await loadAddresses();
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-neutral-50 px-4 py-8">
        <div className="mx-auto max-w-md rounded-3xl bg-white p-6 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100">
            <MapPin size={26} className="text-amber-600" />
          </div>
          <h1 className="mb-2 text-xl font-extrabold text-gray-900">Sign in required</h1>
          <p className="mb-5 text-sm text-neutral-500">Please sign in to manage your delivery addresses.</p>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="h-12 w-full rounded-2xl bg-amber-500 font-bold text-white"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 pb-24">
      <div className="sticky top-0 z-20 border-b border-neutral-100 bg-white/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center justify-between">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => navigate('/account')} className="rounded-full p-1.5 hover:bg-neutral-100">
              <ArrowLeft size={21} className="text-neutral-700" />
            </button>
            <div>
              <h1 className="text-lg font-extrabold text-gray-900">Saved Addresses</h1>
              <p className="text-xs text-neutral-500">Delivery: Thimphu, Paro, and Chhukha</p>
            </div>
          </div>
          <button
            type="button"
            onClick={showForm ? resetForm : openAddForm}
            className="flex h-10 items-center gap-1.5 rounded-2xl bg-amber-500 px-3 text-sm font-bold text-white shadow-sm"
          >
            {showForm ? <X size={16} /> : <Plus size={16} />}
            {showForm ? 'Close' : 'Add'}
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-md px-4 py-4">
        <div className="mb-4 rounded-3xl border border-amber-100 bg-amber-50 p-4">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-amber-600">
              <Truck size={20} />
            </div>
            <div>
              <p className="text-sm font-extrabold text-amber-900">Delivery coverage</p>
              <p className="mt-1 text-xs leading-5 text-amber-800">
                Orders accepted from all 20 dzongkhags. Delivery currently available in Thimphu, Paro, and Chhukha.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-2xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            <Check size={16} />
            {success}
          </div>
        )}

        {showForm && (
          <form onSubmit={saveAddress} className="mb-4 space-y-4 rounded-3xl bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-gray-900">{editingId ? 'Edit Address' : 'Add Address'}</h2>
                <p className="text-xs text-neutral-500">Save a delivery location for faster checkout.</p>
              </div>
              <Home size={22} className="text-amber-500" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-neutral-500">Label</label>
                <select
                  value={form.label}
                  onChange={(event) => update('label', event.target.value)}
                  className="h-11 w-full rounded-2xl border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-amber-300 focus:ring-4 focus:ring-amber-500/10"
                >
                  <option>Home</option>
                  <option>Office</option>
                  <option>Family</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-neutral-500">Delivery Dzongkhag</label>
                <select
                  value={form.dzongkhag}
                  onChange={(event) => update('dzongkhag', event.target.value)}
                  className="h-11 w-full rounded-2xl border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-amber-300 focus:ring-4 focus:ring-amber-500/10"
                >
                  <option value="">Select</option>
                  {DELIVERY_DZONGKHAGS.map((dzongkhag) => (
                    <option key={dzongkhag} value={dzongkhag}>
                      {dzongkhag}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-neutral-500">Recipient Name</label>
              <input
                type="text"
                value={form.recipientName}
                onChange={(event) => update('recipientName', event.target.value)}
                placeholder="Full name"
                className="h-11 w-full rounded-2xl border border-neutral-200 px-3 text-sm outline-none focus:border-amber-300 focus:ring-4 focus:ring-amber-500/10"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-neutral-500">Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(event) => update('phone', event.target.value)}
                placeholder="17123456"
                className="h-11 w-full rounded-2xl border border-neutral-200 px-3 text-sm outline-none focus:border-amber-300 focus:ring-4 focus:ring-amber-500/10"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-neutral-500">Town / Area</label>
                <input
                  type="text"
                  value={form.town}
                  onChange={(event) => update('town', event.target.value)}
                  placeholder="Town / Area"
                  className="h-11 w-full rounded-2xl border border-neutral-200 px-3 text-sm outline-none focus:border-amber-300 focus:ring-4 focus:ring-amber-500/10"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-neutral-500">Gewog</label>
                <input
                  type="text"
                  value={form.gewog}
                  onChange={(event) => update('gewog', event.target.value)}
                  placeholder="Gewog"
                  className="h-11 w-full rounded-2xl border border-neutral-200 px-3 text-sm outline-none focus:border-amber-300 focus:ring-4 focus:ring-amber-500/10"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-neutral-500">Village / Building</label>
              <input
                type="text"
                value={form.village}
                onChange={(event) => update('village', event.target.value)}
                placeholder="Village, building, or apartment"
                className="h-11 w-full rounded-2xl border border-neutral-200 px-3 text-sm outline-none focus:border-amber-300 focus:ring-4 focus:ring-amber-500/10"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-neutral-500">Landmark Optional</label>
              <input
                type="text"
                value={form.landmark}
                onChange={(event) => update('landmark', event.target.value)}
                placeholder="Nearby landmark"
                className="h-11 w-full rounded-2xl border border-neutral-200 px-3 text-sm outline-none focus:border-amber-300 focus:ring-4 focus:ring-amber-500/10"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-neutral-500">Address Details Optional</label>
              <textarea
                value={form.addressLine}
                onChange={(event) => update('addressLine', event.target.value)}
                placeholder="Flat number, road, shop name, or delivery note"
                rows={3}
                className="w-full rounded-2xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-amber-300 focus:ring-4 focus:ring-amber-500/10"
              />
            </div>

            <label className="flex items-center gap-2 rounded-2xl bg-neutral-50 p-3 text-sm text-neutral-700">
              <input
                type="checkbox"
                checked={form.isDefault}
                onChange={(event) => update('isDefault', event.target.checked)}
                className="h-4 w-4 rounded border-neutral-300 text-amber-500 focus:ring-amber-500"
              />
              Make this my default address
            </label>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={resetForm}
                className="h-12 rounded-2xl bg-neutral-100 font-bold text-neutral-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-amber-500 font-bold text-white disabled:opacity-60"
              >
                {saving ? <Loader2 size={17} className="animate-spin" /> : <Save size={17} />}
                Save
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12 text-neutral-500">
            <Loader2 size={22} className="mr-2 animate-spin" /> Loading addresses...
          </div>
        ) : !hasAddresses ? (
          <div className="rounded-3xl bg-white p-6 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
              <MapPin size={25} />
            </div>
            <h2 className="text-lg font-extrabold text-gray-900">No saved addresses yet</h2>
            <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-neutral-500">
              Add a delivery address in Thimphu, Paro, or Chhukha to make checkout faster.
            </p>
            <button
              type="button"
              onClick={openAddForm}
              className="mt-5 h-12 rounded-2xl bg-amber-500 px-6 font-bold text-white"
            >
              Add Address
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {addresses.map((address) => (
              <div key={address.id} className="rounded-3xl bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-amber-700">
                        {address.label}
                      </span>
                      {address.is_default && (
                        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-emerald-700">
                          Default
                        </span>
                      )}
                    </div>

                    <p className="mt-3 text-sm font-extrabold text-gray-900">{address.recipient_name}</p>
                    <p className="text-xs font-medium text-neutral-500">{formatPhone(address.phone)}</p>
                    <p className="mt-2 text-sm leading-5 text-neutral-700">
                      {[address.village, address.town, address.gewog, address.dzongkhag].filter(Boolean).join(', ')}
                    </p>
                    {address.address_line && <p className="mt-1 text-xs leading-5 text-neutral-500">{address.address_line}</p>}
                    {address.landmark && <p className="mt-1 text-xs text-neutral-400">Landmark: {address.landmark}</p>}
                    <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                      <Truck size={13} /> Delivery zone available
                    </div>
                  </div>

                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      onClick={() => openEditForm(address)}
                      className="flex h-9 w-9 items-center justify-center rounded-2xl bg-neutral-50 text-neutral-500 hover:bg-neutral-100"
                      aria-label="Edit address"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => void deleteAddress(address)}
                      className="flex h-9 w-9 items-center justify-center rounded-2xl bg-red-50 text-red-500 hover:bg-red-100"
                      aria-label="Delete address"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {!address.is_default && (
                  <button
                    type="button"
                    onClick={() => void setDefaultAddress(address.id)}
                    className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-2xl bg-amber-50 text-sm font-bold text-amber-700"
                  >
                    <Star size={15} />
                    Set as Default
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
