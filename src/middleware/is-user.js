const {render401} = require('../util/render')

//
function isUser(req, res, next) {
    if(!req.session.user) {
        return render401(res,
            `You must <a href="/login">log in</a> to access this page. ` +
            `Or <a href="/">return to the home page</a>.`)
    }

    next()
}

//
module.exports.isUser = isUser
