'use client';
import React, { FormEventHandler } from 'react';
import { SocialLogin } from '@components';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';

const SignInPage = () => {
  const router = useRouter();
  const [userInfo, setUserInfo] = React.useState({
    email: '',
    password: '',
  });
  const handleSubmit: FormEventHandler<HTMLFormElement> = async (e) => {
    //TODO: validation
    e.preventDefault();
    const res = await signIn('credentials', {
      email: userInfo.email,
      password: userInfo.password,
      redirect: false,
    });
    if (res?.status === 200) {
      router.replace('/');
    }
    console.log('signin', 'handleSubmit', res);
  };
  return (
    <div className="flex flex-col justify-center min-h-full py-1 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-2 text-3xl font-extrabold text-center ">
          Sign in to your account
        </h2>
        <p className="mt-2 text-sm text-center ">
          Or{' '}
          <Link
            href="/auth/signup"
            className="font-medium "
          >
            create a new account
          </Link>
        </p>
      </div>

      <div className="mt-2 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="px-4 py-8 shadow sm:rounded-lg sm:px-10">
          <form
            className="space-y-6"
            onSubmit={handleSubmit}
            method="post"
          >
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium "
              >
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={userInfo.email}
                  onChange={({ target }) =>
                    setUserInfo({ ...userInfo, email: target.value })
                  }
                  className="w-full input input-bordered"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium "
              >
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={userInfo.password}
                  onChange={({ target }) =>
                    setUserInfo({ ...userInfo, password: target.value })
                  }
                  className="w-full input input-bordered"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="w-4 h-4"
                />
                <label
                  htmlFor="remember-me"
                  className="block ml-2 text-sm text-accent"
                >
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a
                  href="#"
                  className="font-medium text-info hover:text-primary/50"
                >
                  Forgot your password?
                </a>
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="w-full btn btn-primary"
              >
                Sign in
              </button>
            </div>
          </form>

          <div className="mt-6">
            <SocialLogin />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignInPage;
