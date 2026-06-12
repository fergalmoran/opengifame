import { NextAuthOptions } from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import CredentialsProvider from "next-auth/providers/credentials";
// TODO: Uncomment when database authentication is implemented
// import bcrypt from 'bcryptjs';
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateUniqueUserSlug } from "@/lib/slug-utils";

export const authOptions: NextAuthOptions = {
  adapter: DrizzleAdapter(db),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // TODO: Replace with actual database query once DB is connected
        // const user = await db.select().from(users).where(eq(users.email, credentials.email)).limit(1);

        // For now, return null since we don't have DB connected
        // When DB is ready, verify password with bcrypt.compare(credentials.password, user.password)
        return null;
      },
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID || "",
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET || "",
    }),
  ],
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user && user) {
        session.user.id = user.id;

        // The DrizzleAdapter strips non-standard fields before passing `user`
        // to callbacks, so we must query slug directly from the DB.
        const [row] = await db
          .select({ slug: users.slug })
          .from(users)
          .where(eq(users.id, user.id))
          .limit(1);

        let slug = row?.slug ?? undefined;

        if (!slug) {
          // Backfill for users who existed before slugs were introduced.
          const base = user.name || user.email?.split('@')[0] || 'user';
          slug = await generateUniqueUserSlug(base);
          await db.update(users).set({ slug }).where(eq(users.id, user.id));
        }

        session.user.slug = slug;
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      const base = user.name || user.email?.split('@')[0] || 'user';
      const slug = await generateUniqueUserSlug(base);
      await db.update(users).set({ slug }).where(eq(users.id, user.id));
    },
  },
};
