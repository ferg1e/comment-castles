const config = require('../config')
const {render403} = require('../util/render')

//
function canDeletePost(req, res, next) {

    // checkPost() middleware must have already been called
    const post = res.locals.post

    // isUser() middleware must have already been called
    const userId = req.session.user.user_id

    //
    const canDelete = userId == post.user_id ||
        userId == config.adminUserId ||
        userId == post.lead_mod

    //
    if(!canDelete) {
        return render403(res,
            `You do not have permission to delete this post. ` +
            `<a href="/">Return to the home page</a>.`)
    }

    //
    next()
}

//
module.exports.canDeletePost = canDeletePost
