import {DefaultSession} from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      slug?: string;
      permissions: number;
    } & DefaultSession['user'];
  }

  interface User {
    slug?: string;
    permissions?: number;
  }
}
