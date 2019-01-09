const winston = require('winston');
const { debug } = require('./config');

const logger = winston.createLogger({
    level: debug ? 'debug' : 'info',
    format: winston.format.cli(),
    transports: [new winston.transports.Console()],
});

module.exports = logger;
