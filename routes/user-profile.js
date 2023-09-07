
//
const express = require('express')
const db = require('../db')
const myMisc = require('../misc.js')

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
    const loggedInUserId = req.session.user ? req.session.user.user_id : -1
    const filterUserId = await db.getCurrEyesId(req)
    const targetUserId = dbUser.user_id
    let isFollow = false

    //
    if(loggedInUserId != -1) {
        const {rows:[flag]} = await db.getUserFollowee(loggedInUserId, targetUserId)
        isFollow = typeof flag != 'undefined'
    }

    //
    const {rows:[flag2]} = await db.getUserFollowee(filterUserId, targetUserId)
    const isVisible = loggedInUserId == targetUserId ||
        filterUserId == targetUserId ||
        typeof flag2 != 'undefined'

    //
    return res.render(
        'user-profile',
        {
            html_title: dbUser.username,
            user: req.session.user,
            max_width: myMisc.getCurrSiteMaxWidth(req),
            username: dbUser.username,
            profile_text: dbUser.profile_blurb,
            is_follow: isFollow,
            is_visible: isVisible,
            is_self: loggedInUserId == targetUserId,
            user_public_id: userPublicId,
        }
    )
}

//
router.get('/', get)
module.exports = router
