"""
Email service – sends transactional emails via the configured provider.

Supports:
- SendGrid (SENDGRID_API_KEY)
- SMTP (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS)
- Mailgun (MAILGUN_API_KEY, MAILGUN_DOMAIN)

The caller should not need to know which provider is configured; the service
auto-detects based on available environment variables.
"""

from __future__ import annotations

import logging
import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Any

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Provider detection
# ---------------------------------------------------------------------------

_SENDGRID_KEY = os.getenv("SENDGRID_API_KEY")
_SMTP_HOST = os.getenv("SMTP_HOST")
_MAILGUN_KEY = os.getenv("MAILGUN_API_KEY")
_MAILGUN_DOMAIN = os.getenv("MAILGUN_DOMAIN")
_FROM_EMAIL = os.getenv("EMAIL_FROM", "noreply@quantumelodic.com")
_FROM_NAME = os.getenv("EMAIL_FROM_NAME", "Quantumelodic")


# ---------------------------------------------------------------------------
# Internal send helpers
# ---------------------------------------------------------------------------


def _send_via_sendgrid(to: str, subject: str, html_body: str, text_body: str) -> bool:
    try:
        import sendgrid  # type: ignore
        from sendgrid.helpers.mail import Mail, Email, To, Content  # type: ignore

        sg = sendgrid.SendGridAPIClient(api_key=_SENDGRID_KEY)
        message = Mail(
            from_email=Email(_FROM_EMAIL, _FROM_NAME),
            to_emails=To(to),
            subject=subject,
            plain_text_content=Content("text/plain", text_body),
            html_content=Content("text/html", html_body),
        )
        response = sg.client.mail.send.post(request_body=message.get())
        return response.status_code in (200, 202)
    except Exception as exc:
        logger.error("SendGrid send failed: %s", exc)
        return False


def _send_via_mailgun(to: str, subject: str, html_body: str, text_body: str) -> bool:
    try:
        import requests  # type: ignore

        response = requests.post(
            f"https://api.mailgun.net/v3/{_MAILGUN_DOMAIN}/messages",
            auth=("api", _MAILGUN_KEY),
            data={
                "from": f"{_FROM_NAME} <{_FROM_EMAIL}>",
                "to": [to],
                "subject": subject,
                "text": text_body,
                "html": html_body,
            },
            timeout=10,
        )
        return response.ok
    except Exception as exc:
        logger.error("Mailgun send failed: %s", exc)
        return False


def _send_via_smtp(to: str, subject: str, html_body: str, text_body: str) -> bool:
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{_FROM_NAME} <{_FROM_EMAIL}>"
        msg["To"] = to
        msg.attach(MIMEText(text_body, "plain"))
        msg.attach(MIMEText(html_body, "html"))

        smtp_host = _SMTP_HOST or "localhost"
        smtp_port = int(os.getenv("SMTP_PORT", "587"))
        smtp_user = os.getenv("SMTP_USER", "")
        smtp_pass = os.getenv("SMTP_PASS", "")

        with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as server:
            server.ehlo()
            if smtp_port in (587, 2587):
                server.starttls()
            if smtp_user:
                server.login(smtp_user, smtp_pass)
            server.sendmail(_FROM_EMAIL, [to], msg.as_string())
        return True
    except Exception as exc:
        logger.error("SMTP send failed: %s", exc)
        return False


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def send_email(
    to: str,
    subject: str,
    html_body: str,
    text_body: str | None = None,
) -> bool:
    """
    Send a transactional email to the given recipient.

    Args:
        to: Recipient email address.
        subject: Email subject line.
        html_body: HTML content of the email.
        text_body: Plain-text fallback (auto-generated from html_body if omitted).

    Returns:
        True on success, False on failure.
    """
    if text_body is None:
        # Very simple HTML → text stripping
        import re
        text_body = re.sub(r"<[^>]+>", "", html_body)

    if _SENDGRID_KEY:
        logger.info("Sending via SendGrid to %s", to)
        return _send_via_sendgrid(to, subject, html_body, text_body)
    elif _MAILGUN_KEY and _MAILGUN_DOMAIN:
        logger.info("Sending via Mailgun to %s", to)
        return _send_via_mailgun(to, subject, html_body, text_body)
    elif _SMTP_HOST:
        logger.info("Sending via SMTP to %s", to)
        return _send_via_smtp(to, subject, html_body, text_body)
    else:
        logger.warning("No email provider configured. Email to %s NOT sent.", to)
        return False


def send_welcome_email(to: str, name: str) -> bool:
    """Send a welcome email to a new Quantumelodic user."""
    frontend_url = os.getenv("FRONTEND_URL", "https://quantumelodic.com")
    subject = "Welcome to Quantumelodic 🎶"
    html_body = f"""
    <html><body>
    <h1>Welcome to Quantumelodic, {name}!</h1>
    <p>Your cosmic musical journey begins now.</p>
    <p>
      <a href="{frontend_url}">Open your chart →</a>
    </p>
    <p>With cosmic harmonics,<br/>The Quantumelodic Team</p>
    </body></html>
    """
    return send_email(to, subject, html_body)


def send_report_email(to: str, name: str, report_html: str) -> bool:
    """Send a Quantumelodic report email to a user."""
    subject = f"Your Quantumelodic Report, {name}"
    html_body = f"""
    <html><body>
    <h1>Your Quantumelodic Report</h1>
    {report_html}
    <hr/>
    <p><small>Generated by Quantumelodic</small></p>
    </body></html>
    """
    return send_email(to, subject, html_body)
