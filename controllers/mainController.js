import fs from 'fs';

import ApplicationController from './applicationController';
import routes from '../routes/routes';

import TemplateEngine from '../helpers/templateEngine';

export default class MainController extends ApplicationController {

    getMainPage(formData = null, statusCode = 200) {
        const path = routes.mainPage.view;
        let view = fs.readFileSync(path, 'utf-8');
        let processedView = TemplateEngine(view,
            {
                n: ['hi', 'hello', 'hey'],
                data: formData,
                time: globalUserData.userInfo.notification_time
            });

        const location = (this.request.socket.encrypted ? 'https://' : 'http://')
                            + this.request.headers.host + routes.mainPage.url;
        this.render(processedView, statusCode, location);
    }
}
