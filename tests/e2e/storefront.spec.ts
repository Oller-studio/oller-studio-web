import { expect, test } from "@playwright/test";

// Read-only navigation checks against real, already-deployed pages — no
// form submissions, no checkout, safe to run against production. Each one
// exists because a real bug slipped through before it was written:
// - "home has header and footer" — the homepage lived outside the layout
//   that adds the footer to every other page, and had none for months.
// - "canonical tag" — metadataBase alone doesn't make Next.js emit one.
// - "no duplicated brand name in title" — a title template collision made
//   every product page read "... | OLLER | OLLER".

test("homepage has header, footer, and no console errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));

  const response = await page.goto("/");
  expect(response?.status()).toBeLessThan(400);

  await expect(page.locator("header, nav").first()).toBeVisible();
  await expect(page.locator("footer")).toHaveCount(1);
  expect(errors).toEqual([]);
});

test("shop page loads and lists at least one colorway", async ({ page }) => {
  const response = await page.goto("/shop");
  expect(response?.status()).toBeLessThan(400);
  await expect(page.locator('a[href^="/shop/"]').first()).toBeVisible();
});

test("a product page has a canonical tag and no duplicated brand name in the title", async ({
  page,
}) => {
  await page.goto("/shop");
  const firstProductLink = page.locator('a[href^="/shop/"]').first();
  const href = await firstProductLink.getAttribute("href");
  test.skip(!href, "No published colorway to test against");

  const response = await page.goto(href!);
  expect(response?.status()).toBeLessThan(400);

  const canonical = page.locator('link[rel="canonical"]');
  await expect(canonical).toHaveCount(1);
  const canonicalHref = await canonical.getAttribute("href");
  expect(canonicalHref).toContain("oller.studio");

  const title = await page.title();
  expect(title.match(/OLLER/g)?.length ?? 0).toBeLessThanOrEqual(1);
});

test("sitemap.xml and robots.txt respond", async ({ request }) => {
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.ok()).toBeTruthy();
  expect(await sitemap.text()).toContain("<urlset");

  const robots = await request.get("/robots.txt");
  expect(robots.ok()).toBeTruthy();
});

test("admin is not reachable without logging in", async ({ page }) => {
  await page.goto("/admin");
  // Either a sign-in prompt or a redirect to Clerk — never the dashboard itself.
  await expect(page.getByText(/dashboard/i)).toHaveCount(0);
});
