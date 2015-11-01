import fs from 'fs';
import qs from 'querystring';
import routes from '../routes/routes';
import { Generator as generator, Parser as parser } from '../helpers/utils';
import TemplateEngine from '../helpers/templateEngine';

export default class ApplicationController {

    constructor(request, response) {
        this.request = request;
        this.response = response;
    }

    getHomePage() {
        let signedIn = this.userSignedIn();

        if (signedIn) {
            const path = routes.homePage.view;
            let view = fs.readFileSync(path, 'utf-8');
            let processedView = TemplateEngine(view, {});
            this.render(processedView);
        } else {
            this.authenticateUser();
        }
    }

    render(page, statusCode = 200) {
        this.response.writeHead(statusCode, { 'Content-Type': 'text/html' });
        this.response.write(page);
        this.response.end();
    }

    authenticateUser() {
        this.response.writeHead(302,
            { Location: (this.request.socket.encrypted ? 'https://' : 'http://')
                        + this.request.headers.host + routes.signupPage.url });
        this.response.end();
    }

    userSignedIn() {
        let Parser = new parser();
        let cookie = Parser.parseCookies(this.request);

        if (cookie.hasOwnProperty('session_id')) {
            return cookie['session_id'] && cookie['session_id'].length > 0;
        }
        return false;
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
                callback();
            });
        } else {
            response.writeHead(405, {'Content-Type': 'text/plain'});
            response.end();
        }
    }

}
