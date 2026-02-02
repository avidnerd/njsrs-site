export default function EnvelopeIllustration() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" className="text-amber-700">
      {}
      <rect x="20" y="35" width="80" height="60" rx="2" fill="#d4a574" stroke="#8b6914" strokeWidth="2"/>
      <polygon points="20,35 60,55 100,35" fill="#e5c9a0"/>
      <line x1="20" y1="35" x2="100" y2="35" stroke="#8b6914" strokeWidth="2"/>
      
      {}
      <circle cx="60" cy="65" r="20" fill="#dc2626"/>
      <circle cx="60" cy="65" r="14" fill="none" stroke="white" strokeWidth="2"/>
      <path d="M60 55 L60 75 M50 65 L70 65" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
      <circle cx="60" cy="65" r="4" fill="white"/>
    </svg>
  );
}
