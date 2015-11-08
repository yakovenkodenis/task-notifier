export default {

    homePage: {
        url: '/',
        view: 'views/markup/index.html'
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

    signupPage: {
        url: '/signup',
        view: 'views/markup/signup.html'
    },

    loginPage: {
        url: '/login',
        view: 'views/markup/login.html'
    },

    forgotPassPage: {
        url: '/forgot',
        view: 'views/markup/forgot.html'
    },

    changePassPage: {
        url: '/change-password',
        view: 'views/markup/new_password.html'
    },

    logout: {
        url: '/logout',
        view: null
    },

    mongoDB: {
        url: 'mongodb://127.0.0.1:27017/notificator'
    }

};
