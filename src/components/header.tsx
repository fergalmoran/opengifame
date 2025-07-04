'use client';

import { signIn, signOut, useSession, getProviders } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, User, LogOut, Github, Mail, AlertCircle } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { OpenGifameLogo } from '@/components/opengifame-logo';
import Link from 'next/link';

interface Provider {
  id: string;
  name: string;
  type: string;
  signinUrl: string;
  callbackUrl: string;
}

export function Header() {
  const { data: session } = useSession();
  const [providers, setProviders] = useState<Record<string, Provider> | null>(null);
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await getProviders();
      setProviders(res);
    })();
  }, []);

  // Reset form state when modal closes
  useEffect(() => {
    if (!isSignInOpen) {
      setCredentials({ email: '', password: '' });
      setError('');
      setIsLoading(false);
    }
  }, [isSignInOpen]);

  const handleSignIn = (providerId: string) => {
    signIn(providerId, { callbackUrl: '/' });
    setIsSignInOpen(false);
  };

  const handleCredentialsSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email: credentials.email,
        password: credentials.password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid credentials. Please check your email and password.');
      } else if (result?.ok) {
        setIsSignInOpen(false);
        setCredentials({ email: '', password: '' });
      }
    } catch (error) {
      console.error('Sign-in error:', error);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getProviderIcon = (providerId: string) => {
    switch (providerId) {
      case 'github':
        return <Github className="h-4 w-4" />;
      case 'google':
        return <Mail className="h-4 w-4" />;
      case 'facebook':
        return (
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
        );
      default:
        return null;
    }
  };

  const getProviderColor = (providerId: string) => {
    switch (providerId) {
      case 'github':
        return 'bg-gray-800 hover:bg-gray-700 text-white';
      case 'google':
        return 'bg-red-600 hover:bg-red-700 text-white';
      case 'facebook':
        return 'bg-blue-600 hover:bg-blue-700 text-white';
      default:
        return 'bg-primary hover:bg-primary/90';
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center space-x-6 flex-shrink-0">
          <Link href="/" className="flex items-center space-x-2">
            <OpenGifameLogo className="h-8 w-8 flex-shrink-0" />
            <span className="text-xl font-bold">OpenGifame</span>
          </Link>

          <nav className="hidden sm:flex items-center space-x-6">
            <Link
              href="/"
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Gallery
            </Link>
            <Link
              href="/trending"
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Trending
            </Link>
          </nav>
        </div>

        <div className="flex items-center space-x-3 flex-shrink-0">
          <ThemeToggle />
          {session ? (
            <>
              <Button asChild size="sm">
                <Link href="/upload">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/profile">
                  <User className="mr-2 h-4 w-4" />
                  {session.user?.name}
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut()}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Dialog open={isSignInOpen} onOpenChange={setIsSignInOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  Sign In
                </Button>
              </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-center">Welcome to OpenGifame</DialogTitle>
                    <p className="text-center text-sm text-muted-foreground">
                      Sign in to share and discover amazing images
                    </p>
                  </DialogHeader>
                  <div className="space-y-6 pt-4">
                    {/* Credentials Form */}
                    <form onSubmit={handleCredentialsSignIn} className="space-y-4">
                      {error && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      )}
                      
                      <div className="space-y-2">
                        <label htmlFor="modal-email" className="text-sm font-medium">
                          Email
                        </label>
                        <Input
                          id="modal-email"
                          type="email"
                          value={credentials.email}
                          onChange={(e) => setCredentials(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="Enter your email"
                          disabled={isLoading}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="modal-password" className="text-sm font-medium">
                          Password
                        </label>
                        <Input
                          id="modal-password"
                          type="password"
                          value={credentials.password}
                          onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                          placeholder="Enter your password"
                          disabled={isLoading}
                          required
                        />
                      </div>

                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? 'Signing in...' : 'Sign In'}
                      </Button>
                    </form>

                    {/* Divider */}
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">
                          Or continue with
                        </span>
                      </div>
                    </div>

                    {/* OAuth Providers */}
                    <div className="space-y-3">
                      {providers ? (
                        Object.values(providers)
                          .filter(provider => provider.id !== 'credentials')
                          .map((provider) => (
                          <Button
                            key={provider.id}
                            onClick={() => handleSignIn(provider.id)}
                            className={`w-full flex items-center justify-center space-x-2 ${getProviderColor(provider.id)}`}
                            variant="default"
                            disabled={isLoading}
                          >
                            {getProviderIcon(provider.id)}
                            <span>Continue with {provider.name}</span>
                          </Button>
                        ))
                      ) : (
                        <div className="space-y-4">
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                          </div>
                          <p className="text-center text-muted-foreground">Loading sign-in options...</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Register Link */}
                    <div className="text-center pt-2">
                      <p className="text-sm text-muted-foreground">
                        Don&apos;t have an account?{' '}
                        <Link 
                          href="/auth/register" 
                          className="text-primary hover:underline font-medium"
                          onClick={() => setIsSignInOpen(false)}
                        >
                          Create one here
                        </Link>
                      </p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
          )}
        </div>
      </div>
    </header>
  );
}
