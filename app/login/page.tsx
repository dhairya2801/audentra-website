import { notFound, redirect } from "next/navigation";
import { authConfigured } from "@/lib/analytics/auth";
import { isAuthorized } from "@/lib/analytics/access";
export const metadata = {
  title: "Team sign in",
  robots: { index: false, follow: false },
};
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (process.env.AUDENTRA_APP !== "analytics") notFound();
  if (await isAuthorized()) redirect("/");
  const { error } = await searchParams;
  return (
    <main className="insights login-shell">
      <div className="login-brand">
        <span className="brand-symbol">a</span> audentra
        <span className="workspace-label">INTELLIGENCE / INTERNAL</span>
      </div>
      <div className="login-card">
        <span className="eyebrow">THE OUTREACH WORKSPACE</span>
        <h1>
          From conversations
          <br />
          to conviction.
        </h1>
        <p>
          A shared view of the people finding Audentra, what interests them, and
          what happens next.
        </p>
        <form action="/api/auth/login" method="post">
          <label htmlFor="password">Team password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            maxLength={256}
            placeholder="Enter your team password"
          />
          {error && (
            <p role="alert" className="error-text">
              That password didn’t match. Please try again.
            </p>
          )}
          {!authConfigured() && (
            <p role="alert">
              Access is not configured. Set the dashboard authentication secrets
              in Vercel.
            </p>
          )}
          <button className="primary-button" disabled={!authConfigured()}>
            Open workspace <span>↗</span>
          </button>
        </form>
        <small>Private workspace · Session expires after 8 hours</small>
      </div>
      <div className="login-decoration" aria-hidden="true">
        <i />
        <i />
        <i />
        <span>MEASURE WHAT MOVES US FORWARD.</span>
      </div>
    </main>
  );
}
