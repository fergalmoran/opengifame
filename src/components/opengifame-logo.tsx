export function OpenGifameLogo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 32 32" 
      width="32"
      height="32"
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background circle */}
      <circle 
        cx="16" 
        cy="16" 
        r="15" 
        fill="#3B82F6" 
        stroke="#2563EB" 
        strokeWidth="2"
      />
      
      {/* Camera/Gallery icon */}
      <g transform="translate(6, 8)">
        {/* Camera body */}
        <rect 
          x="2" 
          y="4" 
          width="16" 
          height="12" 
          rx="2" 
          fill="white" 
          opacity="0.95"
        />
        
        {/* Camera lens outer */}
        <circle 
          cx="10" 
          cy="10" 
          r="3.5" 
          fill="none" 
          stroke="#3B82F6" 
          strokeWidth="1.5"
        />
        
        {/* Camera lens inner */}
        <circle 
          cx="10" 
          cy="10" 
          r="2" 
          fill="#3B82F6"
        />
        
        {/* Camera viewfinder */}
        <rect 
          x="4" 
          y="2" 
          width="4" 
          height="2" 
          rx="1" 
          fill="white" 
          opacity="0.95"
        />
        
        {/* Gallery indicator (small rectangles) */}
        <rect 
          x="14.5" 
          y="5.5" 
          width="2" 
          height="1.5" 
          rx="0.3" 
          fill="#3B82F6" 
          opacity="0.6"
        />
        <rect 
          x="14.5" 
          y="7.5" 
          width="2" 
          height="1.5" 
          rx="0.3" 
          fill="#3B82F6" 
          opacity="0.8"
        />
        <rect 
          x="14.5" 
          y="9.5" 
          width="2" 
          height="1.5" 
          rx="0.3" 
          fill="#3B82F6"
        />
      </g>
    </svg>
  );
}
