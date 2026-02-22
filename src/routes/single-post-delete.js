const express = require('express')
const db = require('../db')
const myMisc = require('../util/misc.js')
const config = require('../config')
const {checkPost} = require('../middleware/check-post.js')

const router = express.Router({mergeParams: true})
const htmlTitle = 'Delete Post'

//
const get = async (req, res) => {

    //
    if(!req.session.user) {
        return res.send('sorry...')
    }

    //
    const post = res.locals.post

    //
    if(!(post.user_id == req.session.user.user_id || req.session.user.user_id == config.adminUserId || post.lead_mod == req.session.user.user_id)) {
        return res.send('wrong user...')
    }

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
    if(!req.session.user) {
        return res.send('nope...')
    }

    //
    const post = res.locals.post

    //
    if(!(post.user_id == req.session.user.user_id || req.session.user.user_id == config.adminUserId || post.lead_mod == req.session.user.user_id)) {
        return res.send('wrong user...')
    }

    await db.deletePost(post.post_id)
    
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
router.get('/', checkPost, get)
router.post('/', checkPost, post)
module.exports = router
