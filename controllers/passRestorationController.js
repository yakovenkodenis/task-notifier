import { MongoClient } from 'mongodb';
import { format } from 'util';
import qs from 'querystring';
import fs from 'fs';

import { Generator, Parser as parser } from '../helpers/utils';
import ApplicationController from './applicationController';
import EmailController from './emailController';
import MainController from './mainController';
import TemplateEngine from '../helpers/templateEngine';
import RestorationLink from '../models/restorationLink';
import Session from '../models/session';
import User from '../models/user';
import routes from '../routes/routes';
import errors from '../helpers/errors';


export default class PasswordRestorationController extends ApplicationController {

    getForgotPassPage(formData) {
        const path = routes.forgotPassPage.view;
        let view = fs.readFileSync(path, 'utf-8');
        let processedView = TemplateEngine(view, { data: formData });
        this.render(processedView);
    }

    async getChangePassPage(formData) {
        let query = require('url').parse(this.request.url, true).query;

        console.log(query);
        if(!this.query) {
            this.query = query.restore;
        }

        let linkObj = await this.getRestorationLinkObject(query);

        if (linkObj) {
            GLOBAL.restorationContext = linkObj;
            console.log(linkObj);
            const path = routes.changePassPage.view;
            let view = fs.readFileSync(path, 'utf-8');
            let processedView = TemplateEngine(view, {data: formData});
            this.render(processedView);
        } else {
            this.response.writeHead(302,
                { Location: (this.request.socket.encrypted ? 'https://' : 'http://')
                            + this.request.headers.host + routes.loginPage.url });
            this.response.end();
        }
    }

    attemptChangePassword() {
        let reqBody = '';
        this.request.on('data', (data) => {
            reqBody += data;
            if (reqBody.length > 1e7) { // 10mb
                this.response.writeHead(413, 'Request Entity Too Large',
                    { 'Content-Type': 'text/html'});
                this.response.write('Too large data. Server cannot handle this.');
                this.response.end();
            }
        });
        this.request.on('end', async (data) => {
            let formData = qs.parse(reqBody);

            formData["requestResult"] = this.validateChangePassInput(formData);
            if (formData.requestResult.error) { // validations fails
                await this.getChangePassPage(formData);
            } else {
                console.log("BEFORE CHANGING\n", formData.passwordConfirmation);
                console.log("EMAIL:\t", restorationContext.email);
                await this.changePasswordInDB(restorationContext.email, formData.password);
                console.log("AFTER CHANGING\n");
                this.response.writeHead(302,
                    { Location: (this.request.socket.encrypted ? 'https://' : 'http://')
                                + this.request.headers.host + routes.loginPage.url });
                this.response.end();
            }
        });
    }

    attemptSendRestorationInstructions() {
        let reqBody = '';
        this.request.on('data', (data) => {
            reqBody += data;
            if (reqBody.length > 1e7) { // 10mb
                this.response.writeHead(413, 'Request Entity Too Large',
                    { 'Content-Type': 'text/html'});
                this.response.write('Too large data. Server cannot handle this.');
                this.response.end();
            }
        });
        this.request.on('end', async (data) => {
            let formData = qs.parse(reqBody);

            formData["requestResult"] = await this.validateUserInput(formData);
            if (formData.requestResult.error) { // validations fails
                this.getForgotPassPage(formData);
            } else {
                console.log("BEFORE RESTORATION\n", formData.email);
                if (!this.email) {
                    this.email = formData.email;
                }
                await this.sendRestorationInstructions(formData.email);
                console.log("AFTER RESTORATION\n");
                formData['requestResult'] = 'success';
                this.getForgotPassPage(formData);
            }
        });
    }

    async sendRestorationInstructions(email) {
        console.log("INITIATE EMAIL SENDING");
        let { name } = await this.getUser(email);
        name = name.split(' ')[0];
        console.log("NAME:\t", name);
        let url = `${this.request.headers.host}${routes.changePassPage.url}`;
        console.log("URL\n", url);
        let { link, uuid } = new Generator().generateRestorationLink(url);
        console.log("STUFF:\n", uuid, '\n', link);
        await this.addRestorationLinkToDB(uuid, email, 8000  * 60 * 60);
        let message = EmailController.composePassRestorationMessage({ name, link });
        EmailController.sendEmail({
            from: 'Denis Yakovenko <yakovenko.denis.a@gmail.com>',
            to: email,
            subject: 'Password Restoration',
            text: message.text,
            html: message.html
        });
        console.log("FINISH EMAIL SENDING");
    }

