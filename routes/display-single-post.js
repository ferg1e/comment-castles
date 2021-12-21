const config = require('../config')
const express = require('express')
const db = require('../db')
const myMisc = require('../misc.js')

//
const router = express.Router({
    mergeParams: true
})

//
const get = async (req, res) => {
    const postPublicId = req.params[0]
    const finalUserId = req.session.user ? req.session.user.user_id : -1
    const filterUserId = await db.getCurrEyesId(req)

    //
    const {rows:[row]} = await db.getPostWithPublic2(
        postPublicId,
        myMisc.getCurrTimeZone(req),
        finalUserId,
        filterUserId)

    //
    if(!row) return res.send('not found')

    //
    const isAllowed = await db.isAllowedToViewPost(row.private_group_ids, finalUserId)

    if(!isAllowed) {
        return res.render('message', {
            html_title: 'Post #' + row.public_id,
            message: "This post is from a private group and you do not have access.",
            user: req.session.user,
            max_width: myMisc.getCurrSiteMaxWidth(req)
        })
    }

    //
    let page = 1

    if(typeof req.query.p !== 'undefined') {
        page = parseInt(req.query.p)

        if(isNaN(page)) {
            return res.redirect(`/p/${postPublicId}`)
        }
    }

    //
    const isDiscoverMode = myMisc.isDiscover(req)

    const {rows:comments} = await db.getPostComments(
        row.post_id,
        myMisc.getCurrTimeZone(req),
        finalUserId,
        isDiscoverMode,
        filterUserId,
        page)

    const htmlTitle = row.is_visible
        ? row.title
        : 'Post #' + row.public_id

    //
    res.render('single-post', {
        html_title: htmlTitle,
        user: req.session.user,
        post: row,
        comments,
        errors: [],
        is_discover_mode: isDiscoverMode,
        comment_reply_mode: myMisc.getCurrCommentReplyMode(req),
        max_width: myMisc.getCurrSiteMaxWidth(req),
        page
    })
}

//
const post = async (req, res) => {

    // @todo: This should be middleware
    if(!req.session.user) return res.send('nope...')

    //
    const postPublicId = req.params[0]
    const finalUserId = req.session.user ? req.session.user.user_id : -1
    const filterUserId = await db.getCurrEyesId(req)

    const {rows:[row]} = await db.getPostWithPublic2(
        postPublicId,
        myMisc.getCurrTimeZone(req),
        finalUserId,
        filterUserId)

    //
    if(!row) return res.send('not found')

    //
    const isAllowed = await db.isAllowedToViewPost(row.private_group_ids, req.session.user.user_id)

    if(!isAllowed) {
        return res.render('message', {
            html_title: 'Post #' + row.public_id,
            message: "This post is from a private group and you do not have access.",
            user: req.session.user,
            max_width: myMisc.getCurrSiteMaxWidth(req)
        })
    }

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

        //
        const isDiscoverMode = myMisc.isDiscover(req)

        const {rows:comments} = await db.getPostComments(
            row.post_id,
            myMisc.getCurrTimeZone(req),
            finalUserId,
            isDiscoverMode,
            filterUserId,
            page)

        const htmlTitle = row.is_visible
            ? row.title
            : 'Post #' + row.public_id

        //
        return res.render('single-post', {
            html_title: htmlTitle,
            user: req.session.user,
            post: row,
            comments,
            errors,
            is_discover_mode: isDiscoverMode,
            comment_reply_mode: myMisc.getCurrCommentReplyMode(req),
            max_width: myMisc.getCurrSiteMaxWidth(req),
            page
        })
    }

    //
    const {rows:data1} = await db.createPostComment(
        row.post_id,
        req.session.user.user_id,
        compressedComment)

    //
    await db.incPostNumComments(row.post_id)

    //
    const numComments = row.num_comments + 1
    const pages = Math.ceil(numComments / config.commentsPerPage)
    const redirectUrl = (pages > 1)
        ? `/p/${postPublicId}?p=${pages}#${data1[0].public_id}`
        : `/p/${postPublicId}#${data1[0].public_id}`

    return res.redirect(redirectUrl)
}

//
router.get('/', get)
router.post('/', post)
module.exports = router
