require("dotenv").config();
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

const recipients = (process.env.EMAIL_RECEIVERS || "")
  .split(",")
  .map((email) => email.trim())
  .filter(Boolean);

async function sendEmail(subject, textMessage, htmlMessage) {
  if (!recipients.length) {
    throw new Error("No recipients configured in EMAIL_RECEIVERS");
  }

  await transporter.sendMail({
    from: `"Marketplace Bot" <${process.env.GMAIL_USER}>`,
    to: recipients,
    subject: subject,
    text: textMessage,
    html: htmlMessage,
  });

  console.log("Email sent");
}

module.exports = { sendEmail };
