const db = require('../db')
const config = require('../config')
const {isOauthUser} = require('../middleware/is-oauth-user')
const {validateComment} = require('../util/validate')

//
const post = async (req, res) => {

    //
    const oauthUser = res.locals.oauthUser

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
            oauthUser.time_zone,
            config.defaultDateFormat)

        //
        if(!row) {
            return res.status(404).json({errors: ['no such post']})
        }

        //
        const [compressedComment, errors] = validateComment(req.body.text_content)

        //
        if(errors.length > 0) {
            return res.status(400).json({errors: errors})
        }

        //
        const {rows:[newComment]} = await db.createPostComment(
            row.post_id,
            oauthUser.user_id,
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
            oauthUser.time_zone,
            config.defaultDateFormat)

        if(!row) {
            return res.status(404).json({errors: ['no such comment']})
        }

        //
        const [compressedComment, errors] = validateComment(req.body.text_content)

        //
        if(errors.length > 0) {
            return res.status(400).json({errors: errors})
        }

        //
        const {rows:[newComment]} = await db.createCommentComment(
            row.post_id,
            oauthUser.user_id,
            compressedComment,
            row.path,
            oauthUser.time_zone,
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
module.exports = [isOauthUser, post]
