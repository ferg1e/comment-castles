const express = require('express')
const db = require('../db')
const {isUser} = require('../middleware/is-user.js')

//
const htmlTitle = 'Settings / Profile'

//
const get = async (req, res) => {

    //
    const {rows:[row]} = await db.getUserWithUserId(req.session.user.user_id)

    //
    return res.render('my-settings-profile', {
        html_title: htmlTitle,
        user: req.session.user,
        errors: [],
        profile: row.profile_blurb,
    })
}

//
const post = async (req, res) => {

    //
    const profile = req.body.profile

    //
    await db.updateUserProfile(req.session.user.user_id, profile)

    //
    return res.render('my-settings-profile', {
        html_title: htmlTitle,
        user: req.session.user,
        errors: [],
        success: "profile updated",
        profile: profile,
    })
}

//
const router = express.Router()
router.get('/', isUser, get)
router.post('/', isUser, post)
module.exports = router
