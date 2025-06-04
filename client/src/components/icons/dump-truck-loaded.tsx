interface DumpTruckLoadedProps {
  className?: string;
}

export default function DumpTruckLoaded({ className = "h-6 w-6" }: DumpTruckLoadedProps) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Truck cab */}
      <path 
        d="M2 14 L2 18 L6 18 L6 14 Z" 
        fill="currentColor"
      />
      <rect x="2.5" y="14.5" width="1.5" height="1.5" fill="white"/>
      
      {/* Truck bed/body */}
      <path 
        d="M6 14 L6 18 L16 18 L18 16 L18 12 L8 12 Z" 
        fill="currentColor"
      />
      
      {/* Material in bed (mounded/heaped) */}
      <path 
        d="M8 12 Q10 10 12 11 Q14 9 16 10 Q17 10 18 12" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        fill="none"
      />
      <path 
        d="M8 12 Q9 11 10 11.5 Q11 10.5 12 11 Q13 10 14 10.5 Q15 9.5 16 10 Q17 9.5 18 12 L18 14 L8 14 Z" 
        fill="currentColor"
        opacity="0.7"
      />
      
      {/* Wheels */}
      <circle cx="4" cy="19" r="1.5" fill="currentColor"/>
      <circle cx="4" cy="19" r="0.8" fill="white"/>
      <circle cx="4" cy="19" r="0.3" fill="currentColor"/>
      
      <circle cx="14" cy="19" r="1.5" fill="currentColor"/>
      <circle cx="14" cy="19" r="0.8" fill="white"/>
      <circle cx="14" cy="19" r="0.3" fill="currentColor"/>
      
      {/* Ground line */}
      <line x1="1" y1="21" x2="20" y2="21" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
    </svg>
  );
}