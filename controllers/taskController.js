import { MongoClient } from 'mongodb';
import { format } from 'util';
import qs from 'querystring';
import fs from 'fs';

import User from '../models/user';
import routes from '../routes/routes';
import errors from '../helpers/errors';
import ApplicationController from './applicationController';


export default class TaskController extends ApplicationController {

    addNewTask() {
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
            let taskData = qs.parse(reqBody);
            taskData["requestResult"] = await this.validateUserInput(taskData);
            if (taskData.requestResult.error) { // validations fails
                this.getHomePage(taskData);
            } else { // check for credentials in the db
                this.response.writeHead(302,
                    { Location: (this.request.socket.encrypted ? 'https://' : 'http://')
                                + this.request.headers.host + routes.homePage.url });
                this.response.end();
            }
        });
    }


    async validateUserInput(taskData) {
        let messages = [];

        if (!taskData.email) {
            messages.push(errors.noEmailField);
        }

        if (!taskData.password) {
            messages.push(errors.noPasswordField);
        }

        if (taskData.password && taskData.email &&
                taskData.password.length > 0 &&
                taskData.email.length > 0) {
            console.log(taskData.password);
            let taskExists = await this.taskExistsInDB(taskData);

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

    async taskExistsInDB(taskData) {
        
    }
}
