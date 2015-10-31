import { MongoClient } from 'mongodb';
import { format } from 'util';
import qs from 'querystring';
import fs from 'fs';

import { Generator } from '../helpers/utils.js';
import ApplicationController from './applicationController';
import TemplateEngine from '../helpers/templateEngine';
import User from '../models/user';
import routes from '../routes/routes';
import errors from '../helpers/errors.js';


export default class SignupController extends ApplicationController {

    getSignupPage(formData) {
        const path = routes.signupPage.view;
        let view = fs.readFileSync(path, 'utf-8');
        let processedView = TemplateEngine(view, { data: formData });
        this.render(processedView);
    }

    attemptSignup() {
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
        this.request.on('end', async(data) => {
            let formData = qs.parse(reqBody);
            formData["requestResult"] = await this.validateUserInput(formData);
            console.log(formData);
            if (formData.requestResult.error) { // validations fails
                this.getSignupPage(formData);
            } else { // check for credentials in the db
                console.log('good to go');
                this.getSignupPage(formData);
            }
        });
    }

    async validateUserInput(formData) {
        if(!formData) return false;

        let validationErrors = await this.getValidationErrors(formData);
        console.log("HGSADGSadg\n");
        console.log(validationErrors);
        if(validationErrors) {
            return {
                error: validationErrors.messages
            }
        }
        return true;
    }

    checkIfUserExists(formData) {
        let name = formData.name;
        let email = formData.email;
        let password = new Generator().encodeMD5(formData.password);
    }

    async getValidationErrors(formData) {
        let messages = [];

        if (!formData.name)
            messages.push(`${errors.noNameField}`);
        if (formData.name && formData.name.length < 4) {
            messages.push(`${errors.nameValidationFail}`);
        }

        if (!formData.email)
            messages.push(`${errors.noEmailField}`);

        const emailRegex = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
        if (formData.email && !emailRegex.test(formData.email)) {
            messages.push(`${errors.emailValidationFail}`);
        }

        if (!formData.password)
            messages.push(`${errors.noPasswordField}`);

        if (formData.password && formData.password.length < 6) {
            messages.push(`${errors.passwordValidationFail}`);
        }

        let userExists = await this.userExistsInDB(formData.email);
        if(formData.email && userExists) {
            console.log("USERRRR:\n", userExists);
            messages.push(`${errors.userExists}`);
        }

        if (messages.length === 0) return { messages: undefined }
        else {
            messages.unshift(`${errors.authErrorHeader}:`);
            return {
                messages: messages
            }
        }
    }

    async userExistsInDB(email) {
        let db = await MongoClient.connect('mongodb://127.0.0.1:27017/notificator');
        try {
            let collection = db.collection('users');
            let userCount = (await collection.find({email: email}).limit(1).count());
            return userCount > 0;
        } finally {
            db.close();
        }
    }
}
