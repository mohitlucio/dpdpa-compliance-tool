# DPDPA Compliance Assessment Tool

A working web tool modelled on Trilegal's DPDPA Compliance Assessment Tool.
A visitor reads a short intro, answers a 5-page questionnaire, and on submit is
**automatically emailed** a DPDPA Compliance Roadmap PDF with a Trilegal-branded
cover note.

---

## 1. What it does

1. **Landing page** — title, hero graphic, intro copy, and a "Take the Assessment" button.
2. **5-step questionnaire** (matches the original questions, with a progress bar and
   Back/Next/Submit):
   - Q1 — Do you process personal data in India / offer goods to people in India? (Yes/No)
   - Q2 — Why do you process data? (own use → *Data Fiduciary* / on behalf → *Data Processor*)
   - Q3 — Whose data? (customers → *B2C / external-facing* / employees → *internal*)
   - Q4 — Additional considerations (children, cross-border, large/sensitive volume, none)
   - Q5 — Email address
3. **On submit** the email entered on page 5 receives:
   - the **roadmap PDF** (`assets/DPDPA-Compliance-Roadmap.pdf`) as an attachment, and
   - the exact Trilegal cover note + confidentiality + disclaimer text, plus a short
     **snapshot** tailored to the answers (role, data type, considerations).
4. Every submission is appended to `submissions.log` (local runs only).

## 2. Tech stack

- **Frontend:** a single static page, `public/index.html` (no framework). Times New Roman,
  Trilegal navy palette. Logo and hero are inline SVGs (`public/trilegal-logo.svg`,
  `public/hero.svg`).
- **Backend:** Node.js + Express (`server.js`). One endpoint, `POST /api/submit`, validates
  the email, builds the message, and sends it with **Nodemailer** over SMTP.
- **Email:** Gmail SMTP (configurable to any provider via environment variables).

## 3. Project structure

```
dpdpa-tool/
├─ server.js               # Express server + email logic
├─ package.json
├─ render.yaml             # one-click deploy config for Render
├─ .env.example            # template for credentials (copy to .env)
├─ .env                    # YOUR real credentials — git-ignored, never committed
├─ assets/
│  └─ DPDPA-Compliance-Roadmap.pdf   # the PDF that gets emailed
└─ public/
   ├─ index.html           # landing page + questionnaire
   ├─ trilegal-logo.svg
   └─ hero.svg
```

## 4. Run locally

```bash
cd dpdpa-tool
npm install
cp .env.example .env          # then edit .env with your real values
npm start
```
Open http://localhost:3000

### Email settings (.env)
| Variable      | Meaning                                            |
|---------------|----------------------------------------------------|
| `SMTP_HOST`   | `smtp.gmail.com` for Gmail                          |
| `SMTP_PORT`   | `465`                                               |
| `SMTP_SECURE` | `true`                                              |
| `SMTP_USER`   | the sending Gmail address                           |
| `SMTP_PASS`   | a Gmail **App Password** (not your login password)  |
| `FROM_NAME`   | display name recipients see (e.g. `Trilegal`)       |
| `FROM_EMAIL`  | the from address (same as `SMTP_USER` for Gmail)    |
| `BCC_EMAIL`   | optional — get a copy of every submission           |

> Gmail App Password: enable 2-Step Verification, then create one at
> https://myaccount.google.com/apppasswords

## 5. Deploy online (Render)

This app needs a server (to send email), so it can't run on GitHub Pages.
It ships with `render.yaml` for a free Render web service.

1. Push this repo to GitHub (already done if you're reading this on GitHub).
2. Go to https://dashboard.render.com → **New** → **Blueprint**.
3. Connect your GitHub and select this repository. Render reads `render.yaml`.
4. When prompted, fill in the secret env vars:
   - `SMTP_USER` = your Gmail address
   - `SMTP_PASS` = your Gmail App Password
   - `FROM_EMAIL` = your Gmail address
   - `BCC_EMAIL` = (optional)
5. Click **Apply**. Render builds and gives you a public URL like
   `https://dpdpa-compliance-tool.onrender.com`.

Notes:
- The free tier sleeps after ~15 min idle; the first request after that takes a few
  seconds to wake.
- The filesystem is ephemeral on Render, so `submissions.log` won't persist there. Set
  `BCC_EMAIL` if you want a durable copy of each lead.

## 6. Customising

- **Change the emailed PDF:** replace `assets/DPDPA-Compliance-Roadmap.pdf`.
- **Change the email wording:** edit `buildEmail()` in `server.js`.
- **Different PDFs per answer combination:** extend the `/api/submit` handler in
  `server.js` to pick a file based on `answers`.
- **Sender display name:** change `FROM_NAME`.

## 7. Notes & disclaimers

- This is a demonstration/clone built for the owner of this repo. "Trilegal" and the
  bundled roadmap PDF are the property of Trilegal; do not distribute publicly without
  authorisation.
- The roadmap is informational only and is **not legal advice**.
