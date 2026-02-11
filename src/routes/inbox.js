const express = require('express')
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
