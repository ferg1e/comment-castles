//
const express = require('express')
const db = require('../db')
const myMisc = require('../util/misc.js')

const router = express.Router()
const htmlTitle = 'Settings / Profile'

//
const get = async (req, res) => {

    //
    if(!req.session.user) {
        return res.redirect('/settings')
    }

    //
    const {rows:[row]} = await db.getUserWithUserId(req.session.user.user_id)

    //
    res.render(
        'my-settings-profile',
        {
            html_title: htmlTitle,
            user: req.session.user,
            max_width: myMisc.getCurrSiteMaxWidth(req),
            errors: [],
            profile: row.profile_blurb,
        })
}

//
const post = async (req, res) => {

    //
    if(!req.session.user) {
        return res.send('nope...')
    }

    //
    const profile = req.body.profile

    //
    await db.updateUserProfile(req.session.user.user_id, profile)

    //
    res.render(
        'my-settings-profile',
        {
            html_title: htmlTitle,
            user: req.session.user,
            max_width: myMisc.getCurrSiteMaxWidth(req),
            errors: [],
            success: "profile updated",
            profile: profile,
        })
}

//
router.get('/', get)
router.post('/', post)
module.exports = router
