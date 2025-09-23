import { AuthOptions } from 'next-auth'

async function buildAuthOptions(): Promise<AuthOptions> {
  const GoogleProvider = (await import('next-auth/providers/google')).default
  const CredentialsProvider = (await import('next-auth/providers/credentials')).default
  const { DrizzleAdapter } = await import('@auth/drizzle-adapter')
  const { compare } = await import('bcryptjs')
  const { eq } = await import('drizzle-orm')
  const { db } = await import('@/lib/db')
  const { users, accounts, sessions, verificationTokens } = await import('@/lib/db/schema')

  const providers: AuthOptions['providers'] = []

  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    providers.push(
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID as string,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      })
    )
  }

  providers.push(
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { type: 'text' },
        password: { type: 'text' },
      },
      async authorize(credentials: { email?: string; password?: string } | undefined) {
        if (!credentials?.email || !credentials?.password) return null

        try {
          const userResult = await db
            .select()
            .from(users)
            .where(eq(users.email, credentials.email))
            .limit(1)

          const user = userResult[0]
          if (!user || !user.hashed_password) return null

          const isPasswordValid = await compare(credentials.password, user.hashed_password)
          if (!isPasswordValid) return null

          return { id: user.id, email: user.email, name: user.name, image: user.image }
        } catch {
          // swallow and return null — auth simply fails
          return null
        }
      },
    })
  )

  const adapter = DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  })

  const authOptions: AuthOptions = {
    adapter,
    session: {
      strategy: 'jwt',
      maxAge: 30 * 24 * 60 * 60,
      updateAge: 24 * 60 * 60,
    },
    providers,
    callbacks: {
      jwt: async ({ token, user }) => {
        if (user && typeof (user as { id?: string }).id === 'string') token.id = (user as { id?: string }).id
        return token
      },
      session: async ({ session, token }) => {
        if (session?.user && token?.id) session.user.id = token.id as string
        return session
      },
      redirect: async ({ url, baseUrl }) => {
        if (url.startsWith('/')) return `${baseUrl}${url}`
        if (new URL(url).origin === baseUrl) return url
        return `${baseUrl}/dashboard`
      },
    },
    pages: {
      signIn: '/',
    },
  }

  return authOptions
}

export const authOptions: AuthOptions = await buildAuthOptions()