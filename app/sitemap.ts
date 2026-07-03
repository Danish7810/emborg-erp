import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: "https://www.emborgerp.com", lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: "https://www.emborgerp.com/features", lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: "https://www.emborgerp.com/pricing", lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: "https://www.emborgerp.com/contact", lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
  ];
}
