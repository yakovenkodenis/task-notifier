import fs from 'fs';
import path from 'path';
import http from 'http';
import qs from 'querystring';

import applicationController from './controllers/applicationController';
import mainController from './controllers/mainController';
import errorController from './controllers/errorController';
import authController from './controllers/authController';
import loginController from './controllers/loginController';
import signupController from './controllers/signupController';
import routes from './routes/routes';

import { Logger as logger } from './helpers/utils';

const port = 9000;
let Logger = new logger();

GLOBAL.globalUserData = {};

http.createServer( (request, response) => {

    Logger.log(request.method, request.socket.remoteAddress, request.url);

    // Initialize controllers
    const AppController = new applicationController(request, response);
    const MainController = new mainController(request, response);
    const ErrorController = new errorController(request, response);
    const AuthController = new authController(request, response);
    const LoginController = new loginController(request, response);
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

            else if (request.url === routes.loginPage.url) {
                LoginController.getLoginPage();
            }

            else if (request.url === routes.logout.url) {
                LoginController.destroySession();
            }

            // serve css files (views/styles folder)
            else if (/[^\/[a-zA-Z0-9\/]*.css$/.test(request.url.toString())) {
                (response, fileName, contentType) => {
                    let cssPath = path.join(__dirname, 'views', fileName);
                    fs.readFile(cssPath, (err, data) => {
                        if (err) {
                            console.warn('CSS load error:\n', err);
                            response.writeHead(404);
                            response.write('Not Found');
                        } else {
                            response.writeHead(200, {'Content-Type': contentType});
                            response.write(data);
                        }
                        response.end();
                    });
                }(response, request.url.toString().substring(1), 'text/css');
            }

            else {
                ErrorController.get404Page();
            }

            break;

        case 'POST':
            if (request.url === routes.loginPage.url) {
                LoginController.attemptLogin();
            }

            else if (request.url === routes.signupPage.url) {
                SignupController.attemptSignup();
            }

            else {
                ErrorController.get404Page();
            }

        // default:
        //     ErrorController.get405Page();
        //     break;

    }

}).listen(port);
