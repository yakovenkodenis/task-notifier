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


export default class ScheduleController extends MainController {

    handleNotificationTimeUpdate() {
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
            console.log("START PROCESSING REQUEST");
            let formData = qs.parse(reqBody);

            formData["requestResult"] = this.validateTimeInput(formData.time);
            if (formData.requestResult.error) { // validations fails
                await this.getMainPage(formData);
            } else {
                console.log("START UPDATING TIME\n", formData.time, globalUserData.userInfo.email);
                await this.updatePreferedNotificationTime(formData.time,
                    globalUserData.userInfo.email);
                console.log("AFTER TIME\n");
                globalUserData.userInfo.notificationTime = formData.time;
                formData['requestResult'] = 'success';
                await this.getMainPage(formData);
            }
        });
    }

    async updatePreferedNotificationTime(time, email) {
        let db = await MongoClient.connect('mongodb://127.0.0.1:27017/notificator');
        try {
            let users = db.collection('users');

            let userExists = (await users.find(
                {
                    email
                }).limit(1).count()) > 0;

            if (userExists) {
                await users.update({ email }, { $set: { notification_time: time }},
                    { writeConcern: { w: "majority", wtimeout: 5000 }});
            }

        } catch(err) {console.log(err)} finally {
            db.close();
        }
    }

    validateTimeInput(time) {
        let messages = [];

        if (!time) {
            messages.push(errors.noTimeField);
        }

        let nums = time.split(':');

        if (nums.length < 2 || nums.length > 3) {
            messages.push(errors.timeValidationFail);
        } else {
            let num1 = new Number(nums[0]);
            let num2 = new Number(nums[1]);
            let num3 = nums[3] ? new Number(nums[3]) : '00';

            if (isNaN(num1) || num1 > 23 || num1 < 0 ||
                isNaN(num2) || num2 > 59 || num2 < 0 ||
                isNaN(num3) || num3 > 59 || num3 < 0) {
                messages.push(errors.timeValidationFail);
            }
        }

        if (messages.length > 0) {
            return {
                error: messages
            }
        }
        return true;
    }

}
