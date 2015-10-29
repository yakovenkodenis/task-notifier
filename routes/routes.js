export default {

    homePage: {
        url: '/',
        view: 'views/markup/index.html'
    },

    calc: {
        url: '/calc',
        view: null
    },

    mainPage: {
        url: '/profile',
        view: 'views/markup/main.html'
    },

    page404: {
        url: null,
        view: 'views/markup/404.html'
    },

    authPage: {
        url: '/auth',
        view: 'views/markup/auth.html'
    },

    mongoDB: {
        url: 'mongodb://127.0.0.1:27017/notificator'
    }

};
