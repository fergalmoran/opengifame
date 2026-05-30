export function OpenGifameLogo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <div className={`${className} relative animate-float`}>
      <svg 
        className="w-full h-full drop-shadow-lg" 
        viewBox="0 0 32 32" 
        width="32"
        height="32"
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Gradient definitions */}
        <defs>
          <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="50%" stopColor="#EC4899" />
            <stop offset="100%" stopColor="#06B6D4" />
          </linearGradient>
          <linearGradient id="cameraGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#EF4444" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Glowing background circle */}
        <circle 
          cx="16" 
          cy="16" 
          r="15" 
          fill="url(#bgGradient)" 
          stroke="#3B82F6" 
          strokeWidth="2"
          filter="url(#glow)"
          className="animate-pulse-glow"
        />
        
        {/* Camera/Gallery icon */}
        <g transform="translate(6, 8)">
          {/* Camera body with gradient */}
          <rect 
            x="2" 
            y="4" 
            width="16" 
            height="12" 
            rx="2" 
            fill="white" 
            opacity="0.95"
            stroke="url(#cameraGradient)"
            strokeWidth="0.5"
          />
          
          {/* Camera lens outer - animated */}
          <circle 
            cx="10" 
            cy="10" 
            r="3.5" 
            fill="none" 
            stroke="url(#cameraGradient)" 
            strokeWidth="1.5"
            className="animate-rainbow-border"
          />
          
          {/* Camera lens inner with gradient */}
          <circle 
            cx="10" 
            cy="10" 
            r="2" 
            fill="url(#bgGradient)"
          />
          
          {/* Camera viewfinder with glow */}
          <rect 
            x="4" 
            y="2" 
            width="4" 
            height="2" 
            rx="1" 
            fill="white" 
            opacity="0.95"
            stroke="url(#cameraGradient)"
            strokeWidth="0.3"
          />
          
          {/* Gallery indicator with animated colors */}
          <rect 
            x="14.5" 
            y="5.5" 
            width="2" 
            height="1.5" 
            rx="0.3" 
            fill="#8B5CF6" 
            opacity="0.6"
            className="animate-pulse"
          />
          <rect 
            x="14.5" 
            y="7.5" 
            width="2" 
            height="1.5" 
            rx="0.3" 
            fill="#EC4899" 
            opacity="0.8"
            className="animate-pulse"
            style={{ animationDelay: '0.2s' }}
          />
          <rect 
            x="14.5" 
            y="9.5" 
            width="2" 
            height="1.5" 
            rx="0.3" 
            fill="#06B6D4"
            className="animate-pulse"
            style={{ animationDelay: '0.4s' }}
          />
        </g>
      </svg>
    </div>
  );
}
