import ApplicationController from './applicationController';
import routes from '../routes/routes';

export default class MainController extends ApplicationController {

    get404Page() {
        super.render(routes.page404.view, 404);
    }

    get405Page() {
        super.render(routes.page404.view, 405);
    }

}
