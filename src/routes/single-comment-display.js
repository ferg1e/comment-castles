const config = require('../config')
const express = require('express')
const db = require('../db')
const userSettings = require('../util/user-settings.js')
const {sitePageValue} = require('../middleware/site-page-value')
const {checkComment2} = require('../middleware/check-comment2')
const {isUser} = require('../middleware/is-user')
const {validateComment} = require('../util/validate')

const router = express.Router({mergeParams: true})
const htmlTitle = 'Comment #'

//
const get = async (req, res) => {

    //
    const commentPublicId = res.locals.commentPublicId
    const dbComment = res.locals.comment

    //
    const page = res.locals.page

    //
    const{rows:comments} = await db.getCommentComments(
        dbComment.path,
        userSettings.getCurrTimeZone(req),
        page,
        userSettings.getCurrDateFormat(req))

    //
    const {rows:[{count:numComments}]} = await db.getCommentNumComments(dbComment.path)
    const totalPages = Math.ceil(numComments/config.commentsPerPage)

    //
    return res.render(
        'single-comment',
        {
            html_title: htmlTitle + commentPublicId,
            user: req.session.user,
            post_public_id: dbComment.post_public_id,
            comment: dbComment,
            comments: comments,
            errors: [],
            comment_reply_mode: userSettings.getCurrCommentReplyMode(req),
            page: page,
            total_pages: totalPages,
            lead_mod_user_id: dbComment.lead_mod,
            curr_castle: dbComment.castle,
        }
    )
}

//
const post = async (req, res) => {

    //
    const commentPublicId = res.locals.commentPublicId
    const dbComment = res.locals.comment

    //
    let [compressedComment, errors] = validateComment(req.body.text_content)

    if(errors.length) {

        //
        const page = res.locals.page

        const{rows:comments} = await db.getCommentComments(
            dbComment.path,
            userSettings.getCurrTimeZone(req),
            page,
            userSettings.getCurrDateFormat(req))

        //
        const {rows:[{count:numComments}]} = await db.getCommentNumComments(dbComment.path)
        const totalPages = Math.ceil(numComments/config.commentsPerPage)

        //
        return res.render(
            'single-comment',
            {
                html_title: htmlTitle + commentPublicId,
                user: req.session.user,
                post_public_id: dbComment.post_public_id,
                comment: dbComment,
                comments: comments,
                errors: errors,
                comment_reply_mode: userSettings.getCurrCommentReplyMode(req),
                page,
                total_pages: totalPages,
                lead_mod_user_id: dbComment.lead_mod,
                curr_castle: dbComment.castle,
            }
        )
    }
    
    //
    const {rows:data1} = await db.createCommentComment(
        dbComment.post_id,
        req.session.user.user_id,
        compressedComment,
        dbComment.path,
        config.defaultTimeZone,
        config.defaultDateFormat,
        dbComment.user_id)

    //
    const {rows:[{count:numComments}]} = await db.getCommentNumComments(dbComment.path)
    const pages = Math.ceil(numComments/config.commentsPerPage)
    const redirectUrl = (pages > 1)
        ? `/c/${commentPublicId}?p=${pages}#${data1[0].public_id}`
        : `/c/${commentPublicId}#${data1[0].public_id}`

    return res.redirect(redirectUrl)
}

//
router.get('/', checkComment2, sitePageValue, get)
router.post('/', isUser, checkComment2, sitePageValue, post)
module.exports = router
