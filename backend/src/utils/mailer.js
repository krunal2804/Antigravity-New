function getTransporter() {
    // Lazy-load to avoid breaking server startup/login if dependency is missing.
    // Password reset endpoints will return a clear error instead.
    let nodemailer;
    try {
        // eslint-disable-next-line global-require
        nodemailer = require('nodemailer');
    } catch (err) {
        throw new Error('Email dependency not installed. Run npm install in backend.');
    }

    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 587);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
        throw new Error('SMTP is not configured. Please set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS.');
    }

    return nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
    });
}

async function sendViaResend(email, code) {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.MAIL_FROM;

    if (!apiKey) {
        throw new Error('RESEND_API_KEY is not configured.');
    }
    if (!from) {
        throw new Error('MAIL_FROM is not configured.');
    }

    const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            from,
            to: [email],
            subject: 'GovernX Password Reset Code',
            text: `Your GovernX password reset code is ${code}. This code expires in 5 minutes. If you did not request this reset, you can ignore this email.`,
        }),
    });

    if (!response.ok) {
        let detail = 'Unknown provider error';
        try {
            const data = await response.json();
            detail = data?.message || JSON.stringify(data);
        } catch (err) {
            detail = await response.text();
        }
        throw new Error(`Resend send failed: ${detail}`);
    }
}

async function sendPasswordResetCode(email, code) {
    // Prefer Resend API if configured (recommended for domain sender identities like aiintern@faberinfinite.com).
    if (process.env.RESEND_API_KEY) {
        await sendViaResend(email, code);
        return;
    }

    const transporter = getTransporter();
    const from = process.env.MAIL_FROM || process.env.SMTP_USER;
    const subject = 'GovernX Password Reset Code';
    const text = `Your GovernX password reset code is ${code}. This code expires in 5 minutes. If you did not request this reset, you can ignore this email.`;

    await transporter.sendMail({
        from,
        to: email,
        subject,
        text,
    });
}

module.exports = { sendPasswordResetCode };
