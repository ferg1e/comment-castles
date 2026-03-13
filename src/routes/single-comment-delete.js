const express = require('express')
const db = require('../db')
const myMisc = require('../util/misc.js')
const {isUser} = require('../middleware/is-user.js')
const {checkComment} = require('../middleware/check-comment.js')
const {canDeleteComment} = require('../middleware/can-delete-comment.js')

//
const htmlTitle = 'Delete Comment'

//
const get = async (req, res) => {

    //
    const comment = res.locals.comment

    //
    return res.render('delete-comment', {
        html_title: htmlTitle,
        user: req.session.user,
        text_content: comment.text_content,
        lead_mod_user_id: comment.lead_mod,
        curr_castle: comment.castle,
        max_width: myMisc.getCurrSiteMaxWidth(req)
    })
}

//
const post = async (req, res) => {
            
    //
    const comment = res.locals.comment

    //
    await db.deleteComment(comment.path)

    //
    return res.render('message', {
        html_title: htmlTitle,
        message: "The comment and all of its sub comments (if any) were successfully deleted.",
        user: req.session.user,
        lead_mod_user_id: comment.lead_mod,
        curr_castle: comment.castle,
        max_width: myMisc.getCurrSiteMaxWidth(req)
    })
}

//
const router = express.Router({mergeParams: true})
router.get('/', isUser, checkComment, canDeleteComment, get)
router.post('/', isUser, checkComment, canDeleteComment, post)
module.exports = router
