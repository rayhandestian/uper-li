import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: string
      requires2FA?: boolean
    } & DefaultSession['user']
  }

  interface User {
    role: string
    requires2FA?: boolean
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: string
    requires2FA?: boolean
  }
}