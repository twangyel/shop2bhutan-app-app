import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Globe, Link2, Sparkles } from 'lucide-react';

const platforms = [
  { label: 'Amazon.in', url: 'https://www.amazon.in/' },
  { label: 'Flipkart', url: 'https://www.flipkart.com/' },
  { label: 'Myntra', url: 'https://www.myntra.com/' },
  { label: 'Meesho', url: 'https://www.meesho.com/' },
];

export default function PasteLinkCard() {
  const navigate = useNavigate();
  const [url, setUrl] = useState('');

  const handleSubmit = () => {
    const cleanUrl = url.trim();

    navigate('/paste-link', {
      state: cleanUrl ? { initialUrl: cleanUrl } : undefined,
    });
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white border border-amber-100 shadow-md">
      <div className="h-1 bg-amber-500" />

      <div className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <Link2 size={20} className="text-amber-600" />
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-gray-900 leading-snug">
              Request quotation by link
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Paste a product URL and we will auto-fetch details when possible.
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Globe
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
            />
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSubmit();
              }}
              placeholder="https://..."
              className="w-full h-11 pl-9 pr-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-300 transition-all"
            />
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            className="h-11 px-4 bg-amber-500 text-white text-sm font-bold rounded-xl hover:bg-amber-600 active:scale-95 transition-all flex items-center gap-1.5 flex-shrink-0"
          >
            <span className="hidden sm:inline">Quote</span>
            <ArrowRight size={14} />
          </button>
        </div>

        <div className="flex items-center gap-1.5 mt-3 text-[11px] text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1.5">
          <Sparkles size={12} />
          <span>Auto-fetch title, image, and price when the website allows it.</span>
        </div>

        <div className="flex flex-wrap gap-1.5 mt-3">
          {platforms.map((platform) => (
            <button
              key={platform.label}
              type="button"
              onClick={() => {
                setUrl(platform.url);
                navigate('/paste-link', {
                  state: { initialUrl: platform.url },
                });
              }}
              className="px-2.5 py-1 bg-neutral-50 hover:bg-amber-50 border border-neutral-100 hover:border-amber-200 rounded-lg text-[11px] font-medium text-neutral-600 hover:text-amber-700 transition-colors"
            >
              {platform.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
