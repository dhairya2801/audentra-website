import { requireAnalyticsAccess } from "@/lib/analytics/access";
import { Dashboard } from "./workspace";
export async function DashboardPage() {
  await requireAnalyticsAccess();
  return (
    <Dashboard
      clarityUrl={`https://clarity.microsoft.com/projects/view/${process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID || "yetbx84cq5"}/dashboard`}
      vercelUrl="https://vercel.com/dhairya5/audentra-website/analytics"
    />
  );
}
