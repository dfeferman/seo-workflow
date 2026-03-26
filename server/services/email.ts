export interface EmailService {
  sendPasswordReset(to: string, resetUrl: string): Promise<void>
}

// TODO: Replace with a real email provider (e.g. Resend, Nodemailer) before going to production
export const consoleEmailService: EmailService = {
  async sendPasswordReset(to: string, resetUrl: string): Promise<void> {
    console.log(`[EMAIL] Passwort-Reset für ${to}`)
    console.log(`[EMAIL] Reset-URL: ${resetUrl}`)
  },
}
