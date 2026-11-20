import { useState } from 'react';
import { Building2 } from 'lucide-react';

interface VenueImageProps {
  src: string;
  alt: string;
  title: string;
  className?: string;
}

export function VenueImage({ src, alt, title, className = '' }: VenueImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200 text-slate-600 p-6 ${className}`}
        role="img"
        aria-label={alt}
      >
        <Building2 className="w-8 h-8 text-[#0F4C5C] mb-2" strokeWidth={1.5} />
        <span className="text-sm font-medium text-slate-700 text-center">{title}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
