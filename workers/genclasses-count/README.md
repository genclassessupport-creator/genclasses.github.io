# genclasses-count

Cloudflare Worker + SQLite Durable Object for the visitor widget.

- Live: https://count.genclasses.com
- workers.dev: https://genclasses-count.genclasses-apps.workers.dev
- CORS: genclasses.com / www.genclasses.com only
- Free tier: Workers 100k req/day; DO 100k req/day + 13k GB-s/day
- Counts unique-ish visitors via client localStorage day flag (IST). No PII stored.
