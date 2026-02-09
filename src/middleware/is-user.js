function isUser(req, res, next) {
    if(!req.session.user) {
        return res.status(401).render('http-error-401', {
            message: `You must <a href="/login">log in</a> to access this page. ` +
                `Or <a href="/">return to the home page</a>.`
        })
    }

    next()
}

//
module.exports.isUser = isUser
