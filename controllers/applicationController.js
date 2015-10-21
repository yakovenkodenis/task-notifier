import fs from 'fs';
import routes from '../routes/routes';

export default class ApplicationController {

    constructor(request, response) {
        this.request = request;
        this.response = response;
    }

    getHomePage() {
        this.render(routes.homePage.view);
    }

    render(page) {
        this.response.writeHead(200, { 'Content-Type': 'text/html' });
        this.response.write(fs.readFileSync(page));
        this.response.end();
    }

}
