export interface EmailService {
  sendPasswordReset(to: string, resetUrl: string): Promise<void>
}

export const consoleEmailService: EmailService = {
  async sendPasswordReset(to: string, resetUrl: string): Promise<void> {
    console.log(`[EMAIL] Passwort-Reset fuer ${to}`)
    console.log(`[EMAIL] Reset-URL: ${resetUrl}`)
  },
}

type ResendRequestBody = {
  from: string
  to: string[]
  subject: string
  html: string
  text: string
}

class ResendEmailService implements EmailService {
  constructor(
    private readonly apiKey: string,
    private readonly from: string
  ) {}

  async sendPasswordReset(to: string, resetUrl: string): Promise<void> {
    const body: ResendRequestBody = {
      from: this.from,
      to: [to],
      subject: 'Passwort zuruecksetzen',
      text: `Du kannst dein Passwort hier zuruecksetzen: ${resetUrl}`,
      html: `<p>Du kannst dein Passwort hier zuruecksetzen:</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`Resend request failed: ${response.status} ${text}`)
    }
  }
}

export function createEmailService(): EmailService {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  const from = process.env.EMAIL_FROM?.trim()

  if (apiKey && from) {
    return new ResendEmailService(apiKey, from)
  }

  return consoleEmailService
}

export const emailService = createEmailService()
