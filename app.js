import qs from 'querystring';
import http from 'http';

import applicationController from './controllers/applicationController';
import mainController from './controllers/mainController';
import errorController from './controllers/errorController';
import routes from './routes/routes';

const port = 9000;

http.createServer( (request, response) => {

    // Import controllers
    const AppController = new applicationController(request, response);
    const MainController = new mainController(request, response);
    const ErrorController = new errorController(request, response);

    switch (request.method) {

        case 'GET':

            if (request.url === routes.homePage.url || request.url === '/') {
                AppController.getHomePage();
            }

            else if (request.url === routes.mainPage.url) {
                MainController.getMainPage();
            }

            else {
                ErrorController.get404Page();
            }

            break;

        case 'POST':
            break;

        default:
            ErrorController.get405Page();
            break;

    }

}).listen(port);
