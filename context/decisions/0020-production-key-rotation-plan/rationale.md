# Migrated historical decision 0020

2026-08-15** — Production environment audit: all required Vercel variables exist and the service-role value is Sensitive; however, the same privileged value is exposed to Preview deployments. Supabase's newer key system is available. Contain this through backup → server authorization repair → Production-only secret-key deployment → legacy-key revocation, not by an isolated environment edit that leaves old deployments authorized.
