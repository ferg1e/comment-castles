const config = require('../config')
const express = require('express')
const db = require('../db')
const {isUser} = require('../middleware/is-user.js')
const {sitePageValue} = require('../middleware/site-page-value.js')
const {checkPost2} = require('../middleware/check-post2.js')
const {renderPaginate404} = require('../util/render')
const myMisc = require('../util/misc.js')
const {processComment} = require('../util/validate')

//
const get = async (req, res) => {
    
    //
    const page = res.locals.page
    const post = res.locals.post

    //
    const numPages = Math.ceil(post.num_comments/config.commentsPerPage)

    //
    if(numPages > 0 && page > numPages) {
        return renderPaginate404(req, res, page, numPages)
    }

    //
    const {rows:comments} = await db.getPostComments(
        post.post_id,
        myMisc.getCurrTimeZone(req),
        page,
        myMisc.getCurrDateFormat(req))

    //
    return res.render('single-post', {
        html_title: post.title,
        user: req.session.user,
        post: post,
        lead_mod_user_id: post.lead_mod,
        curr_castle: post.castle,
        comments,
        errors: [],
        comment_reply_mode: myMisc.getCurrCommentReplyMode(req),
        max_width: myMisc.getCurrSiteMaxWidth(req),
        page,
        total_pages: numPages
    })
}

//
const post = async (req, res) => {

    //
    const post = res.locals.post
    const postPublicId = res.locals.postPublicId

    //
    const [compressedComment, errors] = processComment(req.body.text_content)

    //
    if(errors.length > 0) {

        //
        const page = res.locals.page

        const {rows:comments} = await db.getPostComments(
            post.post_id,
            myMisc.getCurrTimeZone(req),
            page,
            myMisc.getCurrDateFormat(req))

        //
        const totalPages = Math.ceil(post.num_comments/config.commentsPerPage)

        //
        return res.render('single-post', {
            html_title: post.title,
            user: req.session.user,
            post: post,
            lead_mod_user_id: post.lead_mod,
            curr_castle: post.castle,
            comments,
            errors,
            comment_reply_mode: myMisc.getCurrCommentReplyMode(req),
            max_width: myMisc.getCurrSiteMaxWidth(req),
            page,
            total_pages: totalPages
        })
    }

    //
    const {rows:data1} = await db.createPostComment(
        post.post_id,
        req.session.user.user_id,
        compressedComment,
        post.user_id)

    //
    const {rows:data2} = await db.getPostNumComments(post.post_id)

    //
    const numComments = data2[0]['count']
    const pages = Math.ceil(numComments / config.commentsPerPage)
    const redirectUrl = (pages > 1)
        ? `/p/${postPublicId}?p=${pages}#${data1[0].public_id}`
        : `/p/${postPublicId}#${data1[0].public_id}`

    return res.redirect(redirectUrl)
}

//
const router = express.Router({mergeParams: true})
router.get('/', checkPost2, sitePageValue, get)
router.post('/', isUser, checkPost2, sitePageValue, post)
module.exports = router
