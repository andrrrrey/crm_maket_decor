import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import type { NextAuthConfig } from "next-auth";
import type { JWT } from "next-auth/jwt";

export const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        login: { label: "Логин", type: "text" },
        password: { label: "Пароль", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.login || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { login: credentials.login as string },
        });

        if (!user || !user.isActive) {
          return null;
        }

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          login: user.login,
          avatarUrl: user.avatarUrl,
          wallpaper: user.wallpaper,
          theme: user.theme,
          hasInfoAccess: user.hasInfoAccess,
        };
      },
    }),
  ],
  callbacks: {
    authorized({ auth: session }) {
      // Проверяем наличие реальных данных пользователя, а не просто наличие сессии
      return !!session?.user?.email;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.login = (user as any).login;
        token.avatarUrl = (user as any).avatarUrl;
        token.wallpaper = (user as any).wallpaper;
        token.theme = (user as any).theme;
        token.hasInfoAccess = (user as any).hasInfoAccess;
      } else if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { hasInfoAccess: true, isActive: true },
        });
        if (!dbUser || !dbUser.isActive) return null as unknown as JWT;
        token.hasInfoAccess = dbUser.hasInfoAccess;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role;
        (session.user as any).login = token.login;
        (session.user as any).avatarUrl = token.avatarUrl;
        (session.user as any).wallpaper = token.wallpaper;
        (session.user as any).theme = token.theme;
        (session.user as any).hasInfoAccess = token.hasInfoAccess;
      }
      return session;
    },
  },
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 дней
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
