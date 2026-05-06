const db = require('../db')
const userSettings = require('../util/user-settings.js')
const {render404} = require('../util/render')

//
async function checkPost2(req, res, next) {
    const postPublicId = req.params[0]
    const {rows:[post]} = await db.getPostWithPublic2(
        postPublicId,
        userSettings.getCurrTimeZone(req),
        userSettings.getCurrDateFormat(req))

    //
    if(!post) {
        return render404(res,
            `There is no post with ID ${postPublicId}. ` +
            `<a href="/">Return to the home page</a>.`)
    }

    //
    res.locals.postPublicId = postPublicId
    res.locals.post = post
    next()
}

//
module.exports.checkPost2 = checkPost2
