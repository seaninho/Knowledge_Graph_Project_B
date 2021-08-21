class GeneralError extends Error {
    constructor(message) {
        super();
        this.message = message;
    }

    getCode() {
        if (this instanceof BadRequest) {
            return 400;
        } if (this instanceof NotFound) {
            return 404;
        }
        return 500;
    }

    getMessage() {
        if (this instanceof NotFound) {
            return "Error 404. Page Not Found!";
        } else {
            return this.message;
        }        
    }
}

class BadRequest extends GeneralError { }
class NotFound extends GeneralError { }

module.exports = {
    GeneralError,
    BadRequest,
    NotFound
};