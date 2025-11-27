import { MetadataRoute } from 'next'

const BASE_URL = 'https://qbcc-calculator.vercel.app'

export default function sitemap(): MetadataRoute.Sitemap {
  const commonEstimates = [
    { type: 'new-construction', value: 300000 },
    { type: 'new-construction', value: 450000 },
    { type: 'new-construction', value: 600000 },
    { type: 'renovation', value: 50000 },
    { type: 'renovation', value: 150000 },
    { type: 'renovation', value: 250000 },
  ]

  const estimates = commonEstimates.map((est) => ({
    url: `${BASE_URL}/estimate/${est.type}/${est.value}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }))

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    ...estimates,
  ]
}