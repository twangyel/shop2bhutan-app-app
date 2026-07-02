import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Camera,
  ExternalLink,
  ImageIcon,
  Info,
  Link2,
  Loader2,
  MapPin,
  Minus,
  Phone,
  Plus,
  Sparkles,
  Trash2,
  User,
  X,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  detectSourcePlatformFromUrl,
  fetchProductLinkPreview,
  normalizeProductUrl,
  submitPasteLinkOrder,
  type PasteLinkOrderItemInput,
  type ProductLinkPreview,
} from '@/lib/customerOrders';

const platforms = [
  { name: 'Amazon', key: 'amazon', color: 'bg-orange-100 text-orange-700 border-orange-300', initial: 'A' },
  { name: 'Flipkart', key: 'flipkart', color: 'bg-blue-100 text-blue-700 border-blue-300', initial: 'F' },
  { name: 'Myntra', key: 'myntra', color: 'bg-pink-100 text-pink-700 border-pink-300', initial: 'M' },
  { name: 'Meesho', key: 'meesho', color: 'bg-violet-100 text-violet-700 border-violet-300', initial: 'M' },
];

type ProfileLike = {
  full_name?: string;
  name?: string;
  phone?: string;
  dzongkhag?: string;
  delivery_address?: string;
};

type PasteLinkDraftItem = PasteLinkOrderItemInput & {
  id: string;
  sourcePlatform: string;
  productName: string;
  productImage?: string;
  price: number;
  quantity: number;
  screenshotPreviewUrl?: string;
};

type PreviewState = {
  url: string;
  loading: boolean;
  data: ProductLinkPreview | null;
  error: string;
};

const emptyPreview: PreviewState = {
  url: '',
  loading: false,
  data: null,
  error: '',
};

function makeProductName(platform: string) {
  if (!platform || platform === 'other') return 'Pasted product link';
  return `Product from ${platform.charAt(0).toUpperCase()}${platform.slice(1)}`;
}

function makeDeliveryAddress(profile: ProfileLike | null) {
  const parts = [profile?.delivery_address, profile?.dzongkhag]
    .map((part) => String(part ?? '').trim())
    .filter(Boolean);

  return Array.from(new Set(parts)).join(', ');
}

function formatPrice(value?: number, currency = 'INR') {
  if (!value || value <= 0) return '';
  const label = currency === 'BTN' ? 'Nu.' : currency === 'INR' ? '₹' : currency;
  return `${label} ${Math.round(value).toLocaleString()}`;
}

function makeLocalFallbackPreview(cleanUrl: string, message?: string): ProductLinkPreview {
  const platform = detectSourcePlatformFromUrl(cleanUrl);

  return {
    url: cleanUrl,
    platform,
    title: makeProductName(platform),
    image: '',
    price: 0,
    currency: 'INR',
    fetched: false,
    message:
      message ||
      'We could not auto-detect product details. You can still continue — Shop2Bhutan will verify the item before quotation.',
  };
}

function isPreviewForUrl(preview: PreviewState, cleanUrl: string) {
  return Boolean(preview.data && preview.url === cleanUrl);
}

