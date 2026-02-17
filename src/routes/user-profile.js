
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
        return res.status(404).render('http-error-404', {
            message: `There is no user with that user ID. ` +
                `<a href="/">Return to the home page</a>.`
        })
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
