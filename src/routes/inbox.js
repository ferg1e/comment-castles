const express = require('express')
const config = require('../config')
const db = require('../db')
const {isUser} = require('../middleware/is-user.js')
const userSettings = require('../util/user-settings.js')
const {sitePageValue} = require('../middleware/site-page-value.js')
const {renderPaginate404} = require('../util/render')

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
        return renderPaginate404(req, res, page, numPages)
    }

    //
    await db.zeroUserUnreadComments(req.session.user.user_id)
    res.locals.unreadCommentCount = 0

    //
    const{rows:comments} = await db.getInboxComments(
        userSettings.getCurrTimeZone(req),
        req.session.user.user_id,
        page,
        userSettings.getCurrDateFormat(req))

    //
    return res.render('inbox', {
        html_title: 'Inbox',
        user: req.session.user,
        comments: comments,
        page: page,
        comment_reply_mode: userSettings.getCurrCommentReplyMode(req)
    })
}

//
router.get('/', isUser, sitePageValue, get)
module.exports = router
