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
          scope: "public_profile,email,user_friends", // Added user_friends for friends access
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
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) {
        throw new Error("Email and password required")
      }

      const user = await prisma.user.findUnique({
        where: { email: credentials.email },
      })

      if (!user || !user.password) {
        throw new Error("Invalid email or password")
      }

      const isValid = await bcrypt.compare(
        credentials.password,
        user.password
      )

      if (!isValid) {
        throw new Error("Invalid email or password")
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        role: user.role,
      }
    },
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
          // Check if this is a linking request (from the link API)
          // Facebook passes state in the account object
          const state = (account as any).state
          let linkUserId: string | null = null
          let redirectPath: string | null = null
          
          if (state) {
            try {
              const decodedState = JSON.parse(Buffer.from(state, 'base64').toString())
              if (decodedState.link && decodedState.userId) {
                linkUserId = decodedState.userId
                redirectPath = decodedState.redirect || '/dashboard'
              }
            } catch (e) {
              // State parsing failed, continue normally
            }
          }

          // ALWAYS check if user exists with this email first
          // This prevents duplicate accounts when user signs in with different OAuth providers
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
            // User exists with this email - check if this OAuth account is already linked
            const isAccountLinked = existingUser.accounts.length > 0
            
            if (!isAccountLinked) {
              // Link the OAuth account to existing user
              // This prevents OAuthAccountNotLinked error and duplicate accounts
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
                
                console.log(`✅ Linked ${account.provider} account to existing user ${existingUser.email}`)
              } catch (linkError: any) {
                // If account already exists (race condition), that's fine
                if (linkError.code !== 'P2002') {
                  console.error('Error linking account:', linkError)
                }
              }
            }
            
            // Update user object to use existing user ID
            // This tells NextAuth to use the existing user instead of creating a new one
            user.id = existingUser.id
            return true
          }
          
          // If linkUserId is provided (from linking flow), link to that user instead of creating new
          // This allows linking even when emails don't match (user's Facebook email may differ)
          if (linkUserId) {
            try {
              const targetUser = await prisma.user.findUnique({
                where: { id: linkUserId },
              })
              
              if (targetUser) {
                // Check if account already linked
                const existingAccount = await prisma.account.findFirst({
                  where: {
                    userId: linkUserId,
                    provider: account.provider,
                    providerAccountId: account.providerAccountId,
                  }
                })
                
                if (!existingAccount) {
                  // Link account to target user (even if emails don't match)
                  // This is intentional - user explicitly requested linking via "Connect Facebook" button
                  await prisma.account.create({
                    data: {
                      userId: linkUserId,
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
                  
                  // Update user info if Facebook email is different but user wants to keep it
                  // We don't change the primary email, but we note the Facebook email
                  await prisma.user.update({
                    where: { id: linkUserId },
                    data: {
                      ...(user.name && !targetUser.name && { name: user.name }),
                      ...(user.image && !targetUser.image && { image: user.image }),
                    }
                  })
                  
                  console.log(`✅ Linked ${account.provider} account (${user.email}) to user ${linkUserId} (${targetUser.email}) via linking flow - emails differ but linking requested`)
                  
                  // Update user object to use target user ID
                  user.id = linkUserId
                  // Store redirect path for later use
                  ;(user as any).redirectPath = redirectPath
                  return true
                } else {
                  // Account already linked
                  user.id = linkUserId
                  ;(user as any).redirectPath = redirectPath
                  return true
                }
              }
            } catch (linkError: any) {
              console.error('Error linking account to user:', linkError)
              // Fall through to normal flow
            }
          }
          
          // If no existing user found by email, check if this Facebook account is already linked to another user
          // This prevents the same Facebook account from being linked to multiple users
          const existingAccount = await prisma.account.findFirst({
            where: {
              provider: account.provider,
              providerAccountId: account.providerAccountId,
            },
            include: {
              user: true,
            }
          })
          
          if (existingAccount) {
            // This Facebook account is already linked to a different user
            // Use that user's account instead of creating a new one
            console.log(`ℹ️  ${account.provider} account already linked to user ${existingAccount.userId} (${existingAccount.user.email}), using existing account`)
            user.id = existingAccount.userId
            return true
          }
          
          // User doesn't exist - adapter will create user and account
          // This is the first time this user is signing in with this OAuth provider
          console.log(`🆕 Creating new user account for ${user.email} via ${account.provider}`)
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
        
        // Store redirect path if present (for account linking)
        if ((user as any).redirectPath) {
          token.redirectPath = (user as any).redirectPath
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
    async redirect({ url, baseUrl, token }) {
      // Handle linking redirects (from account linking flow)
      // Check if we have a redirectPath stored in token (from account linking)
      if (token && (token as any).redirectPath) {
        const redirectPath = (token as any).redirectPath
        // Add success parameter for linking
        const separator = redirectPath.includes('?') ? '&' : '?'
        return `${baseUrl}${redirectPath}${separator}facebook_linked=true`
      }
      
      // Handle send-invitations redirects
      if (url.includes('send-invitations')) {
        // Add success parameter for linking
        const separator = url.includes('?') ? '&' : '?'
        return url.startsWith("/") ? `${baseUrl}${url}${separator}facebook_linked=true` : `${url}${separator}facebook_linked=true`
      }
      
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    },
    async redirect({ url, baseUrl }) {
      // Handle linking redirects (from account linking flow)
      if (url.includes('send-invitations') || url.includes('facebook_linked=true')) {
        return url.startsWith("/") ? `${baseUrl}${url}` : url
      }
      
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    },
  },
} satisfies NextAuthConfig

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)
