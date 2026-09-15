import assert from "node:assert/strict";
import { test } from "node:test";

const base = process.env.SEO_BASE_URL || "http://127.0.0.1:3100";
const canonical = "https://soutechnology.vn/";
const response = await fetch(base);
const html = await response.text();
const tags = html.match(/<(?:meta|link)\b[^>]*>/g) || [];
const attribute = (tag, name) => tag.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1];
const meta = (name) => attribute(tags.find((tag) =>
  attribute(tag, "name") === name || attribute(tag, "property") === name
) || "", "content");

test("homepage exposes one canonical URL and useful search metadata", () => {
  assert.equal(response.status, 200);
  assert.match(html, /<html[^>]*lang="vi"/);
  assert.match(html, /<title>[^<]*SoU[^<]*<\/title>/);
  assert.ok(meta("description")?.includes("phần mềm"));
  const canonicals = tags.filter((tag) => attribute(tag, "rel") === "canonical");
  assert.equal(canonicals.length, 1);
  assert.equal(new URL(attribute(canonicals[0], "href")).href, canonical);
  assert.doesNotMatch(meta("robots") || "", /noindex|nofollow/);
});

test("HTML includes the content and navigable section links before JavaScript", () => {
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
  for (const id of ["hero", "why", "capabilities", "process", "contact"]) {
    assert.match(html, new RegExp(`<section[^>]*id="${id}"`));
    assert.match(html, new RegExp(`<a[^>]*href="#${id}"`));
  }
  assert.match(html, /mailto:contact@soutechnology.vn/);
});

test("structured data describes the visible business and website", () => {
  const scripts = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)];
  assert.ok(scripts.length > 0, "Missing JSON-LD");
  const entities = scripts.flatMap((match) => JSON.parse(match[1])["@graph"] || []);
  const organization = entities.find((entity) => entity["@type"] === "Organization");
  assert.equal(organization?.url, canonical);
  assert.equal(organization?.email, "contact@soutechnology.vn");
  assert.equal(entities.find((entity) => entity["@type"] === "WebSite")?.url, canonical);
});

test("social preview has a working PNG image with sharing metadata", async () => {
  assert.equal(new URL(meta("og:url")).href, canonical);
  assert.equal(meta("og:locale"), "vi_VN");
  assert.equal(meta("twitter:card"), "summary_large_image");
  const image = new URL(meta("og:image"));
  assert.equal(image.origin, new URL(canonical).origin);
  assert.ok(meta("og:image:alt"));
  const result = await fetch(new URL(image.pathname + image.search, base));
  assert.equal(result.status, 200);
  assert.match(result.headers.get("content-type"), /image\/png/);
  const bytes = Buffer.from(await result.arrayBuffer());
  assert.equal(bytes.subarray(1, 4).toString(), "PNG");
  assert.equal(bytes.readUInt32BE(16), 1200);
  assert.equal(bytes.readUInt32BE(20), 630);
});

test("homepage declares an indexable Vietnamese page", () => {
  assert.match(html, /<html[^>]*lang="vi"/);
  assert.match(html, /<meta name="robots" content="[^\"]*index[^\"]*follow/);
  assert.match(html, /<meta property="og:locale" content="vi_VN"/);
});

test("robots allows crawling and references the canonical sitemap", async () => {
  const result = await fetch(new URL("/robots.txt", base));
  assert.equal(result.status, 200);
  const robots = await result.text();
  assert.match(robots, /User-Agent: \*/i);
  assert.match(robots, /^Allow: \/$/m);
  assert.match(robots, /Sitemap: https:\/\/soutechnology.vn\/sitemap.xml/);
  assert.doesNotMatch(robots, /^Disallow: \/(?:$|_next)/m);
});

test("sitemap contains only the real canonical page", async () => {
  const result = await fetch(new URL("/sitemap.xml", base));
  assert.equal(result.status, 200);
  assert.match(result.headers.get("content-type"), /xml/);
  const xml = await result.text();
  assert.deepEqual([...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]), [canonical]);
});

test("unknown URLs return 404 and cannot be indexed", async () => {
  const result = await fetch(new URL("/seo-check-missing-page", base));
  assert.equal(result.status, 404);
  assert.match(await result.text(), /<meta[^>]*name="robots"[^>]*content="[^"]*noindex/);
});
