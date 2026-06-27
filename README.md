# DPDPA Compliance Assessment Tool

A web tool modelled on Trilegal's DPDPA Compliance Assessment Tool. A visitor reads a
short intro, answers a 5-page questionnaire, enters their email, and is **automatically
emailed** a DPDPA Compliance Roadmap (with a Trilegal-branded cover note).

**Live site (GitHub Pages):** https://mohitlucio.github.io/dpdpa-compliance-tool/

---

## 1. What it does
1. Landing page → "Take the Assessment".
2. 5 questions (Q1 in-scope? · Q2 fiduciary/processor · Q3 customers/employees · Q4 extra
   considerations · Q5 email).
3. On submit, the email entered receives a tailored summary + a link to the roadmap PDF.

## 2. Two ways it can run

### A) Static site on GitHub Pages + EmailJS  ← this is what's hosted live
GitHub Pages only serves static files, so the email is sent **from the browser** using
[EmailJS](https://www.emailjs.com) (a service designed for static sites; its public key is
safe to expose). The roadmap PDF is hosted on the Pages site and the email links to it.

- Frontend: `public/index.html` (HTML + CSS + vanilla JS).
- Email: `emailjs.send(...)` configured by `public/config.js`.
- Deploy: GitHub Actions workflow `.github/workflows/deploy-pages.yml` publishes `public/`.

**Setup (one time):**
1. Create a free account at https://dashboard.emailjs.com
2. **Email Services** → add **Gmail** → connect your Gmail account.
3. **Email Templates** → create a template (see variables below). Set its **To Email** to
   `{{to_email}}`.
4. Copy your **Service ID**, **Template ID**, and **Public Key** into `public/config.js`.
5. Commit & push — GitHub Actions redeploys automatically.

Template variables passed by the app: `{{to_email}}`, `{{summary_role}}`,
`{{summary_data_type}}`, `{{summary_considerations}}`, `{{pdf_link}}`.

### B) Self-hosted Node server (real Gmail attachment)
`server.js` (Express + Nodemailer) sends via Gmail SMTP and attaches the PDF directly.
Use this if you want the PDF as a true attachment rather than a link.

```bash
npm install
cp .env.example .env     # fill in SMTP_USER, SMTP_PASS (Gmail App Password), FROM_EMAIL
npm start                # http://localhost:3000
```
Deploy this version on a Node host (e.g. Render — see `render.yaml`). Not GitHub Pages.

## 3. Project structure
```
dpdpa-tool/
├─ public/                         # the static site (what GitHub Pages serves)
│  ├─ index.html                   # landing page + questionnaire + EmailJS send
│  ├─ config.js                    # EmailJS keys (public, safe)
│  ├─ trilegal-logo.svg / hero.svg
│  └─ DPDPA-Compliance-Roadmap.pdf # emailed roadmap (linked from the email)
├─ server.js                       # optional Node backend (attachment version)
├─ assets/DPDPA-Compliance-Roadmap.pdf
├─ render.yaml                     # deploy config for the Node version
├─ .github/workflows/deploy-pages.yml
└─ .env / .env.example             # credentials for the Node version (git-ignored)
```

## 4. Customising
- **Change the roadmap:** replace `public/DPDPA-Compliance-Roadmap.pdf` (and `assets/...`).
- **Change email wording:** edit the EmailJS template (version A) or `buildEmail()` in
  `server.js` (version B).
- **Sender name:** EmailJS template "From Name" (A) or `FROM_NAME` (B).

## 5. Notes
- "Trilegal" and the bundled roadmap PDF are the property of Trilegal; this is a
  demonstration clone.
- The roadmap is informational only and is **not legal advice**.
