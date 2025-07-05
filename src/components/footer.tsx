import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border/50 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 mt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Logo and description */}
          <div className="text-center md:text-left">
            <div className="text-lg font-bold gradient-text mb-2">
              OpenGIFame
            </div>
            <div className="text-sm text-muted-foreground max-w-xs">
              © 2025 OpenGIFame. All rights reserved.
              <br />
              Share, discover, and enjoy amazing images.
            </div>
          </div>
          
          {/* Navigation links */}
          <nav className="flex flex-wrap justify-center gap-6">
            <Link
              href="/privacy"
              className="text-sm text-muted-foreground hover:text-foreground transition-all duration-200 hover-lift relative group"
            >
              Privacy
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 group-hover:w-full transition-all duration-300" />
            </Link>
            <Link
              href="/gdpr"
              className="text-sm text-muted-foreground hover:text-foreground transition-all duration-200 hover-lift relative group"
            >
              GDPR
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 group-hover:w-full transition-all duration-300" />
            </Link>
            <a
              href="https://github.com/fergalmoran/opengifame"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground transition-all duration-200 hover-lift relative group"
            >
              GitHub
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 group-hover:w-full transition-all duration-300" />
            </a>
          </nav>
          
          {/* Fun floating elements */}
          <div className="hidden md:block relative">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-full blur-xl animate-float" />
            <div className="absolute top-2 left-2 w-12 h-12 bg-gradient-to-br from-blue-400/10 to-cyan-400/10 rounded-full blur-lg animate-float stagger-2" />
          </div>
        </div>
        
        {/* Bottom border with gradient */}
        <div className="mt-8 pt-4 border-t border-border/30">
          <div className="text-center text-xs text-muted-foreground">
            Made with ❤️ by the OpenGifame community
          </div>
        </div>
      </div>
    </footer>
  );
}
