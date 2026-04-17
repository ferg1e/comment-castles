const db = require('../db')
const myMisc = require('../util/misc.js')
const {isOauthUser} = require('../middleware/is-oauth-user')
const {processComment} = require('../util/validate')

//
const put = async (req, res) => {

    //
    const oauthUser = res.locals.oauthUser

    //
    if(typeof req.body.comment_id === 'undefined') {
        return res.status(400).json({
            errors: ['no comment_id in body'],
        })
    }

    //
    const commentPublicId = req.body.comment_id
    const {rows:[row]} = await db.getCommentWithPublic(commentPublicId)

    //
    if(!row) {
        return res.status(404).json({
            errors: ["no comment with that comment id"],
        })
    }

    //
    if(row.user_id != oauthUser.user_id) {
        return res.status(403).json({
            errors: ["wrong user"],
        })
    }

    //
    if(typeof req.body.text_content === 'undefined') {
        return res.status(400).json({
            errors: ['no text_content in body'],
        })
    }

    //
    const [compressedComment, errors] = processComment(req.body.text_content)

    //
    if(errors.length) {
        return res.status(400).json({
            errors: errors,
        })
    }

    //
    await db.updateComment(
        row.comment_id,
        compressedComment)

    //
    return res.json({
        comment_id: commentPublicId,
    })
}

//
module.exports = [isOauthUser, put]
