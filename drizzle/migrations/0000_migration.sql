CREATE TABLE public.product_search_cache (
  query text PRIMARY KEY,
  results jsonb NOT NULL DEFAULT '[]'::jsonb,
  fetched_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.product_search_cache TO service_role;
ALTER TABLE public.product_search_cache ENABLE ROW LEVEL SECURITY;