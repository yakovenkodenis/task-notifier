import qs from 'querystring';
import http from 'http';

import applicationController from './controllers/applicationController';
import mainController from './controllers/mainController';
import routes from './routes/routes';

const port = 9000;

http.createServer( (request, response) => {

    const AppController = new applicationController(request, response);
    const MainController = new mainController(request, response);

    switch (request.method) {

        case 'GET':

            if (request.url === routes.homePage.url || request.url === '/') {
                AppController.getHomePage();
            }

            else if (request.url === routes.mainPage.url) {
                MainController.getMainPage();
            }

            break;

        case 'POST':
            break;

        default:
            break;

    }

}).listen(port);
