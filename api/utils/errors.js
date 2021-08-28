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
        return this.message;
    }
}

class BadRequest extends GeneralError { }
class NotFound extends GeneralError { }

class EntityTypeNotFound extends NotFound { 
    constructor(entityType) {
        super('Entity type: \'' + entityType + '\' is not a valid entity!');
    }
}

class EntityIdNotFound extends NotFound {
    constructor(entityType, entityId) {
        super('Entity type: \'' + entityType + '\' with id: ' + entityId + ' not found!');
    }
}

module.exports = {
    GeneralError,
    BadRequest,
    NotFound,
    EntityTypeNotFound,
    EntityIdNotFound
};