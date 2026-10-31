-- Enable pg_trgm extension for fuzzy typo-tolerant matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Full-text search GIN index on Name, Brand, Salt Composition, and Category
CREATE INDEX IF NOT EXISTS medicine_fts_idx ON "Medicine"
USING gin(to_tsvector('english', coalesce("name", '') || ' ' || coalesce("brand", '') || ' ' || coalesce("saltComposition", '') || ' ' || coalesce("category", '')));

-- Trigram GIN indexes for typo tolerance (e.g., "Paracitamol" -> "Paracetamol")
CREATE INDEX IF NOT EXISTS medicine_name_trgm_idx ON "Medicine" USING gin ("name" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS medicine_brand_trgm_idx ON "Medicine" USING gin ("brand" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS medicine_salt_trgm_idx ON "Medicine" USING gin ("saltComposition" gin_trgm_ops);
