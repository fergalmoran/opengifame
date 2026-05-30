import Link from "next/link";
import { sharedStyles } from "@/lib/utils";

export function Footer() {
  return (
    <footer className="border-t bg-background/80 backdrop-blur-sm mt-16 relative overflow-hidden">
      {/* Decorative background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-pink-500/5 to-blue-500/5 pointer-events-none"></div>
      
      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="flex flex-col lg:flex-row justify-between items-center gap-4 lg:gap-8">
          <div className="text-center lg:text-left">
            <div className={`text-lg font-bold ${sharedStyles.brandTextAnimated} mb-2`}>
              OpenGIFame
            </div>
            <div className="text-sm text-muted-foreground">
              © 2025 OpenGIFame. All rights reserved. ✨
            </div>
          </div>
          
          {/* Middle section with fun text */}
          <div className="text-center flex-shrink-0">
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Made with 💜 and lots of ☕</p>
              <p className="opacity-75">Keep sharing, keep creating!</p>
            </div>
          </div>
          
          <nav className="flex gap-6 lg:gap-8">
            <Link
              href="/privacy"
              className="text-sm text-muted-foreground hover:text-foreground transition-all duration-300 hover:scale-105 relative group"
            >
              Privacy
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link
              href="/gdpr"
              className="text-sm text-muted-foreground hover:text-foreground transition-all duration-300 hover:scale-105 relative group"
            >
              GDPR
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 group-hover:w-full transition-all duration-300"></span>
            </Link>
            <a
              href="https://github.com/fergalmoran/opengifame"
              target="_blank"
              rel="noopener noreferrer"
              className={`text-sm text-muted-foreground hover:text-foreground transition-all duration-300 hover:scale-105 relative group ${sharedStyles.hoverFunky}`}
            >
              GitHub 🚀
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 group-hover:w-full transition-all duration-300"></span>
            </a>
          </nav>
        </div>
      </div>
      
      {/* Floating decorative elements */}
      <div className="absolute bottom-4 left-4 w-2 h-2 bg-purple-500/30 rounded-full animate-ping"></div>
      <div className="absolute bottom-8 right-8 w-1 h-1 bg-pink-500/40 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
      <div className="absolute bottom-6 right-1/4 w-1.5 h-1.5 bg-blue-500/20 rounded-full animate-ping" style={{ animationDelay: '2s' }}></div>
    </footer>
  );
}
