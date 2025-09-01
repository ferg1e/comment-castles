//
const express = require('express')
const argon2 = require('argon2')
const db = require('../db')
const myMisc = require('../util/misc.js')

const router = express.Router()
const htmlTitle = 'Settings / Password'

//
const get = async (req, res) => {

    //
    if(!req.session.user) {
        return res.redirect('/settings')
    }

    //
    res.render(
        'my-settings-password',
        {
            html_title: htmlTitle,
            user: req.session.user,
            max_width: myMisc.getCurrSiteMaxWidth(req),
            errors: [],
        })
}

//
const post = async (req, res) => {

    //
    if(!req.session.user) {
        return res.send('nope...')
    }

    //
    const errors = []
    let success = null

    if(!req.body.npassword.match(/^.{9,100}$/)) {
        errors.push("your new password must be 9-100 characters")
    }
    else if(req.body.npassword !== req.body.cpassword) {
        errors.push("new password and confirm new password did not match")
    }
    else {
        const {rows:[row]} = await db.getUserWithUserId(req.session.user.user_id)

        if(await argon2.verify(row.password, req.body.epassword)) {
            await db.updateUserPassword(req.session.user.user_id, req.body.npassword)
            success = "password successfully changed"
        }
        else {
            errors.push("existing password is wrong")
        }
    }

    //
    return res.render(
        'my-settings-password',
        {
            html_title: htmlTitle,
            user: req.session.user,
            max_width: myMisc.getCurrSiteMaxWidth(req),
            errors: errors,
            success: success,
        })
}

//
router.get('/', get)
router.post('/', post)
module.exports = router
