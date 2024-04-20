
//
const express = require('express')
const db = require('../db')
const myMisc = require('../util/misc.js')

const router = express.Router({mergeParams: true})

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
    return res.render(
        'user-profile',
        {
            html_title: dbUser.username,
            user: req.session.user,
            max_width: myMisc.getCurrSiteMaxWidth(req),
            username: dbUser.username,
            profile_text: dbUser.profile_blurb
        }
    )
}

//
router.get('/', get)
module.exports = router
