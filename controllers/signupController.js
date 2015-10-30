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
        this.request.on('end', (data) => {
            let formData = qs.parse(reqBody);
            formData["requestResult"] = this.checkIfUserExists(formData);
            console.log(formData);
            this.getSignupPage(formData);
        });
    }

    checkIfUserExists(formData) {
        if(!formData) return false;

        let validationErrors = this.getValidationErrors(formData);
        if(validationErrors) {
            return {
                error: validationErrors.messages
            }
        }

        let name = formData.name;
        let email = formData.email;
        let password = new Generator().encodeMD5(formData.password);

        return true;
    }

    getValidationErrors(formData) {
        let messages = [];

        if (!formData.name)
            messages.push(`${errors.noNameField}`);
        if (!formData.email)
            messages.push(`${errors.noEmailField}`);
        if (!formData.password)
            messages.push(`${errors.noPasswordField}`);

        if (messages.length === 0) return { messages: undefined }
        else {
            messages.unshift(`${errors.authErrorHeader}:`);
            return {
                messages: messages
            }
        }
    }

    queryDB(User) {

        MongoClient.connect('mongodb://127.0.0.1:27017/notificator', (err, db) => {
            if (err) throw err;

            let collection = db.collection('users');
            collection.insert({ name: 'Denis Yakovenko',
                                email: 'yakovenko.denis.a@gmail.com',
                                password: 'hello' });

            collection.count((err, count) => {
                console.log(format('count = %s', count));
            });

            collection.find().toArray((err, results) => {
                console.dir(results);

                db.close();
            });
        });
    }


    processPost(request, response, callback) {
        let queryData = '';

        if (typeof callback != 'function') return null;

        if(request.method == 'POST') {
            request.on('data', (data) => {
                queryData += data;

                if (queryData.length > 1e6) {
                    queryData = '';
                    response.writeHead(413, {'Content-Type': 'text/plain'})
                      .end();
                    request.connection.destroy();
                }
            });

            request.on('end', () => {
                request.post = qs.parse(queryData);
                this.login(request.post);

                callback();
            });
        } else {
            response.writeHead(405, {'Content-Type': 'text/plain'});
            response.end();
        }
    }

}