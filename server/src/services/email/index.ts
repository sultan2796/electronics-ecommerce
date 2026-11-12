import { EmailStatus } from "@prisma/client";
import { env } from "../../config/env";
import { prisma } from "../../config/prisma";
import { EmailContent } from "./templates";

export interface OutgoingEmail extends EmailContent {
  to: string;
  userId?: string;
}

const activeEmailProvider = () => (env.EMAIL_PROVIDER === "resend" && env.RESEND_API_KEY ? "resend" : "console");

const sendViaResend = async (email: OutgoingEmail) => {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: env.EMAIL_FROM, to: [email.to], subject: email.subject, html: email.html, text: email.text }),
  });
  if (!response.ok) {
    throw new Error(`Resend HTTP ${response.status}: ${(await response.text()).slice(0, 300)}`);
  }
};

export const sendEmail = async (email: OutgoingEmail) => {
  const provider = activeEmailProvider();
  let status: EmailStatus = EmailStatus.LOGGED;
  let error: string | null = null;

  try {
    if (provider === "resend") {
      await sendViaResend(email);
      status = EmailStatus.SENT;
    } else {
      console.log(`E-poçt (jurnal rejimi): ${email.to} — ${email.subject}`);
    }
  } catch (err) {
    status = EmailStatus.FAILED;
    error = err instanceof Error ? err.message : String(err);
    console.error("E-poçt göndərilmədi", error);
  }

  await prisma.emailLog.create({
    data: {
      to: email.to,
      subject: email.subject,
      template: email.template,
      status,
      provider,
      html: provider === "console" ? email.html : null,
      error,
      userId: email.userId,
    },
  });
  return status;
};

export const queueEmail = (email: OutgoingEmail | null) => {
  if (!email) return;
  sendEmail(email).catch((err) => console.error("E-poçt jurnalı yazılmadı", err));
};

export const emailMode = () => activeEmailProvider();
