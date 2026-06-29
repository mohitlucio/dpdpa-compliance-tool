<h1 align="center">DPDPA Compliance Assessment Tool</h1>

<p align="center">
  A web tool that lets an organisation answer a few short questions and instantly receive a
  personalised <b>DPDPA (Digital Personal Data Protection Act, 2023) compliance roadmap</b> PDF by email.
  <br/>
  Modelled on Trilegal's DPDPA Compliance Assessment Tool.
</p>

<p align="center">
   <b>Live app:</b> <a href="https://dpdpa-compliance-tool.onrender.com">https://dpdpa-compliance-tool.onrender.com</a>
</p>

---

## Overview

The DPDPA, 2023 changes how organisations in India collect, use, store and manage personal
data. For many businesses the hardest question is simply *where to begin*.

This tool answers that. A visitor:

1. Lands on an intro page and clicks **“Take the Assessment”**.
2. Answers a **5-step questionnaire** (3–5 short questions).
3. Enters their email and hits **Submit**.
4. **Automatically receives an email** with a tailored summary of their obligations and the
   **DPDPA Compliance Roadmap PDF attached**.

It’s useful for organisations at any stage of their compliance journey, or as a practical
starting point for internal discussions.

## Features

- Clean, branded landing page (Trilegal logo + hero) in a Times New Roman theme.
- 5-step questionnaire with a progress bar, Back/Next/Submit, and input validation.
- Smart, mutually-exclusive “None of the Above” option.
- **Automatic email delivery** with the roadmap **PDF as a real attachment**.
- The email body is **tailored to the answers** (primary DPDPA role, data type, risk factors).
- Every submission is logged for the operator’s records.

## How it works

A classic two-part web app: a static frontend the visitor sees, and a small backend that
performs the one privileged action — sending the email.

```
┌──────────────────────────────┐     POST /api/submit      ┌───────────────────────────┐
│ FRONTEND  (public/index.html) │ ──(answers + email)─────► │ BACKEND  (server.js)       │
│  • landing page               │                           │  • Express web server      │
│  • 5-step questionnaire        │ ◄──({ ok: true })──────── │  • validates the email     │
│  • fetch() on submit          │                           │  • builds a tailored note  │
└──────────────────────────────┘                           │  • Nodemailer → Gmail SMTP │
                                                            └─────────────┬─────────────┘
                                                                          │ attaches the PDF
                                                                          ▼
                                                                Recipient’s inbox
```

- **Frontend** — one self-contained HTML file (HTML + CSS + vanilla JavaScript, no framework).
  The logo and the padlock hero are hand-built **SVGs** so they stay sharp at any size.
- **Backend** — Node.js + **Express**. A single endpoint, `POST /api/submit`, validates the
  email, turns the raw answers into plain English, composes the message, and sends it with
  **Nodemailer** over Gmail SMTP, attaching `assets/DPDPA-Compliance-Roadmap.pdf`.
- **Credentials** are never hard-coded — they’re read from environment variables, so nothing
  secret is ever committed to this repository.

## Tech stack

| Layer    | Technology |
|----------|------------|
| Frontend | HTML, CSS, vanilla JavaScript, inline SVG |
| Backend  | Node.js, Express |
| Email    | Nodemailer over Gmail SMTP |
| Hosting  | [Render](https://render.com) (free Node web service) |

## Project structure

```
dpdpa-tool/
├─ server.js                 # Express server + email logic
├─ package.json
├─ render.yaml               # Render deploy blueprint
├─ .env.example              # template for credentials (copy to .env)
├─ assets/
│  └─ DPDPA-Compliance-Roadmap.pdf   # the PDF that gets emailed
└─ public/
   ├─ index.html             # landing page + questionnaire
   ├─ trilegal-logo.svg
   ├─ hero.svg
   └─ DPDPA-Compliance-Roadmap.pdf
```

## Run locally

```bash
git clone https://github.com/mohitlucio/dpdpa-compliance-tool.git
cd dpdpa-compliance-tool
npm install
cp .env.example .env        # then fill in your email credentials
npm start                   # open http://localhost:3000
```

### Environment variables

| Variable      | Meaning                                                  |
|---------------|---------------------------------------------------------|
| `SMTP_HOST`   | `smtp.gmail.com`                                         |
| `SMTP_PORT`   | `465`                                                    |
| `SMTP_SECURE` | `true`                                                   |
| `SMTP_USER`   | the sending Gmail address                                |
| `SMTP_PASS`   | a Gmail **App Password** (not your normal password)      |
| `FROM_NAME`   | display name recipients see (e.g. `Trilegal`)            |
| `FROM_EMAIL`  | the “from” address (same as `SMTP_USER` for Gmail)       |
| `BCC_EMAIL`   | optional — receive a copy of every submission            |
| `BREVO_API_KEY` | optional — if set, sends via [Brevo](https://www.brevo.com)'s HTTPS API instead of SMTP (needed on hosts that block SMTP, e.g. Render free) |

> **Gmail App Password:** enable 2-Step Verification, then create one at
> <https://myaccount.google.com/apppasswords>.
>
> **Sending on Render (free tier):** Render blocks outbound SMTP ports, so Gmail SMTP won't
> work there. Set `BREVO_API_KEY` instead — the app then sends over Brevo's HTTPS API, still
> from `FROM_EMAIL` with the PDF attached. Verify `FROM_EMAIL` as a sender in Brevo first.

## Deployment (Render)

The live app runs on Render as a free Node web service:
**<https://dpdpa-compliance-tool.onrender.com>**

To deploy your own copy:

1. On [Render](https://dashboard.render.com) → **New ▸ Web Service**.
2. Use **Public Git Repository** and paste this repo’s URL (or connect via the
   `render.yaml` Blueprint if it’s your own account).
3. Settings: **Runtime** Node · **Build** `npm install` · **Start** `npm start` · **Free** plan.
4. Add the environment variables from the table above.
5. **Create Web Service** — Render builds and gives you a public URL.

> **Note on the free tier:** the service sleeps after ~15 minutes of inactivity, so the first
> request after idle takes ~30 seconds to wake up, then it’s fast.

## Customising

- **Change the emailed PDF:** replace the file in `assets/` (and `public/`).
- **Change the email wording:** edit `buildEmail()` in `server.js`.
- **Different PDFs per answer combination:** extend the `/api/submit` handler in `server.js`.
- **Sender display name:** change `FROM_NAME`.

## ⚖️isclaimer

“Trilegal” and the bundled roadmap PDF are the property of Trilegal; this is a demonstration
project. The roadmap is for general informational purposes only and **does not constitute
legal advice**.
