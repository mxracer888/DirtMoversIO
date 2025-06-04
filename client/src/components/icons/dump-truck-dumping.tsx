interface DumpTruckDumpingProps {
  className?: string;
}

export default function DumpTruckDumping({ className = "h-6 w-6" }: DumpTruckDumpingProps) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Ground line */}
      <line x1="2" y1="20" x2="22" y2="20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      
      {/* Truck cab */}
      <rect x="3" y="14" width="4" height="6" rx="0.5" fill="currentColor"/>
      <rect x="3.5" y="14.5" width="1.5" height="1.5" fill="white"/>
      
      {/* Truck bed (raised/dumping position) */}
      <path 
        d="M7 17 L7 14 L14 10 L16 10 L16 13 L9 17 Z" 
        fill="currentColor"
      />
      
      {/* Material being dumped */}
      <path 
        d="M14 10 Q16 8 18 9 Q19 10 20 12 Q18 13 16 13 Z" 
        fill="currentColor" 
        opacity="0.7"
      />
      
      {/* Small particles falling */}
      <circle cx="17" cy="14" r="0.5" fill="currentColor" opacity="0.6"/>
      <circle cx="18.5" cy="15.5" r="0.3" fill="currentColor" opacity="0.5"/>
      <circle cx="16.2" cy="16" r="0.4" fill="currentColor" opacity="0.4"/>
      
      {/* Wheels */}
      <circle cx="5" cy="18.5" r="1.5" fill="currentColor"/>
      <circle cx="5" cy="18.5" r="0.8" fill="white"/>
      <circle cx="12" cy="18.5" r="1.5" fill="currentColor"/>
      <circle cx="12" cy="18.5" r="0.8" fill="white"/>
    </svg>
  );
}