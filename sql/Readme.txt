#Initialize remote Cloudflare's database instance
npx wrangler d1 execute "dbname" --remote --file=./sql/schema.sql
