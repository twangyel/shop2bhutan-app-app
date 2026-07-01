import { useNavigate } from 'react-router-dom'
import {
  Search, Bell, MapPin, ChevronDown,
  Link2, ClipboardList, Truck, HelpCircle,
  ArrowRight, FileText, CreditCard,
  Shield, Wallet,
} from 'lucide-react'
import { useApp } from '@/contexts/AppContext'
import Logo from '@/components/shared/Logo'

const howItWorksSteps = [
  { icon: Link2, text: 'Submit product link or screenshot' },
  { icon: Search, text: 'We verify price and availability' },
  { icon: FileText, text: 'Receive quotation' },
  { icon: CreditCard, text: 'Confirm and pay' },
  { icon: Truck, text: 'Track your order' },
]

const quickActions = [
  { icon: Link2, label: 'Paste Link', path: '/paste-link' },
  { icon: ClipboardList, label: 'My Orders', path: '/orders' },
  { icon: Truck, label: 'Track Order', path: '/orders' },
  { icon: HelpCircle, label: 'Support', path: '/support' },
]

const supportedStores = ['Amazon', 'Flipkart', 'Myntra', 'Meesho', 'Nykaa', 'AJIO']

export default function Home() {
  const navigate = useNavigate()
  const { unreadCount, user } = useApp()

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* A. Sticky Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-neutral-100">
        <div className="flex items-center justify-between px-4 py-3">
          <Logo size="sm" />
          <button
            type="button"
            onClick={() => navigate('/notifications')}
            className="relative p-2"
            aria-label="Notifications"
          >
            <Bell size={22} className="text-neutral-700" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full" />
            )}
          </button>
        </div>
        <button
          type="button"
          onClick={() => navigate('/account')}
          className="flex items-center gap-1 px-4 pb-2"
        >
          <MapPin size={14} className="text-amber-500" />
          <span className="text-xs text-neutral-500">
            Hub: {user?.dzongkhag || 'Thimphu'}
          </span>
          <ChevronDown size={12} className="text-neutral-400" />
        </button>
      </div>

      <div className="px-4 pt-4 pb-6 space-y-5">
        {/* B. Search Bar */}
        <button
          type="button"
          onClick={() => navigate('/paste-link')}
          className="w-full flex items-center gap-3 bg-neutral-100 rounded-full h-10 px-4 text-left"
        >
          <Search size={18} className="text-neutral-400" />
          <span className="text-sm text-neutral-400">
            Search products or paste a link...
          </span>
        </button>

        {/* C. Hero Banner Card */}
        <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 rounded-2xl p-5 text-white shadow-lg">
          <div className="flex flex-wrap gap-2 mb-4">
            {['Amazon.in', 'Flipkart', 'Myntra', 'Meesho'].map((store) => (
              <span
                key={store}
                className="px-2.5 py-1 bg-white/20 backdrop-blur-sm rounded-full text-[11px] font-medium"
              >
                {store}
              </span>
            ))}
          </div>
          <h2 className="text-2xl font-bold leading-tight">
            Shop from India, receive in Bhutan
          </h2>
          <p className="text-sm text-amber-100 mt-2 leading-relaxed">
            Any product. Any site. We handle shipping to your nearest hub.
          </p>
          <button
            type="button"
            onClick={() => navigate('/paste-link')}
            className="mt-4 px-5 py-2.5 bg-white text-amber-600 font-semibold rounded-xl text-sm hover:bg-amber-50 transition-colors"
          >
            Request Product
          </button>
        </div>

        {/* D. Request Quotation Card */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-4 space-y-3">
          <div>
            <h3 className="font-bold text-gray-900">Request quotation by link</h3>
            <p className="text-xs text-neutral-500 mt-1">
              Paste a product URL and we will auto-fetch details when possible.
            </p>
          </div>
          <input
            type="url"
            placeholder="https://..."
            readOnly
            onClick={() => navigate('/paste-link')}
            className="w-full h-11 px-4 border border-neutral-200 rounded-xl text-sm focus:outline-none cursor-pointer"
          />
          <button
            type="button"
            onClick={() => navigate('/paste-link')}
            className="w-full h-11 bg-amber-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-amber-600 transition-colors"
          >
            Request Quotation
            <ArrowRight size={16} />
          </button>
          <p className="text-[11px] text-neutral-400">
            Auto-fetch title, image, and price when the website allows it.
          </p>
        </div>

        {/* E. Quick Actions Grid */}
        <div className="grid grid-cols-4 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <button
                key={action.label}
                type="button"
                onClick={() => navigate(action.path)}
                className="flex flex-col items-center gap-2 bg-white rounded-xl border border-neutral-200 p-3 hover:bg-neutral-50 transition-colors"
              >
                <Icon size={22} className="text-amber-500" />
                <span className="text-[11px] font-medium text-neutral-700">{action.label}</span>
              </button>
            )
          })}
        </div>

        {/* F. How It Works Section */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-4">
          <h3 className="font-bold text-gray-900 mb-4">How it works</h3>
          <div className="space-y-3">
            {howItWorksSteps.map((step, i) => {
              const Icon = step.icon
              return (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-7 h-7 bg-amber-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {i + 1}
                  </div>
                  <Icon size={18} className="text-neutral-400 flex-shrink-0" />
                  <p className="text-sm text-neutral-600">{step.text}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* G. Supported Stores Section */}
        <div>
          <h3 className="font-bold text-gray-900 mb-3">
            Send us links from these stores
          </h3>
          <div className="flex flex-wrap gap-2">
            {supportedStores.map((store) => (
              <span
                key={store}
                className="px-3 py-1.5 bg-white border border-neutral-200 rounded-full text-xs font-medium text-neutral-600"
              >
                {store}
              </span>
            ))}
          </div>
        </div>

        {/* H. Trust Section */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-4">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="flex flex-col items-center gap-2">
              <Shield size={22} className="text-amber-500" />
              <span className="text-[11px] font-medium text-neutral-600 leading-tight">
                Secure ordering
              </span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Wallet size={22} className="text-amber-500" />
              <span className="text-[11px] font-medium text-neutral-600 leading-tight">
                Cash & online payments accepted
              </span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <MapPin size={22} className="text-amber-500" />
              <span className="text-[11px] font-medium text-neutral-600 leading-tight">
                Orders accepted across Bhutan
              </span>
            </div>
          </div>
        </div>

        {/* I. Spacer */}
        <div className="h-2" />
      </div>
    </div>
  )
}
