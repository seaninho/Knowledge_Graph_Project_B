const { GeneralError, BadRequest, NotFound } = require('../utils/errors');

 function handleErrors(err, req, res, next) {
    if (err instanceof GeneralError) {
        return res.status(err.getCode()).json({
            status: 'error',
            message: err.getMessage()
        });
    } 

    return res.status(500).json({
        status: 'error',
        message: err.message
    });
}

// const error = function (err, req, res, next) {
//     // set locals, only providing error in development
//     res.locals.message = err.message;
//     res.locals.error = req.app.get('env') === 'development' ? err : {};

//     // render the error page
//     res.status(err.status || 500);
//     res.render('error');
// }


module.exports = {
    handleErrors: handleErrors
}