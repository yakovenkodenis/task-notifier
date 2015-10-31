import { MongoClient } from 'mongodb';
import { format } from 'util';
import qs from 'querystring';
import { Generator } from '../helpers/utils.js';
import errors from '../helpers/errors.js';

const defaultOptions = {
    collection: 'sessions',
    stringify: true,
    ttl: 60 * 60 * 24 * 14 // 2 weeks
};

var defaultSerializationOptions = {
    serialize: (session) => {
        let obj = {};
        for (let prop in session) {
            if (prop === 'cookie') {
                obj.cookie = session.cookie.toJSON ? session.cookie.toJSON()
                                                   : session.cookie;
            } else {
                obj[prop] = session[prop];
            }
        }

        return obj;
    },

    unserialize: obj => return obj;
};

var stringifySerializationOptions = {
    serialize: JSON.stringify,
    unserialize: JSON.parse
};

export default class SessionController {

    constructor() {
        this.Sessions = new Map();
    }

}
