// Keep canonical URLs, crawler discovery and structured data on the same origin.
export const site = {
  url: "https://soutechnology.vn/",
  name: "SoU Technology Solutions",
  title: "SoU Technology Solutions | Phần mềm, SaaS & Web3",
  description:
    "SoU phát triển phần mềm theo yêu cầu, ứng dụng web, mobile, nền tảng SaaS và giải pháp Blockchain & Web3. Đồng hành cùng doanh nghiệp từ tư vấn đến vận hành.",
  email: "contact@soutechnology.vn",
};

export const organizationId = `${site.url}#organization`;

export const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": organizationId,
      name: site.name,
      alternateName: "SoU",
      url: site.url,
      logo: new URL("/client/images/logo.svg", site.url).href,
      description: site.description,
      email: site.email,
    },
    {
      "@type": "WebSite",
      "@id": `${site.url}#website`,
      url: site.url,
      name: site.name,
      alternateName: "SoU",
      inLanguage: "vi-VN",
      publisher: { "@id": organizationId },
    },
  ],
};
