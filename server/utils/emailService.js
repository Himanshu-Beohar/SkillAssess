const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.FROM_EMAIL || 'skillassess@gyanovation.com';
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'contact@gyanovation.com';

function wrapTemplate(title, body) {
  return `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border:1px solid #eee; border-radius:8px; overflow:hidden;">
    <div style="background:#007BFF; padding:16px; color:white; font-size:20px; font-weight:bold;">
      ${title}
    </div>
    <div style="padding:20px; color:#333; line-height:1.6;">
      ${body}
    </div>
    <div style="background:#f8f9fa; padding:12px; font-size:12px; color:#666; text-align:center;">
      © ${new Date().getFullYear()} Skillassess. All rights reserved.
    </div>
  </div>`;
}

// Define from field configurations for different email types
const FROM_CONFIG = {
  DEFAULT: FROM_EMAIL,
  PAYMENT: `Skillassess Payment <${FROM_EMAIL}>`,
  WELCOME: `Skillassess Welcome <${FROM_EMAIL}>`,
  RESULTS: `Skillassess Results <${FROM_EMAIL}>`,
  SUPPORT: `Skillassess Support <${FROM_EMAIL}>`,
  PASSWORD: `Skillassess Security <${FROM_EMAIL}>`
};

const emailService = {
  async sendEmail({ to, subject, html, fromType = 'DEFAULT' }) {
    try {
      // Get the appropriate from field based on fromType
      const from = FROM_CONFIG[fromType] || FROM_CONFIG.DEFAULT;
      
      const response = await resend.emails.send({
        from: from,
        to: Array.isArray(to) ? to : [to],
        subject,
        html
      });
      console.log(`✅ Email sent to ${to}: ${subject}`, response);
      return true;
    } catch (err) {
      console.error(`❌ Failed to send email to ${to}:`, err);
      return false;
    }
  },

  // async sendWelcomeEmail(user) {
  //   const subject = '🎉 Welcome to Skillassess!';
  //   const html = wrapTemplate(
  //     "Welcome to Skillassess",
  //     `<p>Hi ${user.name || ''},</p>
  //      <p>We're excited to have you on board. Start exploring assessments and boost your knowledge today 🚀.</p>
  //      <p style="margin-top:20px;">Cheers,<br/>The Skillassess Team</p>`
  //   );
  //   return this.sendEmail({ 
  //     to: [user.email, SUPPORT_EMAIL], 
  //     subject, 
  //     html, 
  //     fromType: 'WELCOME' 
  //   });
  // },

  async sendWelcomeEmail(user) {
    const subject = '🎉 Welcome to Skillassess – Let’s Get Started!';
    const html = wrapTemplate(
      "Welcome to Skillassess",
      `
        <p>Hi ${user.name || ''},</p>
        <p>Welcome aboard! Skillassess is your one-stop platform to <strong>practice, prepare, and master skills</strong> through curated online assessments.</p>
        
        <h3>Here’s what you can do:</h3>
        <ul>
          <li>🚀 Explore free and premium assessments across various skills.</li>
          <li>📊 Track your progress with detailed results and analytics.</li>
          <li>🏆 Benchmark your performance against others.</li>
          <li>💡 Learn faster with personalized feedback.</li>
        </ul>
        
        <p style="text-align:center; margin:20px 0;">
          <a href="${process.env.CLIENT_URL || 'https://skillassess.gyanovation.com'}" 
            style="background:#28a745; color:white; padding:14px 28px; text-decoration:none; border-radius:6px; font-weight:bold;">
            Start Exploring
          </a>
        </p>
        
        <p>We’re thrilled to have you and can’t wait to see your progress!</p>
        <p style="margin-top:20px;">Cheers,<br/>The Skillassess Team</p>
      `
    );
    return this.sendEmail({ 
      to: [user.email, SUPPORT_EMAIL], 
      subject, 
      html, 
      fromType: 'WELCOME' 
    });
  },


  async sendPaymentConfirmation(user, payment) {
    const subject = '✅ Payment Confirmation – Your Assessment Awaits';
    const html = wrapTemplate(
      "Payment Successful",
      `
        <p>Hi ${user.name || ''},</p>
        <p>Thank you for your payment! 🎉 Your order has been confirmed and you’re now ready to start your assessment journey.</p>
        
        <h3>Order Details:</h3>
        <p><strong>Order ID:</strong> ${payment.razorpay_order_id}</p>
        <p><strong>Amount Paid:</strong> ₹${payment.amount}</p>
        
        <p style="text-align:center; margin:20px 0;">
          <a href="${process.env.CLIENT_URL || 'https://skillassess.gyanovation.com'}/my-assessments" 
            style="background:#007BFF; color:white; padding:14px 28px; text-decoration:none; border-radius:6px; font-weight:bold;">
            Start My Assessment
          </a>
        </p>
        
        <p>If you have any questions or face issues, reach out at <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>.</p>
        
        <p style="margin-top:20px;">Best of luck 🎯,<br/>Team Skillassess</p>
      `
    );
    return this.sendEmail({ 
      to: [user.email, SUPPORT_EMAIL], 
      subject, 
      html, 
      fromType: 'PAYMENT' 
    });
  },


  async sendAssessmentResult(user, assessment, result) {
    const subject = `📊 Your Results for ${assessment.title}`;
    const percentage = Math.round((result.score / result.total) * 100);
    const status = percentage >= 60 ? "🎉 Great job! You passed." : "💡 Don’t worry, keep practicing!";
    
    const html = wrapTemplate(
      "Assessment Results",
      `
        <p>Hi ${user.name || ''},</p>
        <p>You’ve completed the assessment <strong>${assessment.title}</strong>.</p>
        
        <h3>Your Performance:</h3>
        <p><strong>Score:</strong> ${result.score} / ${result.total} (${percentage}%)</p>
        <p><strong>Status:</strong> ${status}</p>
        
        <h3>What’s Next?</h3>
        <ul>
          <li>📚 Review your weak areas and reattempt assessments.</li>
          <li>🏆 Aim for a higher score to benchmark your skills.</li>
          <li>🚀 Explore related assessments to expand your knowledge.</li>
        </ul>
        
        <p style="text-align:center; margin:20px 0;">
          <a href="${process.env.CLIENT_URL || 'https://skillassess.gyanovation.com'}/assessments" 
            style="background:#17a2b8; color:white; padding:14px 28px; text-decoration:none; border-radius:6px; font-weight:bold;">
            Practice More
          </a>
        </p>
        
        <p style="margin-top:20px;">Keep learning and growing 💪,<br/>Team Skillassess</p>
      `
    );
    return this.sendEmail({ 
      to: [user.email, SUPPORT_EMAIL], 
      subject, 
      html, 
      fromType: 'RESULTS' 
    });
  },


  async sendPasswordResetEmail(user, resetToken) {
    const resetUrl = `${process.env.CLIENT_URL || 'https://skillassess.gyanovation.com'}/reset-password/${resetToken}`;
    const subject = '🔑 Reset Your Password';
    const html = wrapTemplate(
      "Password Reset",
      `<p>Hi ${user.name || ''},</p>
       <p>We received a request to reset your password. Click the button below to continue:</p>
       <p style="text-align:center; margin:20px 0;">
         <a href="${resetUrl}" style="background:#007BFF; color:white; padding:12px 24px; text-decoration:none; border-radius:6px;">Reset Password</a>
       </p>
       <p>If you didn't request this, you can safely ignore this email.</p>`
    );
    return this.sendEmail({ 
      to: [user.email, SUPPORT_EMAIL], 
      subject, 
      html, 
      fromType: 'PASSWORD' 
    });
  }
};

module.exports = emailService;