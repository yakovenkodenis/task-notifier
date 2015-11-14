import nodemailer from 'nodemailer';
import fs from 'fs';


export default class EmailController {

    static sendEmail(mailOptions) {
        const credentials = JSON.parse(fs.readFileSync('email_data.json'), 'utf-8');
        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: new Buffer(credentials.email.address, 'base64').toString('ascii'),
                pass: new Buffer(credentials.email.password, 'base64').toString('ascii')
            }
        });

        transporter.sendMail(mailOptions, (error, info) => {
            if(error) {
                console.log(error);
            }
            console.log(`Message sent: ${info.response}`);
        });
    }

    static sendEmailOnSpecificTime(mailOptions, date, time) {

      const dateTime = new Date(`${date} ${time}`);
      const now = new Date();

      console.log('NOW:\n', now);
      console.log('DELIVERY_TIME:\n', dateTime);

      let timeOffsetMillis = dateTime.getTime() - now.getTime();

      // console.log(`Email will be delivered on date ${dateTime}`);
      setTimeout(() => {
        (() => {
          if (dateTime >= now) {
            console.log('The notification email has been sent!');
            this.sendEmail(mailOptions);
          } else {
            console.log('The date has already passed');
          }
        })();
      }, timeOffsetMillis);
    }

    static composePassRestorationMessage(data) {
        return {
            html: `<h3>Hi, ${data.name}!</h3><br>To restore your password ` +
                  `click <a href="http://${data.link}" target="_blank">this link</a>` +
                  `<br>This link will be invalid in 8 hours.<br><br><p>` +
                  `If you didn't initiate the password ` +
                  `restoration just ignore this email</p>`,
            text: `Hi, ${data.name}!\nTo restore your password ` +
                  `click this link: ${data.link} \n` +
                  `This link will be invalid in 8 hours\n` +
                  `\n\nIf you didn't initiate the password ` +
                  `restoration just ignore this email`,
        }
    }
}
