import ApplicationController from './applicationController';
import TemplateEngine from '../helpers/templateEngine';
import routes from '../routes/routes';

export default class MainController extends ApplicationController {

    get404Page() {
        const path = routes.page404.view;
        let view = fs.readFileSync(path, 'utf-8');
        let processedView = TemplateEngine(view, {});
        this.render(processedView);
        this.render(path, 404);
    }

    get405Page() {
        const path = routes.page404.view;
        let view = fs.readFileSync(path, 'utf-8');
        let processedView = TemplateEngine(view, {});
        this.render(processedView);
        this.render(path, 405);
    }

}
