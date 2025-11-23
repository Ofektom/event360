import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import FacebookProvider from "next-auth/providers/facebook"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import type { NextAuthConfig } from "next-auth"
import { UserRole } from "@/types/enums"
import { linkUserToInvitees } from "@/lib/invitee-linking"

// Build providers array conditionally
const providers = []

// Add Google provider if credentials are available
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  )
}

// Add Facebook provider if credentials are available
if (process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET) {
  providers.push(
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
      authorization: {
        params: {
          scope: "public_profile", // Email is automatically included, don't request it as a scope
        },
      },
    })
  )
}

// Always add credentials provider
providers.push(
  CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required")
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string }
        })

        if (!user || !user.passwordHash) {
          throw new Error("Invalid email or password")
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        )

        if (!isPasswordValid) {
          throw new Error("Invalid email or password")
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role as UserRole,
        }
      }
    })
)

export const authConfig = {
  adapter: PrismaAdapter(prisma) as any,
  providers,
  trustHost: true, // Required for Vercel deployment
  pages: {
    signIn: "/auth/signin",
    signOut: "/auth/signout",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // For OAuth providers, handle account linking
      if (account?.provider !== 'credentials' && user?.email && account) {
        try {
          // Check if user exists with this email
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
            include: {
              accounts: {
                where: {
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                }
              }
            }
          })
          
          if (existingUser) {
            // User exists - check if this OAuth account is already linked
            const isAccountLinked = existingUser.accounts.length > 0
            
            if (!isAccountLinked) {
              // Link the OAuth account to existing user
              // This prevents OAuthAccountNotLinked error
              try {
                await prisma.account.create({
                  data: {
                    userId: existingUser.id,
                    type: account.type || 'oauth',
                    provider: account.provider,
                    providerAccountId: account.providerAccountId,
                    access_token: account.access_token,
                    expires_at: account.expires_at,
                    token_type: account.token_type,
                    scope: account.scope,
                    id_token: account.id_token,
                    refresh_token: account.refresh_token,
                    session_state: typeof account.session_state === 'string' ? account.session_state : null,
                  }
                })
                
                // Update user info if needed
                await prisma.user.update({
                  where: { id: existingUser.id },
                  data: {
                    ...(user.name && !existingUser.name && { name: user.name }),
                    ...(user.image && !existingUser.image && { image: user.image }),
                    ...(!existingUser.emailVerified && { emailVerified: new Date() }),
                  }
                })
              } catch (linkError: any) {
                // If account already exists (race condition), that's fine
                if (linkError.code !== 'P2002') {
                  console.error('Error linking account:', linkError)
                }
              }
            }
            
            // Update user object to use existing user ID
            // This tells NextAuth to use the existing user
            user.id = existingUser.id
            return true
          }
          
          // User doesn't exist - adapter will create user and account
          return true
        } catch (error) {
          console.error('Error in signIn callback:', error)
          // Allow sign in - adapter will handle user creation
          return true
        }
      }
      return true
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id
        // Get user role from database for OAuth users
        if (account?.provider !== 'credentials' && user.email) {
          try {
            const dbUser = await prisma.user.findUnique({
              where: { email: user.email },
              select: { role: true, phone: true }
            })
            token.role = (dbUser?.role as UserRole) || UserRole.USER
            
            // Auto-link user to invitees after authentication
            if (dbUser && user.id) {
              try {
                await linkUserToInvitees(user.id, user.email, dbUser.phone || undefined)
              } catch (linkError) {
                // Non-critical error, log but don't fail auth
                console.error('Error auto-linking invitees:', linkError)
              }
            }
          } catch (error) {
            token.role = UserRole.USER
          }
        } else {
          token.role = (user as any).role as UserRole || UserRole.USER
          
          // Auto-link for credentials provider
          if (user.id && user.email) {
            try {
              const dbUser = await prisma.user.findUnique({
                where: { id: user.id },
                select: { phone: true }
              })
              await linkUserToInvitees(user.id, user.email, dbUser?.phone || undefined)
            } catch (linkError) {
              console.error('Error auto-linking invitees:', linkError)
            }
          }
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as UserRole
      }
      return session
    },
  },
} satisfies NextAuthConfig

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)

