import cluster from 'cluster';
import { Logger as logger } from './helpers/utils.js';

let Logger = new logger();

if(cluster.isMaster) {

    Logger.log(`Master cluster (${process.pid}) is up and running`);

    const cpuCount = require('os').cpus().length;

    for (let i = 0; i < cpuCount - 1; ++i) {
        cluster.fork();
    }

    cluster.on('exit', () => {
        cluster.fork();
    })
} else {
    require('./app');

    Logger.log(`Slave cluster ${process.pid} is up and running`);
}
