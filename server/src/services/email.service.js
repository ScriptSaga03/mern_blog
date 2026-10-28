
import  nodemailer from 'nodemailer'

export const sendVerificationEmail = async (toEmail, verificationUrl) => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    throw new Error("Email credentials are missing");
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });

  await transporter.sendMail({
    from: `"MERN Blog" <${user}>`,
    to: toEmail,
    subject: "Verify your MERN Blog email",
    text: `Verify your email using this link: ${verificationUrl}`,
    html: `
      <h2>Welcome to MERN Blog!</h2>
      <p>Please click the link below to verify your email:</p>
      <a href="${verificationUrl}">Verify Email</a>
      <p>This link will expire in 15 minutes.</p>
    `,
  });
};
