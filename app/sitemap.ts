import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

const routes = [
  "",
  "/platform/edward",
  "/platform/action-center",
  "/platform/morning-brew",
  "/platform/student-experience",
  "/solutions",
  "/solutions/enrollment-readiness",
  "/why-audentra",
  "/trust",
  "/pricing",
  "/pilot",
  "/about",
  "/demo",
  "/accessibility",
  "/legal/privacy",
  "/legal/terms",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((route) => ({
    url: `${site.url}${route}`,
    changeFrequency: "monthly",
    priority: route === "" ? 1 : 0.7,
  }));
}
