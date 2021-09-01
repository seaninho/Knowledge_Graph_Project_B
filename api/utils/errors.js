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
        super('Entity type: \'' + entityType + '\' with id: \'' + entityId + '\' was not found!');
    }
}

class EntityHasNoSuchRelationship extends NotFound {
    constructor(entityType, relationshipType) {
        super('Entity type: \'' + entityType + '\' has no relationship type named: \'' + relationshipType + '\'!');
    }
}

class RelationshipTypeNotFound extends NotFound { 
    constructor(relationshipType) {
        super('Relationship type: \'' + relationshipType + '\' is not a valid relationship!');
    }
}

class RelationshipAlreadyExists extends GeneralError {
    constructor(srcEntityType, dstEntityType, relationshipType, srcEntityId, dstEntityId) {
        super(srcEntityType + ' with id: \'' + srcEntityId + '\' is already ' + relationshipType +
            ' ' + dstEntityType + ' with id: \'' + dstEntityId + '\'');
    }
}

module.exports = {
    GeneralError,
    BadRequest,
    NotFound,
    EntityTypeNotFound,
    EntityIdNotFound,
    EntityHasNoSuchRelationship,
    RelationshipTypeNotFound,
    RelationshipAlreadyExists: RelationshipAlreadyExists
};