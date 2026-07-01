import { useNavigate } from 'react-router-dom'
import { ShoppingBag, ArrowRight } from 'lucide-react'

export default function Shop() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center px-6 py-12">
      <div className="flex flex-col items-center text-center max-w-sm">
        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-6">
          <ShoppingBag size={36} className="text-amber-500" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900">Shop Coming Soon</h1>

        <p className="text-sm text-neutral-500 mt-3 leading-relaxed">
          We are preparing curated products and local store items for you. For now,
          you can request any product from online stores by submitting a product link
          or screenshot.
        </p>

        <button
          type="button"
          onClick={() => navigate('/paste-link')}
          className="mt-8 w-full h-12 bg-amber-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-amber-600 transition-colors"
        >
          Request Product Now
          <ArrowRight size={18} />
        </button>

        <button
          type="button"
          onClick={() => navigate('/orders')}
          className="mt-3 w-full h-12 bg-white text-neutral-600 font-medium rounded-xl border border-neutral-200 flex items-center justify-center hover:bg-neutral-50 transition-colors"
        >
          Track My Orders
        </button>
      </div>
    </div>
  )
}
