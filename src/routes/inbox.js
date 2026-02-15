const express = require('express')
const config = require('../config')
const db = require('../db')
const {isUser} = require('../middleware/is-user.js')
const myMisc = require('../util/misc.js')
const {sitePageValue} = require('../middleware/site-page-value.js')

const router = express.Router()

//
const get = async (req, res) => {

    //
    const page = res.locals.page

    //
    const commentsPerPage = config.inboxCommentsPerPage
    const {rows:[{count:commentsCount}]} = await db.getInboxCommentsCount(req.session.user.user_id)
    const numPages = Math.ceil(commentsCount/commentsPerPage)

    //
    if(numPages > 0 && page > numPages) {
        return res.status(404).render('http-error-404', {
            message: `There are only ${numPages} pages and ` +
                `you tried to access page ${page}. ` +
                `<a href="/inbox">Return to page 1</a>.`
        })
    }

    //
    await db.zeroUserUnreadComments(req.session.user.user_id)

    //
    const{rows:comments} = await db.getInboxComments(
        myMisc.getCurrTimeZone(req),
        req.session.user.user_id,
        page,
        myMisc.getCurrDateFormat(req))

    //
    return res.render('inbox', {
        html_title: 'Inbox',
        user: req.session.user,
        comments: comments,
        page: page,
        comment_reply_mode: myMisc.getCurrCommentReplyMode(req),
        max_width: myMisc.getCurrSiteMaxWidth(req)
    })
}

//
router.get('/', isUser, sitePageValue, get)
module.exports = router
