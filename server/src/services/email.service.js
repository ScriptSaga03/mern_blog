import nodemailer from "nodemailer";

export const sendMails = async (options) => {
  try {
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;

    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT;
    if (!user || !pass || !host || !port) {
      throw new Error("Email credentials are missing");
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port == 465,
      auth: { user, pass },
    });

    // DEFINE MAIL OPTION
    const mailOptions = {
      from: `"YoBlogger" <${user}>`,
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: options.template,
    };

    //  SEND EMAIL
    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    throw error;
  }
};
