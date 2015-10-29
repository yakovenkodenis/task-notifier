import ApplicationController from './applicationController';
import TemplateEngine from '../helpers/templateEngine';
import routes from '../routes/routes';
import fs from 'fs';

export default class MainController extends ApplicationController {

    get404Page() {
        const path = routes.page404.view;
        let view = fs.readFileSync(path, 'utf-8');
        let processedView = TemplateEngine(view, {});
        this.render(processedView, 404);
    }

    get405Page() {
        const path = routes.page404.view;
        let view = fs.readFileSync(path, 'utf-8');
        let processedView = TemplateEngine(view, {});
        this.render(processedView, 405);
    }

}
