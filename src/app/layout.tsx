import type {Metadata} from "next";
import {Geist, Geist_Mono, Outfit} from "next/font/google";
import "./globals.css";
import {AuthProvider} from '@/components/auth-provider';
import {ThemeProvider} from '@/components/theme-provider';
import {PasteUploadProvider} from '@/components/paste-upload-provider';
import {Header} from '@/components/header';
import {Footer} from '@/components/footer';
import {cn} from "@/lib/utils";

const outfit = Outfit({subsets: ['latin'], variable: '--font-sans'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OpenGifame - Share and Discover Images",
  description: "An open-source image sharing platform similar to Imgur",
  icons: {
    icon: [
      {url: '/favicon.ico', sizes: '32x32', type: 'image/x-icon'},
      {url: '/favicon.svg', type: 'image/svg+xml'}
    ],
    apple: [
      {url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png'}
    ]
  },
};

export default function RootLayout({
                                     children,
                                   }: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={cn("font-sans", outfit.variable)}>
    <head>
      {/* Apply the stored/system theme before paint to avoid a flash of the wrong theme. */}
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){try{var t=localStorage.getItem('theme');var d=t==='dark'||((t===null||t==='system')&&window.matchMedia('(prefers-color-scheme: dark)').matches);var r=document.documentElement;r.classList.toggle('dark',d);r.style.colorScheme=d?'dark':'light';}catch(e){}})();`,
        }}
      />
    </head>
    <body
      className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
    >
    <ThemeProvider>
      <AuthProvider>
        <PasteUploadProvider>
          <Header/>
          <main className="grow">{children}</main>
          <Footer/>
        </PasteUploadProvider>
      </AuthProvider>
    </ThemeProvider>
    </body>
    </html>
  );
}
