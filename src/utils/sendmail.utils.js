import { Env } from "../config/env.js";
import transporter from "../config/mailer.js";

const sendMail = async (to, firstName) => {
  const mailMessage = `
        <h1>Hello ${firstName}, Thanks fro joining us!</h1>
        <p>
            Chatting and connection on school campus is going to be so simple now.<br/>
            Enjoy your time here with us.
        </p>
    `;

  const mail = await transporter.sendMail({
    to,
    subject: "Welcome to IUTschoolNews",
    from: Env.OAUTH_USER,
    html: mailMessage,
  });
};

export default sendMail;
