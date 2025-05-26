const path = require('path');

// Base URL for assets - adjust to use the backend folder
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';
const LOGO_URL = `${BACKEND_URL}/assets/logo.png`; // Using the logo.png from backend assets

// Add the html-to-text package
const { convert } = require('html-to-text');

/**
 * Creates a styled email template with consistent branding
 * @param {string} title - Email title
 * @param {string} content - Main email content (HTML)
 * @param {boolean} includeFooter - Whether to include the standard footer
 * @returns {Object} Object with html and text versions
 */
const createEmailTemplate = (title, content, includeFooter = true) => {
    const htmlEmail = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333333;
          margin: 0;
          padding: 0;
          background-color: #f9f9f9;
        }
        .email-container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
        }
        .email-header {
          background-color: #003366;
          padding: 20px;
          text-align: center;
        }
        .email-header img {
          max-height: 60px;
          width: auto;
        }
        .email-content {
          padding: 30px;
        }
        .email-footer {
          background-color: #f2f2f2;
          padding: 15px;
          text-align: center;
          font-size: 12px;
          color: #666666;
        }
        .btn {
          display: inline-block;
          background-color: #003366;
          color: white !important;
          text-decoration: none;
          padding: 10px 20px;
          border-radius: 4px;
          margin-top: 15px;
          font-weight: bold;
        }
        .otp-code {
          font-size: 28px;
          font-weight: bold;
          letter-spacing: 5px;
          background-color: #f2f2f2;
          padding: 15px;
          border-radius: 4px;
          margin: 20px 0;
          text-align: center;
          color: #003366;
        }
        h1 {
          color: #003366;
          margin-top: 0;
        }
        hr {
          border: none;
          border-top: 1px solid #eeeeee;
          margin: 20px 0;
        }
        .social-links {
          margin-top: 15px;
        }
        .social-links a {
          display: inline-block;
          margin: 0 5px;
          color: #003366;
          text-decoration: none;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        table td, table th {
          padding: 10px;
          border-bottom: 1px solid #eee;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="email-header">
          <img src="${LOGO_URL}" alt="Research Journal Logo">
        </div>
        <div class="email-content">
          <h1>${title}</h1>
          ${content}
        </div>
        ${includeFooter ? `
        <div class="email-footer">
          <p>© ${new Date().getFullYear()} Research Journal. All rights reserved.</p>
          <p>If you did not request this email, please ignore it or contact support.</p>
          <div class="social-links">
            <a href="https://twitter.com/researchjournal">Twitter</a> | <a href="https://linkedin.com/company/researchjournal">LinkedIn</a> | <a href="https://facebook.com/researchjournal">Facebook</a>
          </div>
        </div>` : ''}
      </div>
    </body>
    </html>
  `;

    // Create plain text version using html-to-text
    const textEmail = convert(htmlEmail, {
        selectors: [
            { selector: 'a', options: { hideLinkHrefIfSameAsText: true } },
            { selector: 'img', format: 'skip' }
        ],
        wordwrap: 80
    });

    return {
        html: htmlEmail,
        text: textEmail
    };
};

/**
 * Creates an OTP email with styled code display
 * @param {string} otp - The OTP code
 * @param {string} purpose - Purpose of the OTP (login, signup, password reset)
 * @param {string} name - Optional recipient name
 * @returns {string} HTML email content
 */
const createOtpEmail = (otp, purpose = 'verification', name = '') => {
    let greeting = name ? `Hello ${name},` : 'Hello,';
    let purposeText = '';

    switch (purpose) {
        case 'signup':
            purposeText = 'account registration';
            break;
        case 'login':
            purposeText = 'account login';
            break;
        case 'reset':
            purposeText = 'password reset';
            break;
        default:
            purposeText = 'verification';
    }

    const content = `
    <p>${greeting}</p>
    <p>Thank you for using our service. Your one-time password (OTP) for ${purposeText} is:</p>
    <div class="otp-code">${otp}</div>
    <p>This code is valid for 10 minutes. Please do not share this code with anyone.</p>
    <p>If you did not request this code, please ignore this email or contact support if you have concerns.</p>
    <hr>
    <p>Best regards,<br>Research Journal Team</p>
  `;

    // Return both HTML and text versions
    return createEmailTemplate(`Your OTP for ${purposeText}`, content);
};

/**
 * Creates a research paper submission confirmation email
 * @param {Object} paper - Research paper details 
 * @param {string} recipientType - 'author' or 'admin'
 * @returns {string} HTML email content
 */
const createPaperSubmissionEmail = (paper, recipientType = 'admin') => {
    let content = '';

    if (recipientType === 'admin') {
        content = `
      <p>Dear Admin,</p>
      <p>A new research paper has been submitted for review:</p>
      <p><strong>Title:</strong> ${paper.title}</p>
      <p><strong>Author:</strong> ${paper.author}</p>
      <p><strong>Email:</strong> ${paper.email}</p>
      <p><strong>Article Type:</strong> ${paper.articleType}</p>
      <p><strong>Journal:</strong> ${paper.journal}</p>
      <p>The paper submission is now pending your review. You can access it in the admin panel.</p>
      <p>The full paper is attached to this email.</p>
      <hr>
      <p>Best regards,<br>Research Journal System</p>
    `;
    } else {
        content = `
      <p>Dear ${paper.author},</p>
      <p>Thank you for submitting your research paper titled "<strong>${paper.title}</strong>" to our journal.</p>
      <p>Your submission details:</p>
      <ul>
        <li><strong>Submission Date:</strong> ${new Date().toLocaleDateString()}</li>
        <li><strong>Article Type:</strong> ${paper.articleType}</li>
        <li><strong>Journal:</strong> ${paper.journal}</li>
      </ul>
      <p>Your paper has been received and is currently pending review by our editorial team. You will be notified of any updates regarding your submission.</p>
      <p>You can track the status of your submission through your account dashboard.</p>
      <a href="${ASSETS_BASE_URL}/dashboard" class="btn">View Submission Status</a>
      <hr>
      <p>Best regards,<br>Research Journal Editorial Team</p>
    `;
    }

    return createEmailTemplate('Research Paper Submission', content);
};

/**
 * Creates a contact form submission email
 */
const createContactFormEmail = (data) => {
    const content = `
    <p>A new contact form submission has been received:</p>
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee; width: 30%;"><strong>Name:</strong></td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${data.name}</td>
      </tr>
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Email:</strong></td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;"><a href="mailto:${data.email}">${data.email}</a></td>
      </tr>
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Phone:</strong></td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${data.phone}</td>
      </tr>
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Subject:</strong></td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${data.subject}</td>
      </tr>
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Message:</strong></td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${data.message}</td>
      </tr>
      <tr>
        <td style="padding: 10px;"><strong>Submitted:</strong></td>
        <td style="padding: 10px;">${new Date().toLocaleString()}</td>
      </tr>
    </table>
    <p>Please respond to this inquiry at your earliest convenience.</p>
  `;

    return createEmailTemplate(`Contact Form: ${data.subject}`, content);
};

/**
 * Creates a password reset email
 */
const createPasswordResetEmail = (otp, name = '') => {
    const greeting = name ? `Hello ${name},` : 'Hello,';

    const content = `
    <p>${greeting}</p>
    <p>We received a request to reset your password. Use the following OTP code to complete your password reset:</p>
    <div class="otp-code">${otp}</div>
    <p>This code is valid for 10 minutes. If you did not request a password reset, please ignore this email or contact support if you believe this is an error.</p>
    <hr>
    <p>Best regards,<br>Research Journal Team</p>
  `;

    return createEmailTemplate('Password Reset Request', content);
};

/**
 * Creates a reviewer welcome email
 */
const createReviewerWelcomeEmail = (reviewer, password) => {
    const content = `
    <p>Dear ${reviewer.name},</p>
    <p>Congratulations! You have been selected as a reviewer for our research journal.</p>
    <p>Your account has been created with the following credentials:</p>
    <ul>
      <li><strong>Email:</strong> ${reviewer.email}</li>
      <li><strong>Temporary Password:</strong> ${password}</li>
    </ul>
    <p>For security reasons, please change your password after your first login.</p>
    <a href="${ASSETS_BASE_URL}/login" class="btn">Login to Your Account</a>
    <p>As a reviewer, you'll have access to submitted papers for peer review based on your area of specialization.</p>
    <p>If you have any questions, please contact our editorial team.</p>
    <hr>
    <p>Best regards,<br>Research Journal Editorial Board</p>
  `;

    return createEmailTemplate('Welcome to Our Research Journal Review Team', content);
};

/**
 * Creates a paper status update notification email
 * @param {Object} paper - Research paper details
 * @param {string} status - New status (accepted, rejected, revisions)
 * @param {string} comments - Optional reviewer comments
 * @returns {Object} Object with html and text versions
 */
const createPaperStatusEmail = (paper, status, comments = '') => {
    let statusTitle, statusMessage, buttonText, buttonColor;

    switch (status.toLowerCase()) {
        case 'accepted':
            statusTitle = '🎉 Your Paper Has Been Accepted!';
            statusMessage = 'Congratulations! We are pleased to inform you that your paper has been accepted for publication.';
            buttonText = 'View Publication Details';
            buttonColor = '#28a745';
            break;

        case 'rejected':
            statusTitle = 'Paper Review Decision';
            statusMessage = 'After careful consideration, we regret to inform you that your paper has not been accepted for publication.';
            buttonText = 'Submit New Paper';
            buttonColor = '#dc3545';
            break;

        case 'revisions':
            statusTitle = 'Revisions Requested for Your Paper';
            statusMessage = 'Your paper has been reviewed and we are requesting some revisions before making a final decision.';
            buttonText = 'View Revision Instructions';
            buttonColor = '#ffc107';
            break;

        default:
            statusTitle = 'Paper Status Update';
            statusMessage = `Your paper's status has been updated to: ${status}`;
            buttonText = 'View Paper Status';
            buttonColor = '#003366';
    }

    const content = `
        <p>Dear ${paper.author},</p>
        <p>${statusMessage}</p>
        <p><strong>Paper Title:</strong> ${paper.title}</p>
        <p><strong>Submission Date:</strong> ${new Date(paper.createdAt).toLocaleDateString()}</p>
        
        ${comments ? `
        <div style="background-color: #f5f5f5; padding: 15px; border-left: 4px solid ${buttonColor}; margin: 20px 0;">
            <h3>Reviewer Comments:</h3>
            <p>${comments}</p>
        </div>
        ` : ''}
        
        <p>You can view more details about your submission and any next steps by visiting your author dashboard.</p>
        
        <a href="${ASSETS_BASE_URL}/dashboard/papers/${paper._id}" class="btn" style="background-color: ${buttonColor};">${buttonText}</a>
        
        <hr>
        <p>If you have any questions, please contact our editorial team.</p>
        <p>Best regards,<br>Research Journal Editorial Team</p>
    `;

    return createEmailTemplate(statusTitle, content);
};

