const express = require('express')
const db = require('../db')
const myMisc = require('../util/misc.js')
const config = require('../config')
const {isUser} = require('../middleware/is-user.js')
const {checkComment} = require('../middleware/check-comment.js')

const htmlTitle = 'Delete Comment'

//
const get = async (req, res) => {

    //
    const comment = res.locals.comment

    //
    if(!(comment.user_id == req.session.user.user_id || config.adminUserId == req.session.user.user_id || comment.lead_mod == req.session.user.user_id)) {
        return res.send('wrong user...')
    }

    //
    return res.render(
        'delete-comment',
        {
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
    if(!(comment.user_id == req.session.user.user_id || config.adminUserId == req.session.user.user_id || comment.lead_mod == req.session.user.user_id)) {
        return res.send('wrong user...')
    }

    await db.deleteComment(comment.path)
    
    return res.render(
        'message',
        {
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
router.get('/', isUser, checkComment, get)
router.post('/', isUser, checkComment, post)
module.exports = router
