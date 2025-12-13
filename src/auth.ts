import NextAuth, { NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import FacebookProvider from "next-auth/providers/facebook"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { UserRole } from "@/types/enums"
import { linkUserToInvitees } from "@/lib/invitee-linking"
import { getBaseUrl } from "@/lib/utils"

// Build providers array conditionally
const providers: any[] = []

// Add Google provider if credentials are available
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "consent", // Force consent screen to show every time
          access_type: "offline",
          response_type: "code",
        },
      },
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
          scope: "public_profile,user_friends",
          // Add auth_type for better mobile handling
          auth_type: "rerequest",
          // Ensure proper redirect handling on mobile
          display: "page",
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

      const email = credentials.email as string
      const password = credentials.password as string

      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          role: true,
          passwordHash: true,
        },
      })

      if (!user || !user.passwordHash) {
        throw new Error("Invalid email or password")
      }

      const isValid = await bcrypt.compare(
        password,
        user.passwordHash
      )

      if (!isValid) {
        throw new Error("Invalid email or password")
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        role: user.role as UserRole,
      }
    },
  })
)

// Ensure secret is available
const authSecret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET

// Validate secret before creating config
if (!authSecret || authSecret.length < 32) {
  const error = new Error('AUTH_SECRET or NEXTAUTH_SECRET must be set and at least 32 characters')
  console.error('[AUTH CONFIG] ❌', error.message)
  throw error
}

console.error('[AUTH CONFIG] ✅ Auth secret is configured (length:', authSecret.length, 'chars)')
console.error('[AUTH CONFIG] Secret source:', process.env.AUTH_SECRET ? 'AUTH_SECRET' : 'NEXTAUTH_SECRET')

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers,
  secret: authSecret,
  // Remove trustHost for v4 - it's not needed
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
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! },
            select: {
              id: true,
              email: true,
              name: true,
              image: true,
              emailVerified: true,
              accounts: {
                where: {
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                },
                select: {
                  id: true,
                  provider: true,
                  providerAccountId: true,
                },
              },
            },
          })
          
          if (existingUser) {
            const isAccountLinked = existingUser.accounts.length > 0
            
            if (!isAccountLinked) {
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
                if (linkError.code !== 'P2002') {
                  console.error('Error linking account:', linkError)
                }
              }
            }
            
            user.id = existingUser.id
            return true
          }
          
          // If linkUserId is provided (from linking flow)
          if (linkUserId) {
            try {
              const targetUser = await prisma.user.findUnique({
                where: { id: linkUserId },
                select: {
                  id: true,
                  email: true,
                  name: true,
                  image: true,
                },
              })
              
              if (targetUser) {
                const existingAccount = await prisma.account.findFirst({
                  where: {
                    userId: linkUserId,
                    provider: account.provider,
                    providerAccountId: account.providerAccountId,
                  }
                })
                
                if (!existingAccount) {
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
                  
                  await prisma.user.update({
                    where: { id: linkUserId },
                    data: {
                      ...(user.name && !targetUser.name && { name: user.name }),
                      ...(user.image && !targetUser.image && { image: user.image }),
                    }
                  })
                  
                  console.log(`✅ Linked ${account.provider} account (${user.email}) to user ${linkUserId} (${targetUser.email}) via linking flow`)
                  
                  user.id = linkUserId
                  ;(user as any).redirectPath = redirectPath
                  return true
                } else {
                  user.id = linkUserId
                  ;(user as any).redirectPath = redirectPath
                  return true
                }
              }
            } catch (linkError: any) {
              console.error('Error linking account to user:', linkError)
            }
          }
          
          // Check if this OAuth account is already linked to another user
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
            console.log(`ℹ️  ${account.provider} account already linked to user ${existingAccount.userId} (${existingAccount.user.email}), using existing account`)
            user.id = existingAccount.userId
            return true
          }
          
          console.log(`🆕 Creating new user account for ${user.email} via ${account.provider}`)
          return true
        } catch (error) {
          console.error('Error in signIn callback:', error)
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
        (session.user as any).id = token.id as string
        ;(session.user as any).role = token.role as UserRole
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      const normalizedBaseUrl = getBaseUrl()
      
      // Handle send-invitations redirects (from account linking flow)
      if (url.includes('send-invitations')) {
        const separator = url.includes('?') ? '&' : '?'
        return url.startsWith("/") ? `${normalizedBaseUrl}${url}${separator}facebook_linked=true` : `${url}${separator}facebook_linked=true`
      }
      
      // For mobile OAuth callbacks, ensure we use window.location for proper redirect
      // This helps with mobile browser redirect handling
      if (url.startsWith("/")) {
        const fullUrl = `${normalizedBaseUrl}${url}`
        // Return the full URL to ensure proper mobile redirect
        return fullUrl
      }
      
      // Allows callback URLs on the same origin
      if (url.startsWith(normalizedBaseUrl)) {
        return url
      }
      
      // Fallback to base URL
      return normalizedBaseUrl
    },
  },
}

export default NextAuth(authOptions)
