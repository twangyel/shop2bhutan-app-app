interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

const sizeMap = {
  sm: { container: 'w-8 h-8', text: 'text-base', img: 32 },
  md: { container: 'w-10 h-10', text: 'text-lg', img: 40 },
  lg: { container: 'w-14 h-14', text: 'text-xl', img: 56 },
  xl: { container: 'w-20 h-20', text: 'text-2xl', img: 80 },
};

export default function Logo({ size = 'md', showText = true, className = '' }: LogoProps) {
  const s = sizeMap[size];
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img
        src="/logo.png"
        alt="Shop2Bhutan"
        className={`${s.container} rounded-lg object-cover`}
        style={{ imageRendering: 'auto' }}
      />
      {showText && (
        <span className={`${s.text} font-bold text-gray-900 tracking-tight`}>
          Shop2<span className="text-amber-500">Bhutan</span>
        </span>
      )}
    </div>
  );
}
