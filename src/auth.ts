import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

export const { handlers, signIn, signOut, auth } = NextAuth({
  // Note: Don't use PrismaAdapter with Credentials provider + JWT strategy
  // The adapter is only needed for OAuth providers that need to store accounts
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            console.log("[Auth] Missing credentials");
            return null;
          }

          console.log("[Auth] Looking up user:", credentials.email);

          const user = await prisma.user.findUnique({
            where: { email: credentials.email as string },
            include: {
              regionAccess: {
                include: {
                  region: true,
                },
              },
            },
          });

          if (!user) {
            console.log("[Auth] User not found");
            return null;
          }

          if (!user.password) {
            console.log("[Auth] User has no password");
            return null;
          }

          if (!user.isActive) {
            console.log("[Auth] User is not active");
            return null;
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password as string,
            user.password
          );

          if (!isPasswordValid) {
            console.log("[Auth] Invalid password");
            return null;
          }

          // Update last login time (don't await to speed up login)
          prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
          }).catch(console.error);

          console.log("[Auth] Login successful for:", user.email);

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            regionAccess: user.regionAccess.map((ra) => ra.region.code),
          };
        } catch (error) {
          console.error("[Auth] Error during authorization:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.regionAccess = (user as any).regionAccess;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.regionAccess = token.regionAccess as string[];
      }
      return session;
    },
  },
});

// Type extensions for NextAuth
declare module "next-auth" {
  interface User {
    role?: string;
    regionAccess?: string[];
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      role: string;
      regionAccess: string[];
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    regionAccess?: string[];
  }
}
