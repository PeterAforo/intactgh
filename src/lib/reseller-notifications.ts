import { sendEmail, emailLayout } from "@/lib/email";

const CONNECT_BASE_URL = () =>
  (process.env.CONNECT_APP_URL || "https://www.intactconnect.com.gh").replace(/\/+$/, "");

export async function sendResellerStatusEmail(params: {
  status: "approved" | "rejected" | "suspended";
  userName: string | null;
  userEmail: string;
  storeSlug: string;
}): Promise<void> {
  const { status, userName, userEmail, storeSlug } = params;
  const baseUrl = CONNECT_BASE_URL();
  const name = userName || "there";

  if (status === "suspended") {
    await sendEmail(
      userEmail,
      "Your IntactConnect account has been suspended",
      emailLayout("Account Suspended", `
        <h2 style="color:#333">Account Suspended</h2>
        <p>Hi ${name}, your IntactConnect reseller account (<strong>${storeSlug}</strong>) has been <strong style="color:#ea580c">suspended</strong>.</p>
        <p>You will not be able to sign in or operate your store while the suspension is in effect. If you believe this was a mistake, please contact us at <a href="mailto:support@intactghana.com">support@intactghana.com</a>.</p>
      `)
    );
    return;
  }

  if (status === "approved") {
    await sendEmail(
      userEmail,
      "Your IntactConnect account has been approved!",
      emailLayout("Account Approved", `
        <h2 style="color:#333">Congratulations, ${name}!</h2>
        <p>Your IntactConnect reseller account has been <strong style="color:#22c55e">approved</strong>.</p>
        <p>You can now log in and start selling:</p>
        <a href="${baseUrl}/login" style="display:inline-block;background:#7c3aed;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0;">Go to Dashboard</a>
        <p style="color:#666">Your store URL: <a href="${baseUrl}/store/${storeSlug}">${baseUrl}/store/${storeSlug}</a></p>
      `)
    );
  } else {
    await sendEmail(
      userEmail,
      "IntactConnect account update",
      emailLayout("Account Update", `
        <h2 style="color:#333">Account Update</h2>
        <p>Hi ${name}, unfortunately your reseller application was not approved at this time.</p>
        <p>If you believe this was an error, please contact us at <a href="mailto:support@intactghana.com">support@intactghana.com</a>.</p>
      `)
    );
  }
}
