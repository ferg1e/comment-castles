const express = require('express')
const argon2 = require('argon2')
const db = require('../db')
const myMisc = require('../util/misc.js')
const {isUser} = require('../middleware/is-user.js')

const regexUsername = /^[a-z0-9-]{4,16}$/i
const htmlTitle = 'Settings / Username'

//
const get = async (req, res) => {

    //
    return res.render('my-settings-username', {
        html_title: htmlTitle,
        user: req.session.user,
        max_width: myMisc.getCurrSiteMaxWidth(req),
        errors: [],
        username: req.session.user.username
    })
}

//
const post = async (req, res) => {

    //
    const errors = []
    const username = req.body.username

    //
    if(!username.match(regexUsername)) {
        errors.push("Username must be 4-16 characters(letters, numbers and dashes only)")
    }
    else {
        const {rows} = await db.getUserWithUsername(username)

        if(rows.length && rows[0].user_id != req.session.user.user_id) {
            errors.push("username already taken")
        }
    }

    //
    const {rows:rows2} = await db.getUserWithUserId(req.session.user.user_id)
    const isCorrectPassword = await argon2.verify(rows2[0].password, req.body.password)

    if(!isCorrectPassword) {
        errors.push("incorrect existing password")
    }

    //
    if(errors.length) {
        return res.render('my-settings-username', {
            html_title: htmlTitle,
            user: req.session.user,
            max_width: myMisc.getCurrSiteMaxWidth(req),
            errors: errors,
            username: username
        })
    }

    //
    await db.updateUserUsername(req.session.user.user_id, username)
    req.session.user.username = username

    //
    return res.render('my-settings-username', {
        html_title: htmlTitle,
        user: req.session.user,
        max_width: myMisc.getCurrSiteMaxWidth(req),
        errors: [],
        success: 'Username successfully saved',
        username: username
    })
}

//
const router = express.Router()
router.get('/', isUser, get)
router.post('/', isUser, post)
module.exports = router
