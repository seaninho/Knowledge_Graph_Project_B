function writeResponse(res, response, status) {
    // res.status(status || 200).send(JSON.stringify(response));
    res.status(status || 200).json(response);
};

function formatResponse(resultObj) {
    var result = [];
    if (resultObj.records.length > 0) {      
        resultObj.records.map(record => {
            // console.log(record._fields[0]);
            result.push(record._fields[0].properties);
        });
    }
    return result;
}

module.exports = {
    writeResponse: writeResponse,
    formatResponse: formatResponse
}