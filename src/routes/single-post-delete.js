const express = require('express')
const db = require('../db')
const myMisc = require('../util/misc.js')
const config = require('../config')
const {checkPost} = require('../middleware/check-post.js')
const {isUser} = require('../middleware/is-user.js')
const {canDeletePost} = require('../middleware/can-delete-post.js')

const router = express.Router({mergeParams: true})
const htmlTitle = 'Delete Post'

//
const get = async (req, res) => {

    //
    const post = res.locals.post

    //
    res.render(
        'delete-post',
        {
            html_title: htmlTitle,
            user: req.session.user,
            title: post.title,
            lead_mod_user_id: post.lead_mod,
            curr_castle: post.castle,
            max_width: myMisc.getCurrSiteMaxWidth(req)
        })
}

//
const post = async (req, res) => {
            
    //
    const post = res.locals.post

    //
    await db.deletePost(post.post_id)

    //
    return res.render(
        'message',
        {
            html_title: htmlTitle,
            message: "The post and all of its comments (if any) were successfully deleted.",
            user: req.session.user,
            lead_mod_user_id: post.lead_mod,
            curr_castle: post.castle,
            max_width: myMisc.getCurrSiteMaxWidth(req)
        })
}

//
router.get('/', isUser, checkPost, canDeletePost, get)
router.post('/', isUser, checkPost, canDeletePost, post)
module.exports = router
