require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;
const PDF_PATH = path.join(__dirname, 'assets', 'DPDPA-Compliance-Roadmap.pdf');

// ---------------------------------------------------------------------------
// Build a transporter from .env (created lazily so the server boots even if
// credentials are not yet configured — you'll just get a clear error on send).
// ---------------------------------------------------------------------------
function makeTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 465,
    secure: String(process.env.SMTP_SECURE) === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

// ---------------------------------------------------------------------------
// Turn the questionnaire answers into a short, human-readable profile that we
// drop into the email so each recipient gets a little detail about their result.
// ---------------------------------------------------------------------------
function buildProfile(a) {
  // a = { q1, q2, q3, q4 (array), q5 (email) }
  const inScope = a.q1 === 'yes';

  let role = 'Data Fiduciary';
  if (a.q2 === 'behalf') role = 'Data Processor';

  let dataType = 'Internal-facing (employees, contractors, vendors, visitors).';
  if (a.q3 === 'customers') dataType = 'External-facing (interface with individual customers; B2C).';

  const q4 = Array.isArray(a.q4) ? a.q4 : [];
  const considerations = [];
  if (q4.includes('children')) considerations.push('Processing of personal data of children or persons with disabilities');
  if (q4.includes('cross_border')) considerations.push('Transfer of personal data outside India');
  if (q4.includes('large_volume')) considerations.push('Large-volume / sensitive / higher-risk processing');
  if (considerations.length === 0) considerations.push('No additional risk factors flagged');

  return { inScope, role, dataType, considerations };
}

function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c]);
}

// ---------------------------------------------------------------------------
// Email content — the exact disclaimer text you supplied, plus a short
// tailored summary block.
// ---------------------------------------------------------------------------
function buildEmail(profile) {
  const subject = 'Your DPDPA Compliance Roadmap';

  const summaryLines = [
    `Primary role under DPDPA: ${profile.role}`,
    `Primary personal data type: ${profile.dataType}`,
    `Additional considerations: ${profile.considerations.join('; ')}.`,
  ];

  const text =
`Thank you for completing the DPDPA Compliance Roadmap questionnaire.

Based on your responses, please see attached a personalised preliminary DPDPA Compliance Roadmap.

A quick snapshot of your responses:
- ${summaryLines.join('\n- ')}

This roadmap is provided solely for general informational and educational purposes. It does not constitute legal advice and should not be relied upon as a substitute for a detailed legal review. You are advised to seek legal advice before acting on any information contained in this report. Please feel free to share it with your legal advisors for further guidance.
__

Trilegal

CONFIDENTIALITY NOTE
This communication (including any accompanying documents) is intended only for the use of the addressee(s) and contains information that is PRIVILEGED AND CONFIDENTIAL. Unauthorized reading, dissemination, distribution or copying of this communication is prohibited. If you have received this communication in error, please notify us immediately at https://www.trilegal.com/offices/ and promptly destroy the original communication. This email has been scanned for viruses and malware and has been automatically archived. Thank you for your cooperation.

Disclaimer

The information contained in this communication from the sender is confidential. It is intended solely for use by the recipient and others authorized to receive it. If you are not the recipient, you are hereby notified that any disclosure, copying, distribution or taking action in relation of the contents of this information is strictly prohibited and may be unlawful.

This email has been scanned for viruses and malware, and may have been automatically archived by Mimecast Ltd, an innovator in Software as a Service (SaaS) for business. Providing a safer and more useful place for your human generated data. Specializing in; Security, archiving and compliance.`;

  const html =
`<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#1a2233;max-width:640px;">
  <p>Thank you for completing the DPDPA Compliance Roadmap questionnaire.</p>
  <p>Based on your responses, please see attached a personalised preliminary DPDPA Compliance Roadmap.</p>

  <table style="border-collapse:collapse;background:#f3f6fb;border-left:4px solid #1b3a6b;margin:18px 0;width:100%;">
    <tr><td style="padding:14px 16px;">
      <div style="font-weight:bold;color:#1b3a6b;margin-bottom:8px;">A quick snapshot of your responses</div>
      <div>${summaryLines.map(escapeHtml).join('<br>')}</div>
    </td></tr>
  </table>

  <p>This roadmap is provided solely for general informational and educational purposes. It does not constitute legal advice and should not be relied upon as a substitute for a detailed legal review. You are advised to seek legal advice before acting on any information contained in this report. Please feel free to share it with your legal advisors for further guidance.</p>
  <p style="color:#888;">__</p>
  <p style="font-weight:bold;">Trilegal</p>

  <p style="font-size:11px;color:#777;line-height:1.5;">
    <strong>CONFIDENTIALITY NOTE</strong><br>
    This communication (including any accompanying documents) is intended only for the use of the addressee(s) and contains information that is PRIVILEGED AND CONFIDENTIAL. Unauthorized reading, dissemination, distribution or copying of this communication is prohibited. If you have received this communication in error, please notify us immediately at <a href="https://www.trilegal.com/offices/">https://www.trilegal.com/offices/</a> and promptly destroy the original communication. This email has been scanned for viruses and malware and has been automatically archived. Thank you for your cooperation.
  </p>
  <p style="font-size:11px;color:#777;line-height:1.5;">
    <strong>Disclaimer</strong><br>
    The information contained in this communication from the sender is confidential. It is intended solely for use by the recipient and others authorized to receive it. If you are not the recipient, you are hereby notified that any disclosure, copying, distribution or taking action in relation of the contents of this information is strictly prohibited and may be unlawful.<br><br>
    This email has been scanned for viruses and malware, and may have been automatically archived by Mimecast Ltd, an innovator in Software as a Service (SaaS) for business. Providing a safer and more useful place for your human generated data. Specializing in; Security, archiving and compliance.
  </p>
</div>`;

  return { subject, text, html };
}

// ---------------------------------------------------------------------------
// Submit endpoint
// ---------------------------------------------------------------------------
app.post('/api/submit', async (req, res) => {
  try {
    const answers = req.body || {};
    const email = String(answers.q5 || '').trim();

    // Basic validation
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailOk) {
      return res.status(400).json({ ok: false, error: 'Please enter a valid email address.' });
    }
    if (!fs.existsSync(PDF_PATH)) {
      return res.status(500).json({ ok: false, error: 'Roadmap PDF not found on server.' });
    }

    const profile = buildProfile(answers);
    const { subject, text, html } = buildEmail(profile);

    const transporter = makeTransporter();

    await transporter.sendMail({
      from: `"${process.env.FROM_NAME || 'Trilegal'}" <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
      to: email,
      bcc: process.env.BCC_EMAIL || undefined,
      subject,
      text,
      html,
      attachments: [
        {
          filename: 'DPDPA-Compliance-Roadmap.pdf',
          path: PDF_PATH,
          contentType: 'application/pdf',
        },
      ],
    });

    // Lightweight audit log of submissions (no PII beyond what was submitted)
    fs.appendFileSync(
      path.join(__dirname, 'submissions.log'),
      JSON.stringify({ at: new Date().toISOString(), email, answers, profile }) + '\n'
    );

    return res.json({ ok: true });
  } catch (err) {
    console.error('Send failed:', err);
    return res.status(500).json({
      ok: false,
      error: 'We could not send the email. Please check the server SMTP settings and try again.',
    });
  }
});

// Health check
app.get('/api/health', (req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`DPDPA Compliance Tool running at http://localhost:${PORT}`);
  if (!process.env.SMTP_USER) {
    console.warn('⚠️  No SMTP credentials found. Copy .env.example to .env and fill it in before sending emails.');
  }
});
