const db = require('../db')

//
async function checkComment(req, res, next) {
    const commentPublicId = req.params[0]
    const {rows:[comment]} = await db.getCommentWithPublic(commentPublicId)

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
module.exports.checkComment = checkComment
