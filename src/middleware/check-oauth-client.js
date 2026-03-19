const db = require('../db')

//
async function checkOauthClient(req, res, next) {
    const publicId = req.query.id
    const {rows:[oauthClient]} = await db.getClient(publicId)

    //
    if(!oauthClient) {
        return res.status(404).render('http-error-404', {
            message: `There is no app with ID ${publicId}. ` +
                `<a href="/">Return to the home page</a>.`
        })
    }

    //
    res.locals.oauthClient = oauthClient
    next()
}

//
module.exports.checkOauthClient = checkOauthClient
