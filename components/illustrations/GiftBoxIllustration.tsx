export default function GiftBoxIllustration() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" className="text-red-600">
      {}
      <rect x="25" y="45" width="70" height="55" rx="2" fill="#dc2626" stroke="#991b1b" strokeWidth="2"/>
      <rect x="25" y="45" width="70" height="27" fill="#ef4444"/>
      <polygon points="25,45 60,35 95,45" fill="#b91c1c"/>
      
      {}
      <line x1="60" y1="35" x2="60" y2="100" stroke="#991b1b" strokeWidth="2"/>
      <line x1="25" y1="58.5" x2="95" y2="58.5" stroke="#991b1b" strokeWidth="2"/>
      
      {}
      <path 
        d="M60 70 C60 65, 50 60, 50 65 C50 60, 40 65, 40 75 C40 85, 50 90, 60 100 C70 90, 80 85, 80 75 C80 65, 70 60, 70 65 C70 60, 60 65, 60 70 Z" 
        fill="white" 
        opacity="0.95"
      />
    </svg>
  );
}
