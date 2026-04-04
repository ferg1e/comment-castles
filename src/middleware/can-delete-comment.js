const config = require('../config')
const {render403} = require('../util/render')

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
        return render403(res,
            `You do not have permission to delete this comment. ` +
            `<a href="/">Return to the home page</a>.`)
    }

    //
    next()
}

//
module.exports.canDeleteComment = canDeleteComment
