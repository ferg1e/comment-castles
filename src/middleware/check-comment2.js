const db = require('../db')
const myMisc = require('../util/misc.js')

//
async function checkComment2(req, res, next) {
    const commentPublicId = req.params[0]
    const {rows:[comment]} = await db.getCommentWithPublic2(
            commentPublicId,
            myMisc.getCurrTimeZone(req),
            myMisc.getCurrDateFormat(req))

    //
    if(!comment) {
        return res.status(404).render('http-error-404', {
            message: `There is no comment with ID ${commentPublicId}. ` +
                `<a href="/">Return to the home page</a>.`
        })
    }

    //
    res.locals.commentPublicId = commentPublicId
    res.locals.comment = comment
    next()
}

//
module.exports.checkComment2 = checkComment2
