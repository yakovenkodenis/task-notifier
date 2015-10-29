class Logger {
    log(...options) {
        console.log(...options);
    }
}

class MD5 {
    encode(value) {
        return require('crypto').createHash('md5').update(value).digest('hex');
    }
}

export { Logger, MD5 };
