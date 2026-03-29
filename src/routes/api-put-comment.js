const db = require('../db')
const myMisc = require('../util/misc.js')
const {oauthAuthenticate} = require('../util/oauth-authenticate')

//
const put = async (req, res) => {

    //
    const oauthData = await oauthAuthenticate(req, res)

    //
    if(!oauthData) {
        return res.status(401).json({
            errors: ['invalid or no user auth'],
        })
    }

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
    if(row.user_id != oauthData.user.user_id) {
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
    const [compressedComment, errors] = myMisc.processComment(req.body.text_content)

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
module.exports = put
