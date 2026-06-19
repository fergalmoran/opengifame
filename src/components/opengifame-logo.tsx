export function OpenGifameLogo({className = "h-8 w-8"}: { className?: string }) {
  return (
    <div className={`${className} relative`}>
      <svg
        className="w-full h-full"
        viewBox="0 0 32 32"
        width="32"
        height="32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Glowing background circle */}
        <circle
          cx="16"
          cy="16"
          r="15"
          className="fill-primary"
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
            className="fill-primary-foreground"
          />

          {/* Camera lens outer */}
          <circle
            cx="10"
            cy="10"
            r="3.5"
            fill="none"
            strokeWidth="1.5"
            className="stroke-primary"
          />

          {/* Camera lens inner */}
          <circle
            cx="10"
            cy="10"
            r="2"
            className="fill-primary"
          />

          {/* Camera viewfinder */}
          <rect
            x="4"
            y="2"
            width="4"
            height="2"
            rx="1"
            className="fill-primary-foreground"
          />

          {/* Gallery indicators */}
          <rect x="14.5" y="5.5" width="2" height="1.5" rx="0.3" className="fill-primary opacity-60"/>
          <rect x="14.5" y="7.5" width="2" height="1.5" rx="0.3" className="fill-primary opacity-80"/>
          <rect x="14.5" y="9.5" width="2" height="1.5" rx="0.3" className="fill-primary"/>
        </g>
      </svg>
    </div>
  );
}
