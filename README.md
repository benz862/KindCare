# KindCare

KindCare is a SkillBinder LLC product for supportive companionship and household care coordination.

> More connection. More kindness. More peace of mind.

KindCare is not medical advice, medical monitoring, or emergency dispatch.

This is a fresh rebuild. Product source of truth: `src/MD files/` (also copied in `docs/kindcare-rebuild/`).

## Local development

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Do not commit `.env.local`, service-role keys, or real person data.

## Current phase

Foundation: KindCare design system, marketing landing page, privacy notice, and terms placeholder. Authentication, households, and data screens come next and require a dedicated KindCare Supabase project.

## Verification

```bash
npm run lint
npm run typecheck
```
