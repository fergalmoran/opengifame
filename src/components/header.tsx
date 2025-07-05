'use client';

import { signIn, signOut, useSession, getProviders } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, User, LogOut, Github, Mail, AlertCircle, ChevronDown } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { OpenGifameLogo } from '@/components/opengifame-logo';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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

  const getUserInitials = (name?: string | null) => {
    if (!name) return 'U';
    
    const names = name.trim().split(' ');
    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase();
    }
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  const getUserAvatarColor = (name?: string | null) => {
    if (!name) return 'bg-gray-500';
    
    // Generate a consistent color based on the username
    const colors = [
      'bg-red-500',
      'bg-blue-500', 
      'bg-green-500',
      'bg-purple-500',
      'bg-yellow-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-teal-500',
      'bg-orange-500',
      'bg-cyan-500'
    ];
    
    // Simple hash function to get consistent color for same name
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center space-x-6 flex-shrink-0">
          <Link href="/" className="flex items-center space-x-2 group">
            <OpenGifameLogo className="h-8 w-8 flex-shrink-0 transition-transform duration-200 group-hover:scale-105" />
            <span className="text-xl font-bold">OpenGifame</span>
          </Link>
        </div>

        {/* Upload Button - Center */}
        {session && (
          <div className="absolute left-1/2 transform -translate-x-1/2">
            <Button asChild className="bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 hover:from-purple-600 hover:via-pink-600 hover:to-red-600 text-white font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 border-0">
              <Link href="/upload">
                <Upload className="mr-2 h-4 w-4" />
                Upload
              </Link>
            </Button>
          </div>
        )}

        <div className="flex items-center space-x-3 flex-shrink-0">
          <ThemeToggle />
          {session ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center space-x-1 p-1">
                    <Avatar className="h-8 w-8 border-2 border-border bg-background">
                      <AvatarImage src={session.user?.image || undefined} alt="Profile" />
                      <AvatarFallback className={`${getUserAvatarColor(session.user?.name)} text-white`}>
                        {getUserInitials(session.user?.name)}
                      </AvatarFallback>
                    </Avatar>
                    <ChevronDown className="h-3 w-3 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => signOut()}
                    className="flex items-center text-red-600 focus:text-red-600"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
          ) : (
            <Dialog open={isSignInOpen} onOpenChange={setIsSignInOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="hover:bg-accent hover:text-accent-foreground">
                  Sign In
                </Button>
              </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-center text-2xl font-semibold">Welcome to OpenGifame</DialogTitle>
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
