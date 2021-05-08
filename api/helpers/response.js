exports.writeResponse = function(res, response, status) {
    // res.status(status || 200).send(JSON.stringify(response));
    res.status(status || 200).json(response);
};

exports.formatResponse = function (resultObj) {
    var result = [];
    if (resultObj.records.length > 0) {        
        resultObj.records.map(record => {
            // result.push(record._fields[0]);
            result.push(record._fields[0].properties);
        });
    }
    return result;
}