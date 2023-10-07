
//
const express = require('express')
const db = require('../db')
const myMisc = require('../misc.js')
const config = require('../config')

const router = express.Router({mergeParams: true})
//const htmlTitleNewPost = 'New Post'

//
const get = async (req, res) => {

    const userPublicId = req.params[0]
    const {rows:[dbUser]} = await db.getUserWithPublicId(userPublicId)

    //
    if(!dbUser) {
        return res.render(
            'message',
            {
                html_title: "Unknown User",
                message: "No user with that ID.",
                user: req.session.user,
                max_width: myMisc.getCurrSiteMaxWidth(req)
            }
        )
    }

    //
    const finalUserId = req.session.user ? req.session.user.user_id : config.eyesDefaultUserId
    const targetUserId = dbUser.user_id

    //
    const {rows:[flag2]} = await db.getUserFollowee(finalUserId, targetUserId)
    const isVisible = finalUserId == targetUserId ||
        typeof flag2 != 'undefined'

    //
    const selfCheckUserId = req.session.user ? req.session.user.user_id : -1

    return res.render(
        'user-profile',
        {
            html_title: dbUser.username,
            user: req.session.user,
            max_width: myMisc.getCurrSiteMaxWidth(req),
            username: dbUser.username,
            profile_text: dbUser.profile_blurb,
            is_visible: isVisible,
            is_self: selfCheckUserId == targetUserId,
            user_public_id: userPublicId,
        }
    )
}

//
router.get('/', get)
module.exports = router
