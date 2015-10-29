class Logger {
    log(...options) {
        console.log(...options);
    }
}

class Generator {
    encodeMD5(value) {
        return require('crypto').createHash('md5').update(value).digest('hex');
    }

    generateUUID() {
        let d = new Date().getTime();
        let uuid = 'xxxxxxxx-xxxx-4xxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            let r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
        return uuid;
    }
}

export { Logger, Generator };
