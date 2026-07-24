ALTER TABLE "seller_settings" ADD COLUMN "landing_page_price_usd" DECIMAL(10, 2);
ALTER TABLE "seller_settings" ADD COLUMN "advanced_price_range_brl" TEXT;
ALTER TABLE "seller_settings" ADD COLUMN "advanced_price_range_usd" TEXT;
ALTER TABLE "seller_settings" ADD COLUMN "automation_price_range_brl" TEXT;
ALTER TABLE "seller_settings" ADD COLUMN "automation_price_range_usd" TEXT;
