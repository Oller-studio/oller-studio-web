import { Resend } from "resend";

export const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM = "OLLER <hello@oller.studio>";

export async function sendWelcomeEmail(email: string, firstName?: string) {
  if (!resend) return;

  try {
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: "Welcome to OLLER",
      html: `
        <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; color: #1a1a1a;">
          <h1 style="font-size: 20px; letter-spacing: 0.05em; text-transform: uppercase;">OLLER</h1>
          <p>Hi${firstName ? ` ${firstName}` : ""},</p>
          <p>Your account is ready. Log in anytime with this email address to track your order and manage your favorites.</p>
          <p style="margin-top: 32px; font-size: 13px; color: #777;">— OLLER Studio</p>
        </div>
      `,
    });
  } catch (error) {
    console.error("sendWelcomeEmail error", error);
  }
}

export async function sendRestockEmail(
  to: string,
  subject: string,
  message: string,
  link: string,
) {
  if (!resend) return false;

  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject,
      html: `
        <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; color: #1a1a1a;">
          <h1 style="font-size: 20px; letter-spacing: 0.05em; text-transform: uppercase;">OLLER</h1>
          <p style="white-space: pre-wrap;">${message}</p>
          <p style="margin: 24px 0;"><a href="${link}" style="display: inline-block; background: #1a1a1a; color: #fff; padding: 12px 24px; text-decoration: none; text-transform: uppercase; letter-spacing: 0.05em; font-size: 13px;">Get yours</a></p>
          <p style="margin-top: 32px; font-size: 13px; color: #777;">— OLLER Studio</p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error("sendRestockEmail error", error);
    return false;
  }
}

export async function sendNewsletterSignup(email: string) {
  if (!resend) return false;

  try {
    await resend.emails.send({
      from: FROM,
      to: "hello@oller.studio",
      replyTo: email,
      subject: "[Newsletter Signup]",
      html: `
        <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; color: #1a1a1a;">
          <p><strong>Email:</strong> ${email}</p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error("sendNewsletterSignup error", error);
    return false;
  }
}

export async function sendCollabInquiry(
  firstName: string,
  lastName: string,
  email: string,
  phone: string | undefined,
  message: string,
) {
  if (!resend) return false;

  try {
    await resend.emails.send({
      from: FROM,
      to: "hello@oller.studio",
      replyTo: email,
      subject: `[Potential Collab] ${firstName} ${lastName}`,
      html: `
        <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; color: #1a1a1a;">
          <p><strong>Name:</strong> ${firstName} ${lastName}</p>
          <p><strong>Email:</strong> ${email}</p>
          ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ""}
          <p style="white-space: pre-wrap;">${message}</p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error("sendCollabInquiry error", error);
    return false;
  }
}

export async function sendContactInquiry(
  firstName: string,
  lastName: string,
  email: string,
  subject: string,
  message: string,
) {
  if (!resend) return false;

  const tag = subject === "Collab" ? "Potential Collab" : subject;

  try {
    await resend.emails.send({
      from: FROM,
      to: "hello@oller.studio",
      replyTo: email,
      subject: `[${tag}] ${firstName} ${lastName}`,
      html: `
        <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; color: #1a1a1a;">
          <p><strong>Name:</strong> ${firstName} ${lastName}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <p style="white-space: pre-wrap;">${message}</p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error("sendContactInquiry error", error);
    return false;
  }
}
