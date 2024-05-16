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
router.get(
    '/posts',
    async (req, res) => {

        //
        let page = 1

        if(typeof req.query.p !== 'undefined') {
            page = parseInt(req.query.p)

            if(isNaN(page)) {
                page = 1
            }
        }

        //
        const oauthData = await oauthAuthenticate(req, res)

        //
        const sort = myMisc.getPostSort(req)
        const timeZone = oauthData ? oauthData.user.time_zone : config.defaultTimeZone

        const {rows} = await db.getPosts(
            timeZone,
            page,
            sort,
            config.defaultPostsPerPage,
            config.defaultDateFormat)

        //
        let rows2 = []

        for(const i in rows) {
            let v = rows[i]

            rows2.push({
                post_id: v.public_id,
                title: v.title,
                link: v.link,
                post_time: v.created_on_raw,
                author_username: v.username,
                author_user_id: v.user_public_id,
                num_comments: v.num_comments,
                sub: v.castle
            })
        }

        res.json(rows2)
    }
)

//
router.get(
    '/sub/posts',
    async (req, res) => {

        //
        if(typeof req.query.sub === 'undefined') {
            return res.status(400).json({
                errors: ['no sub in URL'],
            })
        }

        //
        const urlSub = req.query.sub
        //possibly check for proper sub regex here
        const {rows:[dbSub]} = await db.getSub(urlSub)

        //
        if(!dbSub) {
            return res.status(404).json({
                errors: ["sub doesn't exist or invalid sub"],
            })
        }

        //
        let page = 1

        if(typeof req.query.p !== 'undefined') {
            page = parseInt(req.query.p)

            if(isNaN(page)) {
                page = 1
            }
        }

        //
        const oauthData = await oauthAuthenticate(req, res)

        //
        const sort = myMisc.getPostSort(req)
        const timeZone = oauthData ? oauthData.user.time_zone : config.defaultTimeZone

        //
        const {rows} = await db.getTagPosts(
            timeZone,
            page,
            urlSub,
            sort,
            config.defaultPostsPerPage,
            config.defaultDateFormat)

        //
        const rows2 = []

        for(const i in rows) {
            const v = rows[i]

            rows2.push({
                post_id: v.public_id,
                title: v.title,
                link: v.link,
                post_time: v.created_on_raw,
                author_username: v.username,
                author_user_id: v.user_public_id,
                num_comments: v.num_comments,
                sub: v.castle
            })
        }

        res.json(rows2)
    }
)

router.get(
    '/post',
    async (req, res) => {

        //
        if(typeof req.query.postid === 'undefined') {
            return res.status(400).json({
                errors: ['no postid in URL'],
            })
        }

        //
        const oauthData = await oauthAuthenticate(req, res)

        //
        const postPublicId = req.query.postid
        const timeZone = oauthData ? oauthData.user.time_zone : config.defaultTimeZone

        //
        const {rows} = await db.getPostWithPublic2(
            postPublicId,
            timeZone,
            config.defaultDateFormat)

        //
        if(rows.length) {

            //
            let page = 1

            if(typeof req.query.p !== 'undefined') {
                page = parseInt(req.query.p)

                if(isNaN(page)) {
                    page = 1
                }
            }

            //
            const{rows:comments} = await db.getPostComments(
                rows[0].post_id,
                timeZone,
                page,
                config.defaultDateFormat)

            //
            let comments2 = []

            for(const i in comments) {
                const c = comments[i]
                const dotCount = (c.path.match(/\./g)||[]).length

                comments2.push({
                    comment_text: c.text_content,
                    indent_level: dotCount - 1,
                    author_username: c.username,
                    author_user_id: c.user_public_id,
                    comment_time: c.created_on_raw,
                    comment_id: c.public_id
                })
            }
            
            let r = {
                title: rows[0].title,
                link: rows[0].link,
                post_text: rows[0].text_content,
                post_time: rows[0].created_on_raw,
                author_username: rows[0].username,
                author_user_id: rows[0].user_public_id,
                comments: comments2,
                sub: rows[0].castle
            }

            res.json(r)
        }
        else {
            return res.status(404).json({
                errors: ["no post with that postid"],
            })
        }
    }
)

