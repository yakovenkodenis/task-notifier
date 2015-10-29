import http from 'http';
import qs from 'querystring';

import applicationController from './controllers/applicationController';
import mainController from './controllers/mainController';
import errorController from './controllers/errorController';
import authController from './controllers/authController';
import signupController from './controllers/signupController';
import routes from './routes/routes';

import { Logger as logger } from './helpers/utils';


const port = 9000;
let Logger = new logger();

http.createServer( (request, response) => {

    Logger.log(request.method, request.socket.remoteAddress, request.url);

    // Initialize controllers
    const AppController = new applicationController(request, response);
    const MainController = new mainController(request, response);
    const ErrorController = new errorController(request, response);
    const AuthController = new authController(request, response);
    const SignupController = new signupController(request, response);

    switch (request.method) {

        case 'GET':

            if (request.url === routes.homePage.url || request.url === '/') {
                AppController.getHomePage();
            }

            else if (request.url === routes.mainPage.url) {
                MainController.getMainPage();
            }

            else if (request.url === routes.authPage.url) {
                AuthController.getAuthPage();
            }

            else if (request.url === routes.signupPage.url) {
                SignupController.getSignupPage();
            }

            else {
                ErrorController.get404Page();
            }

            break;

        case 'POST':
            if (request.url === '/login') {
                AuthController.processPost(request, response, () => {
                    response.writeHead(200, 'OK', {'Content-Type': 'text/plain'});
                    response.end();
                });
            }

            else if (request.url === routes.signupPage.url) {
                let reqBody = '';
                request.on('data', (data) => {
                    reqBody += data;
                    if (reqBody.length > 1e7) { // 10mb
                        response.writeHead(413, 'Request Entity Too Large',
                            { 'Content-Type': 'text/html'});
                        response.write('Too large data. Server cannot handle this.');
                        response.end();
                    }
                });
                request.on('end', (data) => {
                    let formData = qs.parse(reqBody);
                    console.log(formData);
                    SignupController.getSignupPage(formData);
                });
            }

            else {
                ErrorController.get404Page();
            }

        // default:
        //     ErrorController.get405Page();
        //     break;

    }

}).listen(port);
