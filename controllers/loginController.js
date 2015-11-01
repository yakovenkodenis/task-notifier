import { MongoClient } from 'mongodb';
import { format } from 'util';
import qs from 'querystring';
import fs from 'fs';

import { Generator, Parser as parser } from '../helpers/utils';
import ApplicationController from './applicationController';
import MainController from './mainController';
import TemplateEngine from '../helpers/templateEngine';
import Session from '../models/session';
import User from '../models/user';
import routes from '../routes/routes';
import errors from '../helpers/errors';


export default class LoginController extends ApplicationController {

    getLoginPage(formData) {
        const path = routes.loginPage.view;
        let view = fs.readFileSync(path, 'utf-8');
        let processedView = TemplateEngine(view, { data: formData });
        this.render(processedView);
    }

    attemptLogin() {
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
            if (formData.password) {
                formData.password = new Generator().encodeMD5(formData.password);
            }
            formData["requestResult"] = await this.validateUserInput(formData);
            if (formData.requestResult.error) { // validations fails
                this.getLoginPage(formData);
            } else { // check for credentials in the db
                let session = await this.login(formData);
                if(!globalUserData.userInfo) {
                    globalUserData.userInfo = formData;
                }
                let tasks = await this.getUserTasks(globalUserData.userInfo.email);
                globalUserData.userTasks = tasks;
                new MainController(this.request, this.response, session).getMainPage(302);
            }
        });
    }

    async destroySession() {
        if (await this.userSignedIn()) {
            console.log('start destroying session');
            let db = await MongoClient.connect('mongodb://127.0.0.1:27017/notificator');
            try {
                let sessions = db.collection('sessions');

                let Parser = new parser();
                let cookie_sid = Parser.parseCookies(this.request)['session_id'];

                console.log("COOKIE:\n", cookie_sid);

                let sessionExists = (await sessions.find(
                    {
                        is_valid: true,
                        session_id: cookie_sid
                    }).limit(1).count()) > 0;

                console.log("FOUND:\t", sessionExists);

                if (sessionExists) {
                    await sessions.update(
                        {
                            is_valid: true,
                            session_id: cookie_sid
                        },
                        { $set: {
                            is_valid: false,
                            updated_at: new Date().getTime()
                        }},
                        { writeConcern: { w: "majority", wtimeout: 5000 }});
                }

            } catch(err) {console.log(err)} finally {
                new MainController(this.request, this.response).getHomePage();
                db.close();
                console.log('stop destroying session');
            }
        }
    }

    async login(formData) {
        let db = await MongoClient.connect('mongodb://127.0.0.1:27017/notificator');
        try {
            let sessions = db.collection('sessions');
            let users = db.collection('users');

            let session_id = new Generator().generateUUID();
            let user_id = (await users.findOne({ email: formData.email }))['_id'];

            let session = new Session(user_id, session_id);

            await sessions.save(session.serialize,
                { writeConcern: { w: "majority", wtimeout: 5000 }});

            return session;

        } finally {
            db.close();
        }
    }

    async getUserTasks(email) {
        let db = await MongoClient.connect('mongodb://127.0.0.1:27017/notificator');
        try {
            let users = db.collection('users');

            let user = (await users.findOne({ email: email }));

            console.log(user);

            return user.tasks;

        } finally {
            db.close();
        }
    }

    async validateUserInput(formData) {

        let messages = [];

        if (!formData.email) {
            messages.push(errors.noEmailField);
        }

        if (!formData.password) {
            messages.push(errors.noPasswordField);
        }

        if (formData.password && formData.email &&
                formData.password.length > 0 &&
                formData.email.length > 0) {
            console.log(formData.password);
            let userExists = await this.userExistsInDB(formData.email,
                                                       formData.password);

            if(!userExists) {
                messages.push(errors.loginFail);
            }
        }

        if (messages.length > 0) {
            return {
                error: messages
            }
        }
        return true;
    }

    async userExistsInDB(email, encryptedPassword) {
        let db = await MongoClient.connect('mongodb://127.0.0.1:27017/notificator');
        try {
            let collection = db.collection('users');
            let userCount = (await collection.find(
                {
                    email: email,
                    password: encryptedPassword
                }).limit(1).count());
            return userCount > 0;
        } finally {
            db.close();
        }
    }
}
