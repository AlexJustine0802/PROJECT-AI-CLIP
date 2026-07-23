import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import GitHub from 'next-auth/providers/github';

/**
 * Auth.js (NextAuth v5) — self-hosted. Credentials + Google + GitHub. Sessions are JWTs
 * signed with AUTH_SECRET; the API validates the same HS256 token (see apps/api JwtAuthGuard).
 * Email verification / password reset use the email provider (SMTP) in production.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: 'jwt' },
  secret: process.env.AUTH_SECRET,
  pages: { signIn: '/login' },
  providers: [
    Google({ clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET }),
    GitHub({ clientId: process.env.GITHUB_CLIENT_ID, clientSecret: process.env.GITHUB_CLIENT_SECRET }),
    Credentials({
      name: 'Credentials',
      credentials: { email: {}, password: {} },
      async authorize(creds) {
        // Delegate credential verification to the API so hashing/2FA live in one place.
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/login`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ email: creds?.email, password: creds?.password }),
        });
        if (!res.ok) return null;
        const data = (await res.json()) as { token: string; userId: string };
        return { id: data.userId, email: String(creds?.email), apiToken: data.token } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user && (user as any).apiToken) token.apiToken = (user as any).apiToken;
      return token;
    },
    async session({ session, token }) {
      (session as any).apiToken = token.apiToken;
      return session;
    },
  },
});