//
router.post(
    '/post',
    async (req, res) => {

        //
        const title = (typeof req.body.title === 'undefined') ? '' : req.body.title
        const text_content = (typeof req.body.text_content === 'undefined') ? '' : req.body.text_content
        const link = (typeof req.body.link === 'undefined') ? '' : req.body.link
        const sub = (typeof req.body.sub === 'undefined') ? '' : req.body.sub

        //
        const oauthData = await oauthAuthenticate(req, res)

        //
        if(!oauthData) {
            return res.status(401).json({
                errors: ['invalid or no user auth'],
            })
        }

        //
        const [errors, wsCompressedTitle, trimSub] = await db.validateNewPost(
            title,
            link,
            sub)

        //
        if(errors.length) {
            return res.status(400).json({
                errors: errors,
            })
        }

        //
        const newPost = await db.createPost(
            oauthData.user.user_id,
            wsCompressedTitle,
            text_content,
            link,
            trimSub)

        //
        return res.json(newPost)
    }
)

// edit post
router.put(
    '/post',
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
        if(typeof req.body.post_id === 'undefined') {
            return res.status(400).json({
                errors: ['no post_id in body'],
            })
        }

        //
        const postPublicId = req.body.post_id
        const {rows:[row]} = await db.getPostWithPublic(postPublicId)

        //
        if(!row) {
            return res.status(404).json({
                errors: ["no post with that postid"],
            })
        }

        //
        if(row.user_id != oauthData.user.user_id) {
            return res.status(403).json({
                errors: ["wrong user"],
            })
        }

        //
        const fTitle = typeof req.body.title === 'undefined'
            ? row.title
            : req.body.title

        //
        const fLink = typeof req.body.link === 'undefined'
            ? (row.link === null ? '' : row.link)
            : req.body.link

        //
        const fTextContent = typeof req.body.text_content === 'undefined'
            ? (row.text_content === null ? '' : row.text_content)
            : req.body.text_content

        //
        const [errors, wsCompressedTitle] = await db.validateEditPost(
            fTitle,
            fLink)

        //
        if(errors.length) {
            return res.status(400).json({
                errors: errors,
            })
        }

        //
        await db.updatePost(
            row.post_id,
            wsCompressedTitle,
            fTextContent,
            fLink)

        //
        return res.json({
            post_id: postPublicId,
        })
    }
)

// delete post
router.delete(
    '/post',
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
        if(typeof req.query.post_id === 'undefined') {
            return res.status(400).json({
                errors: ['no post_id in URL'],
            })
        }

        //
        const postPublicId = req.query.post_id
        const {rows:[row]} = await db.getPostWithPublic(postPublicId)

        //
        if(!row) {
            return res.status(404).json({
                errors: ["no post with that post id"],
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
        db.deletePost(row.post_id)

        //
        return res.json({
            success: true,
        })
    }
)

//
router.get(
    '/comment',
    async (req, res) => {

        //
        if(typeof req.query.commentid === 'undefined') {
            return res.status(400).json({
                errors: ['no commentid in URL'],
            })
        }

        //
        const oauthData = await oauthAuthenticate(req, res)

        //
        const commentPublicId = req.query.commentid
        const timeZone = oauthData ? oauthData.user.time_zone : config.defaultTimeZone

        //
        const {rows} = await db.getCommentWithPublic2(
            commentPublicId,
            timeZone,
            config.defaultDateFormat)

        //
        if(rows.length) {

            //
            let page = 1

            if(typeof req.query.p !== 'undefined') {
                page = parseInt(req.query.p)

                if(isNaN(page)) {
                    page = 1
                }
            }

            //
            const{rows:comments} = await db.getCommentComments(
                rows[0].path,
                timeZone,
                page,
                config.defaultDateFormat)

            //
            let comments2 = []
            const rootDotCount = (rows[0].path.match(/\./g)||[]).length

            for(const i in comments) {
                const c = comments[i]
                const dotCount = (c.path.match(/\./g)||[]).length

                comments2.push({
                    comment_text: c.text_content,
                    indent_level: dotCount - rootDotCount - 1,
                    author_username: c.username,
                    author_user_id: c.user_public_id,
                    comment_time: c.created_on_raw,
                    comment_id: c.public_id
                })
            }
            
            let r = {
                comment_text: rows[0].text_content,
                comment_time: rows[0].created_on_raw,
                author_username: rows[0].username,
                author_user_id: rows[0].user_public_id,
                comments: comments2
            }

            res.json(r)
        }
        else {
            return res.status(404).json({
                errors: ["no comment with that commentid"],
            })
        }
    }
)

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
                compressedComment)

            //todo: use a postgres trigger for this
            await db.incPostNumComments(row.post_id)

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
                config.defaultDateFormat)

            //todo: use trigger
            await db.incPostNumComments(row.post_id)

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
