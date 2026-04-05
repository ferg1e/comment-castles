const db = require('../db')
const {render404} = require('../util/render')

//
async function checkComment(req, res, next) {
    const commentPublicId = req.params[0]
    const {rows:[comment]} = await db.getCommentWithPublic(commentPublicId)

    //
    if(!comment) {
        return render404(res,
            `There is no comment with ID ${commentPublicId}. ` +
            `<a href="/">Return to the home page</a>.`)
    }

    //
    res.locals.commentPublicId = commentPublicId
    res.locals.comment = comment
    next()
}

//
module.exports.checkComment = checkComment
