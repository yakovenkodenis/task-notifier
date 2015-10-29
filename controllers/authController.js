import { MongoClient } from 'mongodb';
import { format } from 'util';
import qs from 'querystring';
import fs from 'fs';
import child_process from 'child_process';

import { MD5 } from '../helpers/utils.js';
import ApplicationController from './applicationController';
import TemplateEngine from '../helpers/templateEngine';
import User from '../models/user';
import routes from '../routes/routes';
import errors from '../helpers/errors.js';


export default class AuthController extends ApplicationController {

    getAuthPage() {
        const path = routes.authPage.view;
        let view = fs.readFileSync(path, 'utf-8');
        let processedView = TemplateEngine(view, {});
        this.render(processedView);
    }

    login(post) {
        let password = post.password, email = post.email;

        MongoClient.connect(routes.mongoDB.url, (err, db) => {
            if (err) throw err;

            let users = db.collection('users');

            users.findOne(
                {
                    email: email,
                    password: new MD5().encode(password)
                }, (err, user) => {
                    if (err) throw err;

                    if (user) {
                        this.response.writeHead(302,
                        {
                            'Location': routes.mainPage.url
                        });
                        this.response.end();
                    } else {
                        console.log(error.loginError);
                    }
            });
        });
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
