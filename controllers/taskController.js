import { MongoClient } from 'mongodb';
import { format } from 'util';
import qs from 'querystring';
import fs from 'fs';

import Task from '../models/task';
import routes from '../routes/routes';
import errors from '../helpers/errors';
import EmailController from './emailController';
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
            console.log("REQUEST RES\n", taskData);
            if (taskData.requestResult.error) { // validations fails
                this.getHomePage(taskData);
            } else { // check for credentials in the db
                console.log("Initiate task creation");
                let tasksList = await this.createNewTaskInDB(taskData);
                globalUserData.userTasks = tasksList.sort((task1, task2) => {
                    return new Date(task1['deadline']) - new Date(task2['deadline']);
                });
                await this.subscribeForEmailNotifications(taskData);
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

            let tasksList = (await collection.findOne({
                email: globalUserData.userInfo.email
            })).tasks;

            let id = tasksList.length + 1;

            console.log("ID\n", id);

            let name = taskData.name;
            let deadline = taskData.dueDate;
            let description = taskData.description;

            let task = new Task(id, deadline, name, description);
            console.log(task.serialize);

            await collection.update(
                { email: globalUserData.userInfo.email },
                {
                    $push: {
                        tasks: task.serialize
                    }
                });

            tasksList.push(task.serialize);

            console.log("SUCCESS");

            return tasksList;
        } catch(err) {console.log(err);}finally {
            db.close();
        }
    }


    async subscribeForEmailNotifications(taskData) {
        let date = taskData['dueDate'];
        let time = '00:00:00';

        let email = globalUserData.userInfo.email;

        let db = await MongoClient.connect('mongodb://127.0.0.1:27017/notificator');
        try {
            let users = db.collection('users');

            let user = (await users.findOne({ email }));

            time = user.notification_time;

        } catch(err){console.log(err);}finally {
            db.close();
        }

        time = time ? time : '00:00:00';

        console.log("DELIVERY DATE:\n", date);
        console.log("DELIVERY TIME:\n", time);

        let emailObject = this.composeNotificationEmail(taskData);
        EmailController.sendEmailOnSpecificTime(
            {
                from: 'Denis Yakovenko <yakovenko.denis.a@gmail.com>',
                to: email,
                subject: emailObject.subject,
                text: emailObject.text,
                html: emailObject.html
            },
            date,
            time
        );
    }

    composeNotificationEmail(taskData) {
        return {
            subject: `${taskData['name']} deadline is approaching | notification by TaskNotifier`,
            text: `Hey there!\nThe deadline to your task '${taskData['name']}' ` +
                   "is coming today.\nHere's the description of the task:\n" +
                   `${taskData['description']}\n\nAll the best,\nTaskNotifier team`,
            html: `<h3>Hey there!</h3><br><p>The deadline to your task '${taskData['name']}' ` +
                  `is coming today.<br><br>Here's the description of the task:<br>` +
                  `${taskData['description']}</p><br><br>All the best,<br>TaskNotifier team`
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

            console.log("VALIDATE INPUT\n", taskExists);

            if(taskExists) {
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
        } catch(err) {console.log(err);} finally {
            db.close();
        }
    }
}
