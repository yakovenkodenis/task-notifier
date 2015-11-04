import nodemailer from 'nodemailer';


export default class EmailController {

    static sendEmail = (mailOptions) => {
        let transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: process.env.gmail_address,
                pass: process.env.gmail_pass
            }
        })
    }
}
