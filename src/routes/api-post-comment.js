const db = require('../db')
const myMisc = require('../util/misc.js')
const config = require('../config')
const {oauthAuthenticate} = require('../util/oauth-authenticate')

//
const post = async (req, res) => {

    //
    const oauthData = await oauthAuthenticate(req, res)

    //
    if(!oauthData) {
        return res.status(401).json({
            errors: ['invalid or no user auth'],
        })
    }

    //
    const postId = req.body.post_id
    const commentId = req.body.comment_id
    const isPostId = typeof postId !== 'undefined'
    const isCommentId = typeof commentId !== 'undefined'
    const isBoth = isPostId && isCommentId
    const isNeither = !isPostId && !isCommentId
    const initialErrors = []

    //
    if(isNeither) {
        initialErrors.push('must supply an existing post_id or comment_id')
    }

    //
    if(isBoth) {
        initialErrors.push('do not send both a post_id and comment_id')
    }

    //
    if(typeof req.body.text_content === 'undefined') {
        initialErrors.push('missing text_content value')
    }

    //
    if(initialErrors.length > 0) {
        return res.status(400).json({errors: initialErrors})
    }

    //
    if(isPostId) {

        //
        const {rows:[row]} = await db.getPostWithPublic2(
            postId,
            oauthData.user.time_zone,
            config.defaultDateFormat)

        //
        if(!row) {
            return res.status(404).json({errors: ['no such post']})
        }

        //
        const [compressedComment, errors] = myMisc.processComment(req.body.text_content)

        //
        if(errors.length > 0) {
            return res.status(400).json({errors: errors})
        }

        //
        const {rows:[newComment]} = await db.createPostComment(
            row.post_id,
            oauthData.user.user_id,
            compressedComment,
            row.user_id)

        //
        return res.json({
            comment_id: newComment.public_id,
            comment_text: newComment.text_content,
            comment_time: newComment.created_on,
        })
    }
    else {

        //
        const {rows:[row]} = await db.getCommentWithPublic2(
            commentId,
            oauthData.user.time_zone,
            config.defaultDateFormat)

        if(!row) {
            return res.status(404).json({errors: ['no such comment']})
        }

        //
        const [compressedComment, errors] = myMisc.processComment(req.body.text_content)

        //
        if(errors.length > 0) {
            return res.status(400).json({errors: errors})
        }

        //
        const {rows:[newComment]} = await db.createCommentComment(
            row.post_id,
            oauthData.user.user_id,
            compressedComment,
            row.path,
            oauthData.user.time_zone,
            config.defaultDateFormat,
            row.user_id)

        //
        return res.json({
            comment_id: newComment.public_id,
            comment_text: newComment.text_content,
            comment_time: newComment.created_on_raw,
        })
    }
}

//
module.exports = post
