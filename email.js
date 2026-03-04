require("dotenv").config();
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
    }
});

const recipients = process.env.EMAIL_RECEIVERS.split(",");

async function sendEmail(subject, message){

    await transporter.sendMail({

        from: `"Marketplace Bot" <${process.env.GMAIL_USER}>`,
        to: recipients,
        subject: subject,
        text: message

    });

    console.log("Email sent");

}

module.exports = { sendEmail };