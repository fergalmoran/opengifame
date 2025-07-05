'use client';

import { signIn, getProviders } from 'next-auth/react';
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Github, Mail, AlertCircle } from 'lucide-react';

interface Provider {
  id: string;
  name: string;
  type: string;
  signinUrl: string;
  callbackUrl: string;
}

function SignInForm() {
  const [providers, setProviders] = useState<Record<string, Provider> | null>(null);
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    (async () => {
      const res = await getProviders();
      setProviders(res);
    })();
    
    // Check for error from URL params
    const errorParam = searchParams.get('error');
    if (errorParam) {
      setError('Invalid credentials. Please try again.');
    }
  }, [searchParams]);

  const handleSignIn = (providerId: string) => {
    signIn(providerId, { callbackUrl: '/' });
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
        router.push('/');
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
        return <Github className="h-5 w-5" />;
      case 'google':
        return <Mail className="h-5 w-5" />;
      case 'facebook':
        return (
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
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
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
          <p className="text-muted-foreground">
            Sign in to your OpenGifame account
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Credentials Form */}
          <form onSubmit={handleCredentialsSignIn} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={credentials.email}
                onChange={(e) => setCredentials(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter your email"
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="password"
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
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link href="/auth/register" className="text-primary hover:underline font-medium">
                Create one here
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SignInPageFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
          <p className="text-muted-foreground">
            Sign in to your OpenGifame account
          </p>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<SignInPageFallback />}>
      <SignInForm />
    </Suspense>
  );
}
