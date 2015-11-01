import fs from 'fs';

import ApplicationController from './applicationController';
import routes from '../routes/routes';

import TemplateEngine from '../helpers/templateEngine';

export default class MainController extends ApplicationController {

    getMainPage(statusCode = 200) {
        const path = routes.mainPage.view;
        let view = fs.readFileSync(path, 'utf-8');
        let processedView = TemplateEngine(view,
            {
                n: ['hi', 'hello', 'hey']
            });
        this.render(processedView, statusCode);
    }
}
