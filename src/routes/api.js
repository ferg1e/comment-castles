const express = require('express')
const db = require('../db')
const myMisc = require('../util/misc.js')
const config = require('../config')
const OAuth2Server = require('oauth2-server')
const Request = require('oauth2-server').Request
const Response = require('oauth2-server').Response

//
const router = express.Router()

//
const oauth = new OAuth2Server({
    model: require('../oauth-model.js')
})

//
router.get('/posts', require('./api-get-posts'))

//
router.get('/sub/posts', require('./api-get-sub-posts'))

//
router.get('/post', require('./api-get-post'))

//
router.post('/post', require('./api-post-post'))

// edit post
router.put('/post', require('./api-put-post'))

// delete post
router.delete('/post', require('./api-delete-post'))

//
router.get('/comment', require('./api-get-comment'))

//
router.post(
    '/comment',
    async (req, res) => {

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
)

// edit comment
router.put(
    '/comment',
    async (req, res) => {

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
)

// delete comment
router.delete(
    '/comment',
    async (req, res) => {

        //
        const oauthData = await oauthAuthenticate(req, res)

        //
        if(!oauthData) {
            return res.status(401).json({
                errors: ['invalid or no user auth'],
            })
        }

        //
        if(typeof req.query.comment_id === 'undefined') {
            return res.status(400).json({
                errors: ['no comment_id in URL'],
            })
        }

        //
        const commentPublicId = req.query.comment_id
        const {rows:[row]} = await db.getCommentWithPublic(commentPublicId)

        //
        if(!row) {
            return res.status(404).json({
                errors: ["no comment with that comment id"],
            })
        }

        //
        if(row.user_id != oauthData.user.user_id &&
            config.adminUserId != oauthData.user.user_id &&
            row.lead_mod != oauthData.user.user_id)
        {
            return res.status(403).json({
                errors: ["wrong user"],
            })
        }

        //
        await db.deleteComment(row.path)

        //
        return res.json({
            success: true,
        })
    }
)

//
module.exports = router

//
async function oauthAuthenticate(req, res) {
    const request = new Request(req)
    const response = new Response(res)
    const options = {}
    let oauthData = null

    try {
        oauthData = await oauth.authenticate(request, response, options)
    }
    catch(e) {
        // basically no access token in header
        // or wrong access token in header
        // either way, do nothing and proceed
        // with API call render
    }

    return oauthData
}
