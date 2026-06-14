import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t bg-background/80 backdrop-blur-sm mt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row justify-between items-center gap-4 lg:gap-8">
          <div className="text-center lg:text-left">
            <div className="text-lg font-bold mb-2">OpenGifame</div>
            <div className="text-sm text-muted-foreground">
              © 2025 OpenGifame. All rights reserved.
            </div>
          </div>

          <div className="text-center shrink-0">
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Made with care and lots of coffee</p>
              <p>Keep sharing, keep creating!</p>
            </div>
          </div>

          <nav className="flex gap-6 lg:gap-8">
            <Link
              href="/privacy"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/gdpr"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              GDPR
            </Link>
            <a
              href="https://github.com/fergalmoran/opengifame"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              GitHub
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
