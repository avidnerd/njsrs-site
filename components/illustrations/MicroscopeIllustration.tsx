export default function MicroscopeIllustration() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" className="text-primary-blue">
      {}
      <circle cx="60" cy="25" r="12" fill="currentColor" opacity="0.2"/>
      <rect x="50" y="37" width="20" height="45" rx="3" fill="currentColor" opacity="0.3"/>
      <rect x="52" y="40" width="16" height="40" fill="currentColor" opacity="0.4"/>
      
      {}
      <rect x="25" y="70" width="35" height="8" rx="2" fill="currentColor"/>
      <circle cx="30" cy="74" r="5" fill="currentColor"/>
      <rect x="28" y="78" width="4" height="8" fill="currentColor"/>
      <line x1="20" y1="74" x2="12" y2="74" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="12" y1="70" x2="12" y2="78" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}
