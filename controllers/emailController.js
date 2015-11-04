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
}
