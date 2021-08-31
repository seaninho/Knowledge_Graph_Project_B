function writeResponse(res, response, status) {
    // res.status(status || 200).send(JSON.stringify(response));
    res.status(status || 200).json(response);
};

module.exports = {
    writeResponse: writeResponse
}