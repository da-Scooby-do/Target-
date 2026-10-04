# Target Facility Service website

Public website for Target Facility Service V.O.F (Zoetermeer, NL) in English, Dutch and Arabic.
Phase 1: marketing pages, a 4-step quote request form and a contact form, both delivered by email.

Built with Next.js (App Router) on the Target Facility Service design system: tokens in
`src/app/tokens.css`, component classes in `src/app/tfs.css`, icons, photos and illustrations in `public/`.

## Run locally

```bash
npm install
npm run dev        # http://localhost:3000
```

Without `RESEND_API_KEY`, form emails are printed in the terminal instead of sent.

## Pages

| Path | Page |
| --- | --- |
| `/{en,nl,ar}` | Home |
| `/{lang}/services`, `/{lang}/services/[slug]` | Services overview and one page per service |
| `/{lang}/quote` | Request a quote (`?service=<slug>` preselects a service) |
| `/{lang}/about`, `/{lang}/contact`, `/{lang}/privacy` | About, contact, privacy policy |

`/` redirects to the visitor's browser language (English if not Dutch or Arabic).

## Where things live

- **Copy:** `src/dictionaries/en.ts` is the source. `nl.ts` and `ar.ts` must have the same keys (TypeScript enforces it).
- **Company details:** `src/lib/site.ts`. Every `TODO` there is a placeholder to replace before launch.
- **Services:** `src/lib/services.ts` (icon, photo, whether it uses the quote form).
- **Forms:** `src/components/QuoteForm.tsx`, `src/components/ContactForm.tsx`, server side in `src/app/actions.ts`.
- **Email:** `src/lib/email.ts` (Resend). Spam protection in `src/lib/spam.ts`: a hidden honeypot field, a minimum fill time and a per-IP limit.

## Environment variables

See `.env.example`.

| Variable | Needed | What |
| --- | --- | --- |
| `RESEND_API_KEY` | yes, in production | API key from resend.com |
| `INBOX_EMAIL` | yes, in production | Where quote requests and messages arrive |
| `EMAIL_FROM` | after a domain is verified | e.g. `Target Facility Service <noreply@domain.nl>` |
| `SEND_CONFIRMATIONS` | after a domain is verified | `true` emails the customer a confirmation with their reference |
| `NEXT_PUBLIC_SITE_URL` | yes, in production | Full site URL, used for SEO links and the sitemap |

**No domain yet:** Resend's test sender can only deliver to the email address of the Resend account itself.
Sign up to Resend with the inbox address, set `INBOX_EMAIL` to that same address and leave `EMAIL_FROM` and
`SEND_CONFIRMATIONS` unset. Once the client has a domain, verify it in Resend, then set both.

## Deploy (Vercel)

1. Import the repository in Vercel. The framework is detected automatically.
2. Add the environment variables above (Production and Preview).
3. Deploy. Preview deployments are kept out of search engines by `robots.txt`.

## Before launch

- [ ] Replace every `TODO` in `src/lib/site.ts` (address, email, phone, WhatsApp, KvK number).
- [ ] Have a native speaker review `nl.ts` and `ar.ts`.
- [ ] Client reviews all English copy, especially the service descriptions.
- [ ] Replace the AI-generated stand-in photos in `public/photos/` with real ones (same file names).
- [ ] Add the logo when supplied (the header shows the company name as text until then).
- [ ] Domain: connect it in Vercel, verify it in Resend, set `EMAIL_FROM` and `SEND_CONFIRMATIONS=true`.
- [ ] Vercel's free Hobby plan is for non-commercial use; a client site should move to Pro.
