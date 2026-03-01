const config = require('../config')
const express = require('express')
const db = require('../db')
const {isUser} = require('../middleware/is-user.js')
const {sitePageValue} = require('../middleware/site-page-value.js')
const {checkPost2} = require('../middleware/check-post2.js')
const myMisc = require('../util/misc.js')

//
const router = express.Router({
    mergeParams: true
})

//
const get = async (req, res) => {
    
    //
    const page = res.locals.page
    const post = res.locals.post

    //
    const numPages = Math.ceil(post.num_comments/config.commentsPerPage)

    //
    const {rows:comments} = await db.getPostComments(
        post.post_id,
        myMisc.getCurrTimeZone(req),
        page,
        myMisc.getCurrDateFormat(req))

    const htmlTitle = post.title

    //
    res.render('single-post', {
        html_title: htmlTitle,
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
    const postPublicId = req.params[0]

    const {rows:[row]} = await db.getPostWithPublic2(
        postPublicId,
        myMisc.getCurrTimeZone(req),
        myMisc.getCurrDateFormat(req))

    //
    if(!row) return res.send('not found')

    //
    const [compressedComment, errors] = myMisc.processComment(req.body.text_content)

    //
    if(errors.length > 0) {

        //
        let page = 1

        if(typeof req.query.p !== 'undefined') {
            page = parseInt(req.query.p)

            if(isNaN(page)) {
                return res.redirect(`/p/${postPublicId}`)
            }
        }

        const {rows:comments} = await db.getPostComments(
            row.post_id,
            myMisc.getCurrTimeZone(req),
            page,
            myMisc.getCurrDateFormat(req))

        const htmlTitle = row.title

        //
        const totalPages = Math.ceil(row.num_comments/config.commentsPerPage)

        //
        return res.render('single-post', {
            html_title: htmlTitle,
            user: req.session.user,
            post: row,
            lead_mod_user_id: row.lead_mod,
            curr_castle: row.castle,
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
        row.post_id,
        req.session.user.user_id,
        compressedComment,
        row.user_id)

    //
    const {rows:data2} = await db.getPostNumComments(row.post_id)

    //
    const numComments = data2[0]['count']
    const pages = Math.ceil(numComments / config.commentsPerPage)
    const redirectUrl = (pages > 1)
        ? `/p/${postPublicId}?p=${pages}#${data1[0].public_id}`
        : `/p/${postPublicId}#${data1[0].public_id}`

    return res.redirect(redirectUrl)
}

//
router.get('/', checkPost2, sitePageValue, get)
router.post('/', isUser, post)
module.exports = router
