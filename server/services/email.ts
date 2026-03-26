// server/services/email.ts
export interface EmailService {
  sendPasswordReset(to: string, resetUrl: string): Promise<void>
}

export const consoleEmailService: EmailService = {
  async sendPasswordReset(to: string, resetUrl: string): Promise<void> {
    console.log(`[EMAIL] Passwort-Reset für ${to}`)
    console.log(`[EMAIL] Reset-URL: ${resetUrl}`)
  },
}
