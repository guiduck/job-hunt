CREATE TABLE "niche_portfolio_examples" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "niche_id" TEXT NOT NULL,
  "project_name" TEXT,
  "repository_url" TEXT,
  "demo_url" TEXT,
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "niche_portfolio_examples_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "niche_portfolio_examples_niche_id_fkey"
    FOREIGN KEY ("niche_id") REFERENCES "freelance_niches"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "niche_portfolio_examples_user_id_niche_id_key"
  ON "niche_portfolio_examples"("user_id", "niche_id");

CREATE INDEX "niche_portfolio_examples_user_id_updated_at_idx"
  ON "niche_portfolio_examples"("user_id", "updated_at");