export default function PasteLink() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, context } = useAuth();

  const locationState = location.state as { initialUrl?: string } | null;
  const [url, setUrl] = useState(locationState?.initialUrl ?? '');
  const [items, setItems] = useState<PasteLinkDraftItem[]>([]);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [preview, setPreview] = useState<PreviewState>(emptyPreview);

  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const profile = (context?.profile ?? null) as ProfileLike | null;

  const [customer, setCustomer] = useState({
    name: '',
    phone: '',
    deliveryAddress: '',
    notes: '',
  });

  const cleanUrl = useMemo(() => normalizeProductUrl(url), [url]);
  const canTryPreview = cleanUrl && cleanUrl.length > 14 && cleanUrl.includes('.');

  useEffect(() => {
    if (!user) return;

    const profileName =
      profile?.full_name ||
      profile?.name ||
      user.email?.split('@')[0] ||
      '';

    setCustomer((prev) => ({
      name: prev.name || profileName,
      phone: prev.phone || profile?.phone || '',
      deliveryAddress: prev.deliveryAddress || makeDeliveryAddress(profile),
      notes: prev.notes,
    }));
  }, [user, profile]);

  useEffect(() => {
    if (!canTryPreview) {
      setPreview(emptyPreview);
      return;
    }

    let cancelled = false;
    const activeUrl = cleanUrl;

    setPreview({
      url: activeUrl,
      loading: true,
      data: null,
      error: '',
    });

    const timer = window.setTimeout(async () => {
      try {
        const data = await fetchProductLinkPreview(activeUrl);
        if (cancelled) return;

        setPreview({
          url: activeUrl,
          loading: false,
          data: data || makeLocalFallbackPreview(activeUrl),
          error: data?.fetched ? '' : data?.message || '',
        });
      } catch (error) {
        if (cancelled) return;

        const fallback = makeLocalFallbackPreview(
          activeUrl,
          error instanceof Error ? error.message : 'Unable to fetch product details.'
        );

        setPreview({
          url: activeUrl,
          loading: false,
          data: fallback,
          error: fallback.message || '',
        });
      }
    }, 700);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [canTryPreview, cleanUrl]);

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setSubmitError('Please select an image file (JPG, PNG, etc.)');
      return;
    }

    setSubmitError('');
    setScreenshotFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setScreenshotPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const clearScreenshot = () => {
    setScreenshotFile(null);
    setScreenshotPreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const addItemFromPreview = async () => {
    setSubmitError('');

    const hasUrl = Boolean(cleanUrl);
    const hasScreenshot = Boolean(screenshotFile);

    if (!hasUrl && !hasScreenshot) {
      setSubmitError('Please paste a product link or upload a product screenshot.');
      return;
    }

    let productPreview: ProductLinkPreview | null = null;

    if (hasUrl) {
      productPreview = isPreviewForUrl(preview, cleanUrl) ? preview.data : null;

      if (!productPreview) {
        setPreview({ url: cleanUrl, loading: true, data: null, error: '' });

        try {
          productPreview = await fetchProductLinkPreview(cleanUrl);
        } catch (error) {
          productPreview = makeLocalFallbackPreview(
            cleanUrl,
            error instanceof Error ? error.message : 'Unable to fetch product details.'
          );
        }

        setPreview({
          url: cleanUrl,
          loading: false,
          data: productPreview,
          error: productPreview.fetched ? '' : productPreview.message || '',
        });
      }
    }

    const platform = productPreview?.platform || (hasUrl ? detectSourcePlatformFromUrl(cleanUrl) : 'other');
    const productName = productPreview?.title || (hasUrl ? makeProductName(platform) : 'Screenshot product request');

    setItems((prev) => [
      ...prev,
      {
        id: `pli-${Date.now()}`,
        sourceUrl: hasUrl ? cleanUrl : '',
        sourcePlatform: platform,
        productName,
        productImage: productPreview?.image || '',
        price: productPreview?.price || 0,
        quantity: 1,
        notes: '',
        screenshotFile: screenshotFile || undefined,
        screenshotPreviewUrl: screenshotPreview || undefined,
      },
    ]);

    setUrl('');
    setPreview(emptyPreview);
    clearScreenshot();
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateItem = (id: string, patch: Partial<PasteLinkDraftItem>) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
  };

  const updateQty = (id: string, delta: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item
      )
    );
  };

  const handleSubmitOrder = async () => {
    setSubmitError('');

    if (!user) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }

    if (items.length === 0) {
      setSubmitError('Please add at least one product link or screenshot.');
      return;
    }

    if (!customer.name.trim()) {
      setSubmitError('Please enter your name.');
      return;
    }

    if (!customer.phone.trim()) {
      setSubmitError('Please enter your phone number.');
      return;
    }

    setSubmitting(true);

    try {
      const result = await submitPasteLinkOrder({
        userId: user.id,
        email: user.email,
        customerName: customer.name,
        customerPhone: customer.phone,
        deliveryAddress: customer.deliveryAddress,
        customerNotes: customer.notes || 'Paste-link order submitted by customer.',
        items,
      });

      navigate(`/order/${result.orderId}`, { replace: true });
    } catch (error) {
      console.error('Failed to submit paste-link order:', error);
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Unable to submit your order. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 pb-56">
      <div className="bg-white px-5 pt-6 pb-5 border-b border-neutral-100">
        <h1 className="text-2xl font-bold text-gray-900">Request Product</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Paste a product link or upload a product screenshot. We will verify details and send you a quotation.
        </p>

        <div className="flex gap-3 mt-5 justify-center">
          {platforms.map((p) => (
            <div key={p.name} className="flex flex-col items-center gap-1">
              <div
                className={`w-11 h-11 rounded-full border-2 flex items-center justify-center font-bold ${p.color}`}
              >
                {p.initial}
              </div>
              <span className="text-[10px] text-neutral-600">{p.name}</span>
            </div>
          ))}
        </div>

        <div className="mt-5 bg-neutral-50 rounded-2xl p-4">
          <div className="relative">
            <Link2
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
            />
            <input
              type="url"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setSubmitError('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') addItemFromPreview();
              }}
              placeholder="Paste product URL from Amazon, Flipkart, Myntra, Meesho..."
              className="w-full h-12 pl-10 pr-10 bg-white border border-neutral-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
            {url && (
              <button
                type="button"
                onClick={() => {
                  setUrl('');
                  setPreview(emptyPreview);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* Screenshot Upload */}
          <div className="mt-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleScreenshotChange}
              className="hidden"
            />

            {!screenshotFile ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-12 border-2 border-dashed border-neutral-300 rounded-xl flex items-center justify-center gap-2 text-sm text-neutral-500 hover:border-amber-400 hover:text-amber-600 transition-colors"
              >
                <Camera size={18} />
                Upload product screenshot
              </button>
            ) : (
              <div className="relative rounded-xl border border-neutral-200 bg-white overflow-hidden">
                <img
                  src={screenshotPreview}
                  alt="Screenshot preview"
                  className="w-full h-32 object-cover"
                />
                <button
                  type="button"
                  onClick={clearScreenshot}
                  className="absolute top-2 right-2 w-7 h-7 bg-white/90 rounded-full flex items-center justify-center shadow-sm"
                >
                  <X size={14} className="text-neutral-600" />
                </button>
                <div className="px-3 py-2 bg-white">
                  <p className="text-xs text-neutral-500 truncate">{screenshotFile.name}</p>
                </div>
              </div>
            )}
          </div>

          {preview.loading && (
            <div className="mt-3 rounded-xl border border-amber-100 bg-white p-3 flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-amber-50 flex items-center justify-center">
                <Loader2 size={20} className="text-amber-500 animate-spin" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Fetching product details...</p>
                <p className="text-xs text-neutral-500">This may take a few seconds.</p>
              </div>
            </div>
          )}

          {!preview.loading && preview.data && cleanUrl && (
            <div className="mt-3 rounded-xl border border-neutral-200 bg-white p-3">
              <div className="flex gap-3">
                {preview.data.image ? (
                  <img
                    src={preview.data.image}
                    alt=""
                    className="w-16 h-16 rounded-lg object-cover bg-neutral-100 flex-shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-neutral-100 flex items-center justify-center flex-shrink-0">
                    <ImageIcon size={22} className="text-neutral-400" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Sparkles size={13} className="text-amber-500" />
                    <span className="text-[11px] font-semibold text-amber-600">
                      {preview.data.fetched ? 'Product preview found' : 'Product details not detected'}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 line-clamp-2">
                    {preview.data.fetched ? preview.data.title : 'We could not detect product details'}
                  </p>
                  {!preview.data.fetched && (
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      No worries — Shop2Bhutan will verify this manually.
                    </p>
                  )}
                  <a
                    href={preview.data.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block text-[11px] text-neutral-400 truncate mt-0.5"
                  >
                    {preview.data.url}
                  </a>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 bg-neutral-100 text-neutral-600 text-[10px] font-medium rounded-full uppercase">
                      {preview.data.platform}
                    </span>
                    {preview.data.price ? (
                      <span className="text-xs font-bold text-amber-600">
                        {formatPrice(preview.data.price, preview.data.currency)}
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-neutral-500">
                        Price will be verified
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {preview.error && (
                <p className="text-[11px] text-orange-600 bg-orange-50 rounded-lg px-2 py-1 mt-2">
                  {preview.error}
                </p>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={addItemFromPreview}
            disabled={(!cleanUrl && !screenshotFile) || preview.loading}
            className="w-full h-12 bg-amber-500 text-white font-semibold rounded-xl mt-3 hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {preview.loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Fetching...
              </>
            ) : (
              <>
                Add to Quote Request
                <Plus size={18} />
              </>
            )}
          </button>
        </div>
      </div>

      {items.length > 0 && (
        <div className="px-4 mt-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Your Request Items</h3>
              <p className="text-xs text-neutral-500">Review or edit details before submitting your quote request.</p>
            </div>
            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
              {items.length}
            </span>
          </div>

          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl p-3 shadow-sm border border-neutral-100">
                <div className="flex gap-3">
                  {item.screenshotPreviewUrl ? (
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-neutral-100 flex-shrink-0">
                      <img src={item.screenshotPreviewUrl} alt="" className="w-full h-full object-cover" />
                      <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-amber-500 text-white text-[9px] font-bold rounded">
                        IMG
                      </span>
                    </div>
                  ) : item.productImage ? (
                    <img
                      src={item.productImage}
                      alt=""
                      className="w-20 h-20 rounded-xl object-cover bg-neutral-100 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-neutral-100 flex items-center justify-center flex-shrink-0">
                      <ExternalLink size={22} className="text-neutral-400" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      value={item.productName}
                      onChange={(e) => updateItem(item.id, { productName: e.target.value })}
                      className="w-full text-sm font-semibold text-gray-900 border-0 p-0 focus:outline-none focus:ring-0"
                      placeholder="Product name"
                    />

                    {item.sourceUrl ? (
                      <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="block text-[11px] text-neutral-400 truncate mt-1">
                        {item.sourceUrl}
                      </a>
                    ) : (
                      <span className="inline-block mt-1 px-2 py-0.5 bg-amber-50 text-amber-600 text-[10px] font-medium rounded-full">
                        Screenshot request
                      </span>
                    )}

                    <span className="inline-block mt-1 px-2 py-0.5 bg-neutral-100 text-neutral-600 text-[10px] font-medium rounded-full uppercase">
                      {item.sourcePlatform}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="p-1 text-red-400 self-start"
                    aria-label="Remove item"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="grid grid-cols-[1fr_auto] gap-3 mt-3">
                  <div>
                    <label className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">
                      Price shown on site
                    </label>
                    <input
                      type="number"
                      value={item.price || ''}
                      onChange={(e) => updateItem(item.id, { price: Number(e.target.value) || 0 })}
                      placeholder="Optional"
                      className="w-full h-10 mt-1 px-3 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-medium uppercase tracking-wider text-neutral-400 text-center">
                      Qty
                    </label>
                    <div className="flex items-center gap-1 mt-1">
                      <button
                        type="button"
                        onClick={() => updateQty(item.id, -1)}
                        className="w-9 h-10 bg-neutral-100 rounded-xl flex items-center justify-center"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQty(item.id, 1)}
                        className="w-9 h-10 bg-neutral-100 rounded-xl flex items-center justify-center"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                </div>

                <textarea
                  value={item.notes || ''}
                  onChange={(e) => updateItem(item.id, { notes: e.target.value })}
                  placeholder="Color, size, variant, or any instruction for this item..."
                  rows={2}
                  className="w-full mt-3 px-3 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 resize-none"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {items.length > 0 && (
        <div className="px-4 mt-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-neutral-100 space-y-3">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Contact & Delivery</h3>
              <p className="text-xs text-neutral-500">Used by admin to prepare and confirm your quotation.</p>
            </div>

            {!user && (
              <div className="rounded-lg bg-orange-50 border border-orange-100 px-3 py-2 text-xs text-orange-700">
                Please sign in before submitting your order.
              </div>
            )}

            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                value={customer.name}
                onChange={(e) => setCustomer((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Customer name"
                className="w-full h-11 pl-9 pr-3 border border-neutral-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            <div className="relative">
              <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                value={customer.phone}
                onChange={(e) => setCustomer((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="Phone number"
                className="w-full h-11 pl-9 pr-3 border border-neutral-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            <div className="relative">
              <MapPin size={16} className="absolute left-3 top-3 text-neutral-400" />
              <textarea
                value={customer.deliveryAddress}
                onChange={(e) => setCustomer((prev) => ({ ...prev, deliveryAddress: e.target.value }))}
                placeholder="Dzongkhag, delivery address, or nearest hub"
                rows={2}
                className="w-full pl-9 pr-3 py-2 border border-neutral-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 resize-none"
              />
            </div>

            <textarea
              value={customer.notes}
              onChange={(e) => setCustomer((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Extra instruction for Shop2Bhutan admin..."
              rows={2}
              className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 resize-none"
            />
          </div>
        </div>
      )}

      <div className="px-4 mt-5">
        <button
          type="button"
          onClick={() => setShowHowItWorks(!showHowItWorks)}
          className="flex items-center gap-2 text-sm text-neutral-600"
        >
          <Info size={16} />
          <span className="font-medium">How does this work?</span>
        </button>

        {showHowItWorks && (
          <div className="mt-3 bg-white rounded-xl p-4 space-y-3">
            {[
              'Paste a product link or upload a screenshot',
              'We verify availability, price, service fee, and delivery cost',
              'You receive a quotation with the final amount',
              'Approve the quotation, make payment, and we handle the rest',
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {i + 1}
                </span>
                <p className="text-sm text-neutral-600">{step}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {submitError && (
        <div className="fixed left-4 right-4 bottom-[148px] md:bottom-20 z-[60] rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 shadow-lg">
          {submitError}
        </div>
      )}

      {items.length > 0 && (
        <div className="fixed left-0 right-0 bottom-[72px] md:bottom-0 bg-white border-t border-neutral-200 p-4 z-[60]">
          <button
            type="button"
            onClick={handleSubmitOrder}
            disabled={submitting}
            className="w-full h-12 bg-amber-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-amber-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                Submit Quote Request
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
