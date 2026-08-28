import { asc, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { serviceCategories, serviceTreatments } from "@/lib/db/schema"

export async function getServiceCatalog() {
  const categories = await db.select().from(serviceCategories).where(eq(serviceCategories.active, true)).orderBy(asc(serviceCategories.sortOrder))
  const treatments = await db.select().from(serviceTreatments).where(eq(serviceTreatments.active, true)).orderBy(asc(serviceTreatments.sortOrder))
  return categories.map((category) => ({ ...category, treatments: treatments.filter((treatment) => treatment.categoryId === category.id && treatment.showOnSite) }))
}

export async function getAllServiceCatalog() {
  const categories = await db.select().from(serviceCategories).orderBy(asc(serviceCategories.sortOrder))
  const treatments = await db.select().from(serviceTreatments).orderBy(asc(serviceTreatments.categoryId), asc(serviceTreatments.sortOrder))
  return categories.map((category) => ({ ...category, treatments: treatments.filter((treatment) => treatment.categoryId === category.id) }))
}

export type ServiceCatalog = Awaited<ReturnType<typeof getServiceCatalog>>
export type ServiceCategory = ServiceCatalog[number]
export type ServiceTreatment = ServiceCategory["treatments"][number]

export function catalogPrice(selection: string, catalog: ServiceCatalog | Awaited<ReturnType<typeof getAllServiceCatalog>>) {
  try {
    const parsed = JSON.parse(selection) as { category: string; treatmentIds: string[] }
    const category = catalog.find((item) => item.name === parsed.category)
    return category?.treatments.reduce((sum, treatment) => parsed.treatmentIds.includes(String(treatment.id)) ? sum + (treatment.price ?? 0) : sum, 0) ?? 0
  } catch { return 0 }
} 
