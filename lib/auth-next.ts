import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// NextAuth v5 se usa SOLO como capa de negociación OAuth con Google (maneja
// el redirect, el intercambio del authorization code y nos entrega un ID
// token verificable). La fuente de verdad de usuarios sigue siendo el
// backend Express: el callback `jwt` de abajo le manda el ID token crudo a
// POST /auth/google-callback, que lo verifica con google-auth-library y
// devuelve nuestro propio JWT — nunca confiamos en next-auth para decidir
// quién es el usuario. La app ya tiene su propio sistema de sesión por
// cookies (lib/auth.tsx); una página puente (app/auth/google/finish) lee
// esta sesión de next-auth una sola vez y la vuelca a ese sistema existente.
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, account }) {
      // Solo se ejecuta con `account` presente en el sign-in inicial (no en
      // refrescos posteriores del JWT de next-auth).
      if (account?.provider === 'google' && account.id_token) {
        try {
          const res = await fetch(`${API_URL}/auth/google-callback`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken: account.id_token }),
          });
          const data = await res.json();

          if (!res.ok) {
            token.backendError = data.error || 'Error al iniciar sesión con Google';
            return token;
          }

          if (data.requiresTwoFactor) {
            token.requiresTwoFactor = true;
            token.tempToken = data.tempToken;
          } else {
            token.backendToken = data.token;
            token.backendRefreshToken = data.refreshToken;
            token.backendUser = data.user;
          }
        } catch (err) {
          console.error('[next-auth] fallo al llamar a /auth/google-callback:', err);
          token.backendError = 'No se pudo conectar con el servidor';
        }
      }
      return token;
    },
    async session({ session, token }) {
      (session as any).backendToken = token.backendToken;
      (session as any).backendRefreshToken = token.backendRefreshToken;
      (session as any).backendUser = token.backendUser;
      (session as any).requiresTwoFactor = token.requiresTwoFactor;
      (session as any).tempToken = token.tempToken;
      (session as any).backendError = token.backendError;
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
});
