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
        } else {
            return this.message;
        }        
    }
}

class BadRequest extends GeneralError { }
class NotFound extends GeneralError { }

class EntityTypeNotFound extends NotFound { 
    constructor(entityType) {
        super('Entity Type: \'' + entityType + '\' is not a valid entity!');
    }
}

class EntityIdNotFound extends NotFound {
    constructor(entityType, entityId) {
        super('Entity Type: \'' + entityType + '\' With ID: ' + entityId + ' Not Found');
    }
}

module.exports = {
    GeneralError,
    BadRequest,
    NotFound,
    EntityTypeNotFound,
    EntityIdNotFound
};