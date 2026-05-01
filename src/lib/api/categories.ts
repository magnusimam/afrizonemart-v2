const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export interface ApiCategory {
  id: string;
  slug: string;
  name: string;
  image: string | null;
  parentId: string | null;
  productCount: number;
  children: ApiCategory[];
}

export async function listCategories(): Promise<ApiCategory[]> {
  try {
    const res = await fetch(`${API_BASE}/api/categories`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { items: ApiCategory[] };
    return data.items ?? [];
  } catch {
    return [];
  }
}