/**
 * Creates an email for reviewer assignments
 * @param {Object} reviewer - Reviewer details
 * @param {Object} paper - Paper being assigned
 * @param {string} token - Invitation token (if applicable)
 * @returns {Object} Object with html and text versions
 */
const createReviewerAssignmentEmail = (reviewer, paper, token = null) => {
    const inviteLink = token ?
        `${process.env.Client_URL}/reviewer/invite/${token}` :
        `${process.env.Client_URL}/reviewer/dashboard`;

    const viewPaperLink = `${process.env.BackendUrl}/api/uploads/${paper.filePath}`;

    const isNewReviewer = token !== null;

    const content = `
        <p>Dear ${reviewer.name || 'Academic Colleague'},</p>
        
        <p>${isNewReviewer ?
            'You have been invited to join our journal\'s review panel.' :
            'You have been assigned a new research paper to review.'}
        </p>
        
        <div style="margin: 25px 0; padding: 20px; border-radius: 5px; background-color: #f5f5f5; border-left: 4px solid #003366;">
            <h3 style="margin-top: 0; color: #003366;">Paper Details:</h3>
            <p><strong>Title:</strong> ${paper.title}</p>
            <p><strong>Author:</strong> ${paper.author}</p>
            <p><strong>Article Type:</strong> ${paper.articleType || 'Not specified'}</p>
            <p><strong>Abstract:</strong> ${paper.abstract || 'Not provided'}</p>
            <p><strong>Submission Date:</strong> ${new Date(paper.createdAt).toLocaleDateString()}</p>
        </div>
        
        <p>Your expertise in ${reviewer.areaOfSpecialization || 'this field'} would be valuable in evaluating this submission.</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="${viewPaperLink}" class="btn" style="display: inline-block; background-color: #003366; color: white !important; text-decoration: none; padding: 12px 25px; border-radius: 4px; margin: 10px; font-weight: bold;">View Research Paper</a>
            
            <a href="${inviteLink}" class="btn" style="display: inline-block; background-color: #28a745; color: white !important; text-decoration: none; padding: 12px 25px; border-radius: 4px; margin: 10px; font-weight: bold;">
                ${isNewReviewer ? 'Accept Invitation' : 'Go To Dashboard'}
            </a>
        </div>
        
        ${isNewReviewer ?
            '<p><strong>Note:</strong> The invitation link will expire in 7 days.</p>' :
            '<p>Please complete your review within the designated timeframe. Your timely feedback is crucial for our publication process.</p>'}
        
        <hr>
        <p>Thank you for contributing your expertise to maintain the quality of scholarly publications in our field.</p>
        <p>Best regards,<br>Editorial Board</p>
    `;

    return createEmailTemplate(
        isNewReviewer ? 'Invitation to Review Research Paper' : 'New Paper Assignment for Review',
        content
    );
};

module.exports = {
    createEmailTemplate,
    createOtpEmail,
    createPaperSubmissionEmail,
    createContactFormEmail,
    createPasswordResetEmail,
    createReviewerWelcomeEmail,
    createPaperStatusEmail,
    createReviewerAssignmentEmail
};