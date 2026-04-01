const {oauthAuthenticate} = require('../util/oauth-authenticate')

//
async function isOauthUser(req, res, next) {

    //
    const oauthData = await oauthAuthenticate(req, res)

    //
    if(!oauthData) {
        return res.status(401).json({
            errors: ['invalid or no user auth'],
        })
    }

    res.locals.oauthUser = oauthData.user
    next()
}

//
module.exports.isOauthUser = isOauthUser
