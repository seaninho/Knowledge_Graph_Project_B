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
        if (this instanceof BadRequest) {
            return "Error 400. Bad Request!";
        } if (this instanceof NotFound) {
            return "Error 404. Page Not Found!";
        }
        return "Error 500. General Error!";
    }
}

class BadRequest extends GeneralError { }
class NotFound extends GeneralError { }

module.exports = {
    GeneralError,
    BadRequest,
    NotFound
};