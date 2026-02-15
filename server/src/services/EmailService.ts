import { Resend } from 'resend';

class EmailService {
    private resend: Resend | null = null;
    private fromAddress = 'Sentari <onboarding@resend.dev>';

    constructor() {
        const apiKey = process.env.RESEND_API_KEY;
        if (apiKey) {
            this.resend = new Resend(apiKey);
            console.log('[EmailService] Initialized with Resend');
        } else {
            console.warn('[EmailService] No RESEND_API_KEY — emails will be logged only');
        }
    }

    /**
     * Send welcome email when someone joins the founding circle waitlist
     */
    async sendWelcomeEmail(email: string, queueNumber: number): Promise<void> {
        const subject = `Welcome to the Founding Circle — You're #${queueNumber}`;
        const html = this.buildTemplate({
            heading: 'Welcome to the Founding Circle',
            body: `
                <p>You've secured position <strong>#${queueNumber}</strong> in the Sentari Founding Circle.</p>
                <p>As a founding member, you'll be among the first to experience the platform and help shape its evolution.</p>
                <p>We'll send your exclusive access code shortly — keep an eye on your inbox.</p>
            `,
            footer: 'You received this because you signed up for the Sentari Founding Circle.'
        });

        await this.send(email, subject, html);
    }

    /**
     * Send access code email when a founding member is approved
     */
    async sendAccessCodeEmail(email: string, accessCode: string, queueNumber: number): Promise<void> {
        const subject = `Your Founding Circle Access Code`;
        const html = this.buildTemplate({
            heading: 'Your Access Code is Ready',
            body: `
                <p>Congratulations, Founding Member #${queueNumber}! Your exclusive access code is:</p>
                <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border: 1px solid rgba(138, 96, 255, 0.3); border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
                    <span style="font-family: 'Courier New', monospace; font-size: 28px; font-weight: bold; color: #a78bfa; letter-spacing: 3px;">${accessCode}</span>
                </div>
                <p>Use this code when signing up at Sentari to unlock your founding member privileges.</p>
                <p style="color: #9ca3af; font-size: 13px;">This code is unique to you. Please don't share it with others.</p>
            `,
            footer: 'You received this because you were approved for the Sentari Founding Circle.'
        });

        await this.send(email, subject, html);
    }

    /**
     * Core send method with error handling
     */
    private async send(to: string, subject: string, html: string): Promise<void> {
        if (!this.resend) {
            console.log(`[EmailService] (No API key) Would send to ${to}: "${subject}"`);
            return;
        }

        try {
            const { data, error } = await this.resend.emails.send({
                from: this.fromAddress,
                to: [to],
                subject,
                html
            });

            if (error) {
                console.error(`[EmailService] Failed to send to ${to}:`, error);
                return;
            }

            console.log(`[EmailService] Sent "${subject}" to ${to} (id: ${data?.id})`);
        } catch (err) {
            console.error(`[EmailService] Error sending to ${to}:`, err);
            // Don't throw — email failure shouldn't break the signup flow
        }
    }

    /**
     * Build a styled HTML email template
     */
    private buildTemplate({ heading, body, footer }: { heading: string; body: string; footer: string }): string {
        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0f0f23; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f0f23; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px;">
                    <!-- Logo -->
                    <tr>
                        <td style="padding-bottom: 32px; text-align: center;">
                            <span style="font-size: 24px; font-weight: 700; color: #a78bfa; letter-spacing: 2px;">SENTARI</span>
                        </td>
                    </tr>
                    <!-- Card -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #1a1a2e 100%); border: 1px solid rgba(138, 96, 255, 0.15); border-radius: 16px; padding: 40px;">
                            <h1 style="margin: 0 0 24px; font-size: 22px; font-weight: 600; color: #e2e8f0;">${heading}</h1>
                            <div style="color: #cbd5e1; font-size: 15px; line-height: 1.7;">
                                ${body}
                            </div>
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="padding-top: 24px; text-align: center;">
                            <p style="color: #4a5568; font-size: 12px; margin: 0;">${footer}</p>
                            <p style="color: #4a5568; font-size: 12px; margin: 8px 0 0;">© ${new Date().getFullYear()} Sentari · Phoenix Trust</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
    }
}

export const emailService = new EmailService();