    async addRestorationLinkToDB(uuid, email, timeToIvalidate) {
        let db = await MongoClient.connect('mongodb://127.0.0.1:27017/notificator');
        try {
            let collection = db.collection('restoration_links');

            let linkObj = new RestorationLink(email, uuid, true);

            await collection.save(linkObj.serialize,
                { writeConcern: { w: "majority", wtimeout: 5000 }});

            setTimeout(async () => await this.invalidateRestorationLink(uuid, email),
                       timeToIvalidate);
        } finally {
            db.close();
        }
    }

    async getRestorationLinkObject(query) {
        let uuid = query.restore;
        console.log("RESTORATION QUERY:\n", uuid);
        let db = await MongoClient.connect('mongodb://127.0.0.1:27017/notificator');
        try {
            let collection = db.collection('restoration_links');
            let link = (await collection.findOne({ uuid, is_valid: true }));
            return link;
        } finally {
            db.close();
        }
    }

    async getUser(email) {
        let db = await MongoClient.connect('mongodb://127.0.0.1:27017/notificator');
        try {
            let collection = db.collection('users');
            let user = (await collection.findOne(
                {
                    email: email
                }));
            return user;
        } finally {
            db.close();
        }
    }

    async invalidateRestorationLink(uuid, email) {
        let db = await MongoClient.connect('mongodb://127.0.0.1:27017/notificator');
        try {
            let links = db.collection('restoration_links');

            let linkExists = (await links.find(
                {
                    is_valid: true,
                    uuid,
                    email
                }).limit(1).count()) > 0;

            if (linkExists) {
                await links.update(
                    {
                        is_valid: true,
                        uuid,
                        email
                    },
                    { $set: {
                        is_valid: false
                    }},
                    { writeConcern: { w: "majority", wtimeout: 5000 }});
            }

        } catch(err) {console.log(err)} finally {
            db.close();
        }
    }

    async validateUserInput(formData) {

        let messages = [];

        if (!formData.email) {
            messages.push(errors.noEmailField);
        }

        if (formData.email && formData.email.length > 0) {
            let userExists = await this.userExistsInDB(formData.email);

            if(!userExists) {
                messages.push(errors.userDoesNotExist);
            }
        }

        if (messages.length > 0) {
            return {
                error: messages
            }
        }
        return true;
    }

    validateChangePassInput(formData) {

        let messages = [];

        if (!formData.password) {
            messages.push(errors.noPasswordField);
        }

        if (!formData.passwordConfirmation) {
            messages.push(errors.noPasswordConfirmationField);
        }

        if (formData.password && formData.password.length < 5) {
            messages.push(errors.passwordValidationFail);
        }

        if (formData.password && formData.passwordConfirmation &&
            formData.password !== formData.passwordConfirmation) {
            messages.push(errors.passwordsDontMatch);
        }

        if (messages.length > 0) {
            return {
                error: messages
            }
        }
        return true;
    }

    async changePasswordInDB(email, password) {
        let db = await MongoClient.connect('mongodb://127.0.0.1:27017/notificator');
        try {
            let users = db.collection('users');
            let links = db.collection('restoration_links');

            let userExists = await this.userExistsInDB(email);

            if (userExists) {
                await users.update({ email },
                    { $set: {
                        password: new Generator().encodeMD5(password)
                    }},
                    { writeConcern: { w: "majority", wtimeout: 5000 }});

                console.log("BEFORE INVALIDATION:\n", restorationContext.uuid);
                await this.invalidateRestorationLink(restorationContext.uuid, email);
            }

        } catch(err) {console.log(err)} finally {
            db.close();
        }
    }

    async userExistsInDB(email) {
        let db = await MongoClient.connect('mongodb://127.0.0.1:27017/notificator');
        try {
            let collection = db.collection('users');
            let userCount = (await collection.find(
                {
                    email: email
                }).limit(1).count());
            return userCount > 0;
        } finally {
            db.close();
        }
    }
}
