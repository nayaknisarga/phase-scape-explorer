import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { isClinicalQuery } from "./product-guard";

export type ProductOffer = {
  title: string;
  price: string;
  extractedPrice: number | null;
  source: string;
  thumbnail: string;
  link: string;
};

const SIX_HOURS = 6 * 60 * 60 * 1000;

export const searchProducts = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ query: z.string().trim().min(2).max(120) }).parse(d))
  .handler(async ({ data }): Promise<{ offers: ProductOffer[]; blocked?: boolean; error?: string }> => {
    if (isClinicalQuery(data.query)) return { offers: [], blocked: true };
    const query = data.query.toLowerCase();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: cached } = await supabaseAdmin
      .from("product_search_cache")
      .select("results, fetched_at")
      .eq("query", query)
      .maybeSingle();
    if (cached && Date.now() - new Date(cached.fetched_at).getTime() < SIX_HOURS) {
      return { offers: cached.results as unknown as ProductOffer[] };
    }

    const key = process.env["SERPAPI_KEY"];
    if (!key) return { offers: [], error: "Product search isn't configured yet." };
    const url = `https://serpapi.com/search.json?engine=google_shopping&q=${encodeURIComponent(query)}&gl=in&hl=en&api_key=${key}`;
    try {
      const res = await fetch(url);
      if (!res.ok) {
        console.error("SerpAPI error", res.status, await res.text());
        return { offers: [], error: "Couldn't reach the shops right now." };
      }
      const json = (await res.json()) as { shopping_results?: Record<string, unknown>[] };
      const offers: ProductOffer[] = (json.shopping_results ?? [])
        .map((r) => ({
          title: String(r["title"] ?? ""),
          price: String(r["price"] ?? ""),
          extractedPrice: typeof r["extracted_price"] === "number" ? (r["extracted_price"] as number) : null,
          source: String(r["source"] ?? ""),
          thumbnail: String(r["thumbnail"] ?? ""),
          link: String(r["product_link"] ?? r["link"] ?? ""),
        }))
        .filter((o) => o.title && o.link && o.extractedPrice !== null)
        .sort((a, b) => (a.extractedPrice ?? 0) - (b.extractedPrice ?? 0))
        .slice(0, 5);
      await supabaseAdmin
        .from("product_search_cache")
        .upsert({ query, results: offers as never, fetched_at: new Date().toISOString() });
      return { offers };
    } catch (e) {
      console.error(e);
      return { offers: [], error: "Couldn't reach the shops right now." };
    }
  });
