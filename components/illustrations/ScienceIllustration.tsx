export default function ScienceIllustration() {
  return (
    <div className="relative w-full h-full">
      {}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <svg width="140" height="220" viewBox="0 0 140 220" className="text-blue-400">
          {}
          <path d="M70 10 Q90 35 70 60 Q50 35 70 10" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.9"/>
          <path d="M70 60 Q90 85 70 110 Q50 85 70 60" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.9"/>
          <path d="M70 110 Q90 135 70 160 Q50 135 70 110" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.9"/>
          <path d="M70 160 Q90 185 70 210 Q50 185 70 160" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.9"/>
          
          {}
          <path d="M70 10 Q50 35 70 60 Q90 35 70 10" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.7"/>
          <path d="M70 60 Q50 85 70 110 Q90 85 70 60" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.7"/>
          <path d="M70 110 Q50 135 70 160 Q90 135 70 110" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.7"/>
          <path d="M70 160 Q50 185 70 210 Q90 185 70 160" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.7"/>
          
          {}
          <line x1="50" y1="35" x2="90" y2="35" stroke="currentColor" strokeWidth="2" opacity="0.6"/>
          <line x1="50" y1="85" x2="90" y2="85" stroke="currentColor" strokeWidth="2" opacity="0.6"/>
          <line x1="50" y1="135" x2="90" y2="135" stroke="currentColor" strokeWidth="2" opacity="0.6"/>
          <line x1="50" y1="185" x2="90" y2="185" stroke="currentColor" strokeWidth="2" opacity="0.6"/>
        </svg>
      </div>
      
      {}
      <div className="absolute bottom-12 left-8">
        <svg width="50" height="70" viewBox="0 0 50 70" className="text-blue-300">
          <path d="M10 15 L10 55 L20 55 L20 15 Z" stroke="currentColor" strokeWidth="2.5" fill="none"/>
          <path d="M10 55 L20 55" stroke="currentColor" strokeWidth="2.5"/>
          <ellipse cx="15" cy="15" rx="5" ry="3" stroke="currentColor" strokeWidth="2" fill="none"/>
          <rect x="12" y="35" width="6" height="15" fill="currentColor" opacity="0.3"/>
        </svg>
      </div>
      
      {}
      <div className="absolute bottom-16 right-10">
        <svg width="45" height="65" viewBox="0 0 45 65" className="text-blue-300">
          <path d="M15 12 Q15 8 20 8 L25 8 Q30 8 30 12 L30 50 Q30 54 25 54 L20 54 Q15 54 15 50 Z" stroke="currentColor" strokeWidth="2.5" fill="none"/>
          <line x1="20" y1="8" x2="20" y2="54" stroke="currentColor" strokeWidth="1" opacity="0.4"/>
          <line x1="25" y1="8" x2="25" y2="54" stroke="currentColor" strokeWidth="1" opacity="0.4"/>
          <rect x="18" y="35" width="9" height="12" fill="currentColor" opacity="0.3"/>
        </svg>
      </div>
      
      {}
      <div className="absolute top-16 right-12">
        <svg width="45" height="45" viewBox="0 0 45 45" className="text-blue-300">
          <ellipse cx="22.5" cy="22.5" rx="18" ry="18" stroke="currentColor" strokeWidth="2.5" fill="none"/>
          <ellipse cx="22.5" cy="22.5" rx="12" ry="12" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.5"/>
          <circle cx="18" cy="20" r="2" fill="currentColor" opacity="0.4"/>
          <circle cx="27" cy="25" r="2" fill="currentColor" opacity="0.4"/>
        </svg>
      </div>
    </div>
  );
}
