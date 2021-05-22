// destructuring winston 
const { createLogger, transports, format } = require('winston');
// destructuring format
const { combine, timestamp, printf, errors } = format;

require('express-async-errors');

const customFormat = printf(({ level, message, timestamp, stack}) => {
  return `${timestamp} ${level}: ${stack || message}`;
})

module.exports = () => {
  createLogger({
    format: combine(
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      errors({ stack: true }),
      customFormat
    ),
    transports: [
      new transports.File({
        filename: 'application.log',
      })
    ],
    exceptionHandlers: [
      new transports.File({
        json: false,
        colorize: true,
        filename: 'uncaughtExceptions.log',
      })
    ],
    exitOnError: false
  })
};