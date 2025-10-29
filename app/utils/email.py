from fastapi import BackgroundTasks
from typing import List, Dict, Any, Optional
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from app.core.config import settings

logger = logging.getLogger(__name__)

def send_email(
    email_to: str,
    subject: str,
    html_content: str,
    text_content: Optional[str] = None
) -> bool:
    """Send an email using SMTP settings from config"""
    if not settings.SMTP_ENABLED:
        logger.info(f"Email sending is disabled. Would have sent to {email_to}: {subject}")
        return False
    
    if not settings.SMTP_SERVER or not settings.SMTP_USERNAME or not settings.SMTP_PASSWORD:
        logger.error("SMTP settings are not configured properly")
        return False
    
    # Create message
    message = MIMEMultipart("alternative")
    message["Subject"] = subject
    message["From"] = settings.SMTP_SENDER_EMAIL
    message["To"] = email_to
    
    # Add text content if provided, otherwise create from HTML
    if text_content is None:
        # Simple conversion from HTML to text (not perfect but works for basic emails)
        text_content = html_content.replace('<br>', '\n').replace('<p>', '\n').replace('</p>', '\n')
        text_content = ''.join(c for c in text_content if ord(c) < 128)  # Remove non-ASCII chars
    
    # Attach parts
    part1 = MIMEText(text_content, "plain")
    part2 = MIMEText(html_content, "html")
    message.attach(part1)
    message.attach(part2)
    
    try:
        # Connect to server and send
        server = smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT)
        if settings.SMTP_TLS:
            server.starttls()
        
        server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
        server.sendmail(settings.SMTP_SENDER_EMAIL, email_to, message.as_string())
        server.quit()
        
        logger.info(f"Email sent successfully to {email_to}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {email_to}: {str(e)}")
        return False

def send_email_notification(
    email_to: str,
    subject: str,
    message: str
) -> bool:
    """Send a notification email with standard formatting"""
    html_content = f"""
    <html>
        <body>
            <h2>{subject}</h2>
            <p>{message}</p>
            <p>---</p>
            <p>This is an automated notification from AfriDiag.</p>
            <p>Please do not reply to this email.</p>
        </body>
    </html>
    """
    
    return send_email(
        email_to=email_to,
        subject=f"AfriDiag Notification: {subject}",
        html_content=html_content
    )

def send_password_reset(
    email_to: str,
    token: str,
    username: str
) -> bool:
    """Send a password reset email with a reset link"""
    reset_link = f"{settings.FRONTEND_URL}/reset-password?token={token}"
    
    html_content = f"""
    <html>
        <body>
            <h2>Password Reset Request</h2>
            <p>Hello {username},</p>
            <p>We received a request to reset your password for your AfriDiag account.</p>
            <p>To reset your password, please click the link below:</p>
            <p><a href="{reset_link}">Reset Password</a></p>
            <p>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
            <p>This link will expire in 24 hours.</p>
            <p>---</p>
            <p>AfriDiag Team</p>
        </body>
    </html>
    """
    
    return send_email(
        email_to=email_to,
        subject="AfriDiag Password Reset",
        html_content=html_content
    )





def send_email_notification(recipient_email: str, title: str, message: str) -> bool:
    """Send a notification email"""
    subject = f"AfriDiag Notification: {title}"
    
    # Create HTML content
    html_content = f"""
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background-color: #4CAF50; color: white; padding: 10px; text-align: center; }}
            .content {{ padding: 20px; border: 1px solid #ddd; }}
            .footer {{ font-size: 12px; color: #777; text-align: center; margin-top: 20px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2>AfriDiag Notification</h2>
            </div>
            <div class="content">
                <h3>{title}</h3>
                <p>{message}</p>
                <p>Please log in to your AfriDiag account to view more details.</p>
            </div>
            <div class="footer">
                <p>This is an automated message from AfriDiag. Please do not reply to this email.</p>
                <p>&copy; {settings.PROJECT_NAME} {settings.PROJECT_VERSION}</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    # Create plain text content
    text_content = f"""
    AfriDiag Notification
    
    {title}
    
    {message}
    
    Please log in to your AfriDiag account to view more details.
    
    This is an automated message from AfriDiag. Please do not reply to this email.
    """
    
    return send_email(recipient_email, subject, html_content, text_content)

def send_password_reset(recipient_email: str, reset_token: str, username: str) -> bool:
    """Send a password reset email"""
    subject = "AfriDiag Password Reset"
    
    # Create reset link
    reset_link = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}"
    
    # Create HTML content
    html_content = f"""
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background-color: #4CAF50; color: white; padding: 10px; text-align: center; }}
            .content {{ padding: 20px; border: 1px solid #ddd; }}
            .button {{ display: inline-block; background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; }}
            .footer {{ font-size: 12px; color: #777; text-align: center; margin-top: 20px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2>AfriDiag Password Reset</h2>
            </div>
            <div class="content">
                <p>Hello {username},</p>
                <p>We received a request to reset your password for your AfriDiag account.</p>
                <p>To reset your password, please click the button below:</p>
                <p style="text-align: center;">
                    <a href="{reset_link}" class="button">Reset Password</a>
                </p>
                <p>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
                <p>This link will expire in 24 hours.</p>
            </div>
            <div class="footer">
                <p>This is an automated message from AfriDiag. Please do not reply to this email.</p>
                <p>&copy; {settings.PROJECT_NAME} {settings.PROJECT_VERSION}</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    # Create plain text content
    text_content = f"""
    AfriDiag Password Reset
    
    Hello {username},
    
    We received a request to reset your password for your AfriDiag account.
    
    To reset your password, please visit the following link:
    {reset_link}
    
    If you did not request a password reset, please ignore this email or contact support if you have concerns.
    
    This link will expire in 24 hours.
    
    This is an automated message from AfriDiag. Please do not reply to this email.
    """
    
    return send_email(recipient_email, subject, html_content, text_content)