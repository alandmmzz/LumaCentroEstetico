import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://luma.com.uy'
  return [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${baseUrl}/reservar`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
  ]
}
