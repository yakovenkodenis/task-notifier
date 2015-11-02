import fs from 'fs';
import qs from 'querystring';
import { MongoClient } from 'mongodb';
import routes from '../routes/routes';
import { Generator as generator, Parser as parser } from '../helpers/utils';
import TemplateEngine from '../helpers/templateEngine';

export default class ApplicationController {

    constructor(request, response, session) {
        this.request = request;
        this.response = response;
        this.session = session;
    }

    async getHomePage(taskData) {

        let signedIn = await this.userSignedIn();

        if (signedIn) {
            const path = routes.homePage.view;
            let view = fs.readFileSync(path, 'utf-8');
            let processedView = TemplateEngine(view, {
                user_signed_in: signedIn,
                email: globalUserData.userInfo.email,
                tasks: globalUserData.userTasks,
                taskData: taskData
            });
            this.render(processedView);
        } else {
            this.authenticateUser();
        }
    }

    render(page, statusCode = 200) {
        if (this.session) {
            this.response.writeHead(statusCode,
                {
                    'Set-Cookie': this.session.cookie,
                    'Content-Type': 'text/html'
                });
        } else {
            this.response.writeHead(statusCode, { 'Content-Type': 'text/html' });
        }
        this.response.write(page);
        this.response.end();
    }

    authenticateUser() {
        this.response.writeHead(302,
            { Location: (this.request.socket.encrypted ? 'https://' : 'http://')
                        + this.request.headers.host + routes.loginPage.url });
        this.response.end();
    }

    async userSignedIn() {
        let Parser = new parser();
        let cookie = Parser.parseCookies(this.request);

        if (cookie.hasOwnProperty('session_id') &&
            cookie['session_id'] && cookie['session_id'].length > 0) {

                let db = await MongoClient.connect('mongodb://127.0.0.1:27017/notificator');
            try {
                let sessions = db.collection('sessions');


                let Parser = new parser();
                let session_id = cookie['session_id'];

                console.log("COOKIE:\n", session_id);
                let sessionExists = (await sessions.find(
                    {
                        is_valid: true,
                        session_id: session_id
                    }).limit(1).count()) > 0;
                return sessionExists;
            } finally {
                db.close();
            }
        }
        return false;
    }

    async addNewTask() {
        // TODO add new task to db
        console.log('handling new task creation...');

        this.response.end();
    }

}
