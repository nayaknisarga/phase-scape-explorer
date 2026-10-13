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

function storeLink(title: string, source: string, direct: string) {
  if (direct && !/google\./.test(direct)) return direct;
  const q = encodeURIComponent(title);
  const s = source.toLowerCase();
  if (s.includes('amazon')) return `https://www.amazon.in/s?k=${q}`;
  if (s.includes('flipkart')) return `https://www.flipkart.com/search?q=${q}`;
  if (s.includes('nykaa')) return `https://www.nykaa.com/search/result/?q=${q}`;
  if (s.includes('myntra')) return `https://www.myntra.com/${q}`;
  if (s.includes('1mg')) return `https://www.1mg.com/search/all?name=${q}`;
  if (s.includes('meesho')) return `https://www.meesho.com/search?q=${q}`;
  return `https://www.google.com/search?q=${encodeURIComponent(`${title} ${source}`)}`;
}

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
      .eq("query", "v2:" + query)
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
          link: storeLink(String(r["title"] ?? ""), String(r["source"] ?? ""), String(r["link"] ?? "")),
        }))
        .filter((o) => o.title && o.link && o.extractedPrice !== null)
        .sort((a, b) => (a.extractedPrice ?? 0) - (b.extractedPrice ?? 0))
        .slice(0, 5);
      await supabaseAdmin
        .from("product_search_cache")
        .upsert({ query: "v2:" + query, results: offers as never, fetched_at: new Date().toISOString() });
      return { offers };
    } catch (e) {
      console.error(e);
      return { offers: [], error: "Couldn't reach the shops right now." };
    }
  });
