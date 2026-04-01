const nodemailer = require("nodemailer");
const Mailgen = require("mailgen");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

const mailGenerator = new Mailgen({
  theme: "default",
  product: {
    name: "BugScope",
    link: "https://bugscope.com",
    logo: "https://via.placeholder.com/200x50?text=BugScope",
  },
});

async function sendInviteEmail(email, inviteCode) {
  try {
    const inviteLink = `http://localhost:3000/accept-invite/${inviteCode}`;

    const emailBody = {
      body: {
        name: email,
        intro: "You have been invited to join BugScope!",
        action: {
          instructions: "Click the button below to accept the invitation:",
          button: {
            color: "#5469d4",
            text: "Accept Invitation",
            link: inviteLink,
          },
        },
        outro:
          "If you did not expect this invitation, you can ignore this email.",
      },
    };

    const emailHtml = mailGenerator.generate(emailBody);
    const emailText = mailGenerator.generatePlaintext(emailBody);

    const mailOptions = {
      from: process.env.SMTP_EMAIL,
      to: email,
      subject: "You're invited to BugScope! 🚀",
      html: emailHtml,
      text: emailText,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Invitation email sent to ${email}`);
    return true;
  } catch (error) {
    console.error("Email send failed:", error.message);
    return false;
  }
}

module.exports = { sendInviteEmail };