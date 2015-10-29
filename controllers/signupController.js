import { MongoClient } from 'mongodb';
import { format } from 'util';
import qs from 'querystring';

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
        this.render(path);
    }

    attemptLogin() {
        
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