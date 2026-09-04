import { createAuthClient } from 'better-auth/react'
import { jwtClient } from 'better-auth/client/plugins'

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_NEON_AUTH_URL || 'https://ep-billowing-bread-azc1ckap.neonauth.c-3.ap-southeast-1.aws.neon.tech/neondb/auth',
  plugins: [jwtClient()],
  fetchOptions: {
    credentials: 'include',
  },
})

