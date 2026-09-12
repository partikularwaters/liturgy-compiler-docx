# Migrated historical decision 0026

2026-08-16** — Phase 1 containment keeps the existing `getCurrentUser()` role resolver as the shared trusted-editor gate rather than introducing a competing authorization abstraction. Internal service-role helpers must use `server-only`, not `"use server"`, unless they are intentionally callable from a Client Component.
