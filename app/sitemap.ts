import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: "https://emborgerp.com", lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: "https://emborgerp.com/features", lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: "https://emborgerp.com/pricing", lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: "https://emborgerp.com/contact", lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
  ];
}
