import { MongoClient } from 'mongodb';
import { format } from 'util';
import qs from 'querystring';
import fs from 'fs';

import Task from '../models/task';
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
                await this.createNewTaskInDB(taskData);
                this.response.writeHead(302,
                    { Location: (this.request.socket.encrypted ? 'https://' : 'http://')
                                + this.request.headers.host + routes.homePage.url });
                this.response.end();
            }
        });
    }

    async createNewTaskInDB(taskData) {
        let db = await MongoClient.connect('mongodb://127.0.0.1:27017/notificator');
        try {
            let collection = db.collection('users');

            let id = (await collection.find({
                email: globalUserData.userInfo.email
            })).tasks.length + 1;

            let name = taskData.name;
            let deadline = taskData.dueDate;
            let description = taskData.description;

            let task = new Task(id, deadline, name, description);

            await collection.update(
                { email: globalUserData.userInfo.email },
                {
                    $push: {
                        tasks: task
                    }
                });

            console.log("SUCCESS");
        } finally {
            db.close();
        }
    }


    async validateUserInput(taskData) {
        let messages = [];

        if (!taskData.name) {
            messages.push(errors.noTaskNameField);
        }

        if (!taskData.dueDate) {
            messages.push(errors.noTaskDateField);
        }

        if (taskData.name && taskData.dueDate &&
                taskData.name.length > 0 &&
                taskData.dueDate.length > 0) {
            console.log("VALIDATE_USER_INPUT\n", taskData.name);
            let taskExists = await this.taskExistsInDB(taskData);

            if(!userExists) {
                messages.push(errors.taskAlreadyExists);
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
        let db = await MongoClient.connect('mongodb://127.0.0.1:27017/notificator');
        try {
            let collection = db.collection('users');
            let userCount = (await collection.find(
                {
                    email: globalUserData.userInfo.email,
                    tasks: {
                        $elemMatch: {
                            name: taskData.name,
                            deadline: taskData.dueDate
                        }
                    }
                }).limit(1).count());
            console.log('taskExistsInDB\n', userCount);
            return userCount > 0;
        } finally {
            db.close();
        }
    }
}
