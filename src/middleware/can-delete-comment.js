const config = require('../config')

//
function canDeleteComment(req, res, next) {

    // checkComment() middleware must have already been called
    const comment = res.locals.comment

    // isUser() middleware must have already been called
    const userId = req.session.user.user_id

    //
    const canDelete = userId == comment.user_id ||
        userId == config.adminUserId ||
        userId == comment.lead_mod

    //
    if(!canDelete) {
        return res.status(403).render('http-error-403', {
            message: `You do not have permission to delete this comment. ` +
                `<a href="/">Return to the home page</a>.`
        })
    }

    //
    next()
}

//
module.exports.canDeleteComment = canDeleteComment
