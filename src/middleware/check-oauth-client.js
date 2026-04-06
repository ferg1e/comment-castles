const db = require('../db')
const {render404} = require('../util/render')

//
async function checkOauthClient(req, res, next) {
    const publicId = req.query.id
    const {rows:[oauthClient]} = await db.getClient(publicId)

    //
    if(!oauthClient) {
        return render404(res,
            `There is no app with ID ${publicId}. ` +
            `<a href="/">Return to the home page</a>.`)
    }

    //
    res.locals.oauthClient = oauthClient
    next()
}

//
module.exports.checkOauthClient = checkOauthClient
