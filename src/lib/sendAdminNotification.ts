export async function sendAdminNotification({
  subject,
  htmlContent,
}: {
  subject: string;
  htmlContent: string;
}) {
  const adminEmails = (process.env.ADMIN_EMAIL || "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean)
    .map((email) => ({ email }));

  if (adminEmails.length === 0) return;

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": process.env.BREVO_API_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender: {
        name: "REVIEW PRO",
        email: process.env.FROM_EMAIL,
      },
      to: adminEmails,
      subject,
      htmlContent,
    }),
  });

  if (!res.ok) {
    console.error("Admin notification failed:", await res.text());
  }
}
