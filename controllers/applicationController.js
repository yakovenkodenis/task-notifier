import fs from 'fs';
import qs from 'querystring';
import routes from '../routes/routes';
import TemplateEngine from '../helpers/templateEngine';

export default class ApplicationController {

    constructor(request, response) {
        this.request = request;
        this.response = response;
    }

    getHomePage() {
        const path = routes.homePage.view;
        let view = fs.readFileSync(path, 'utf-8');
        let processedView = TemplateEngine(view, {});
        this.render(processedView);

    }

    render(page, statusCode = 200) {
        this.response.writeHead(statusCode, { 'Content-Type': 'text/html' });
        this.response.write(page);
        this.response.end();
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
