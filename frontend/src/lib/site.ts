// Keep canonical URLs, crawler discovery and structured data on the same origin.
export const site = {
  url: "https://soutechnology.vn/",
  name: "SoU Technology Solutions",
  title: "SoU Tech | SoU Technology Solutions – Phần mềm, SaaS & Web3",
  description:
    "SoU Tech phát triển phần mềm, SaaS, Blockchain & Web3; chăm sóc website cho doanh nghiệp, viết và đăng bài, cập nhật nội dung website.",
  email: "contact@soutechnology.vn",
  facebook: "https://www.facebook.com/soutechnologyvn",
};

export const organizationId = `${site.url}#organization`;

export const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": organizationId,
      name: site.name,
      alternateName: ["SoU Tech", "SoU"],
      url: site.url,
      logo: new URL("/client/images/logo.svg", site.url).href,
      description: site.description,
      email: site.email,
      sameAs: [site.facebook],
      contactPoint: {
        "@type": "ContactPoint",
        email: site.email,
        contactType: "business inquiries",
        availableLanguage: "vi",
      },
    },
    {
      "@type": "WebSite",
      "@id": `${site.url}#website`,
      url: site.url,
      name: site.name,
      alternateName: ["SoU Tech", "SoU"],
      inLanguage: "vi-VN",
      publisher: { "@id": organizationId },
    },
    {
      "@type": "WebPage",
      "@id": `${site.url}#webpage`,
      url: site.url,
      name: site.title,
      description: site.description,
      inLanguage: "vi-VN",
      isPartOf: { "@id": `${site.url}#website` },
      about: { "@id": organizationId },
    },
  ],
};
