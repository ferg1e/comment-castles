const express = require('express')
const db = require('../db')
const myMisc = require('../util/misc.js')
const config = require('../config')

const router = express.Router({mergeParams: true})
const htmlTitle = 'Delete Post'

router.route('/')
    .get(async (req, res) => {

        //
        if(!req.session.user) {
            return res.send('sorry...')
        }

        //
        const postPublicId = req.params[0]
        const {rows} = await db.getPostWithPublic(postPublicId)

        //
        if(!rows.length) {
            return res.send('unknown post...')
        }

        //
        if(!(rows[0].user_id == req.session.user.user_id || req.session.user.user_id == config.adminUserId || rows[0].lead_mod == req.session.user.user_id)) {
            return res.send('wrong user...')
        }

        //
        res.render(
            'delete-post',
            {
                html_title: htmlTitle,
                user: req.session.user,
                title: rows[0].title,
                lead_mod_user_id: rows[0].lead_mod,
                curr_castle: rows[0].castle,
                max_width: myMisc.getCurrSiteMaxWidth(req)
            })
    })
    .post(async (req, res) => {
            
        //
        if(!req.session.user) {
            return res.send('nope...')
        }

        //
        const postPublicId = req.params[0]
        const {rows} = await db.getPostWithPublic(postPublicId)

        //
        if(!rows.length) {
            return res.send('unknown post...')
        }

        //
        if(!(rows[0].user_id == req.session.user.user_id || req.session.user.user_id == config.adminUserId || rows[0].lead_mod == req.session.user.user_id)) {
            return res.send('wrong user...')
        }

        await db.deletePost(rows[0].post_id)
        
        return res.render(
            'message',
            {
                html_title: htmlTitle,
                message: "The post and all of its comments (if any) were successfully deleted.",
                user: req.session.user,
                lead_mod_user_id: rows[0].lead_mod,
                curr_castle: rows[0].castle,
                max_width: myMisc.getCurrSiteMaxWidth(req)
            })
    })

module.exports = router
