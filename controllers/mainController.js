import ApplicationController from './applicationController';
import routes from '../routes/routes';

export default class MainController extends ApplicationController {

    getMainPage() {
        super.render(routes.mainPage.view);
    }

}
