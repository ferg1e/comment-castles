
//
const express = require('express')
const db = require('../db')
const myMisc = require('../util/misc.js')

const router = express.Router()
const htmlTitle = 'Direct Messages'

//
const get = async (req, res) => {

    //
    if(!req.session.user) {
        return myMisc.renderMessage(req, res, htmlTitle,
            "<a href=\"/login\">Log in</a> to view your direct messages.",
            "main-text")
    }

    //
    const {rows:dmedUsers} = await db.getDmedUsers(
        req.session.user.user_id,
        myMisc.getCurrTimeZone(req),
        myMisc.getCurrDateFormat(req))

    //
    return res.render(
        'dms',
        {
            html_title: htmlTitle,
            user: req.session.user,
            max_width: myMisc.getCurrSiteMaxWidth(req),
            dmed_users: dmedUsers,
            main_class: 'main-text'
        }
    )
}

//
const post = async(req, res) => {

    //
    if(!req.session.user) {
        return res.send('blocked')
    }

    //
    let errors = []

    //
    if(req.body.to === '') {
        errors.push('Please fill in a to username')
    }
    else {
        var {rows:[toUser]} = await db.getUserWithUsername(req.body.to)

        if(!toUser) {
            errors.push('No user with that username')
        }
    }

    //
    const [compressedMessage, messageErrors] = myMisc.processDm(req.body.message)
    errors = errors.concat(messageErrors)

    //
    if(errors.length > 0) {

        //
        const {rows:dmedUsers} = await db.getDmedUsers(
            req.session.user.user_id,
            myMisc.getCurrTimeZone(req),
            myMisc.getCurrDateFormat(req))

        //
        return res.render(
            'dms',
            {
                html_title: htmlTitle,
                user: req.session.user,
                max_width: myMisc.getCurrSiteMaxWidth(req),
                dmed_users: dmedUsers,
                errors: errors,
                message: req.body.message,
                to: req.body.to,
                main_class: 'main-text'
            }
        )
    }

    //
    await db.createDm(
        req.session.user.user_id,
        toUser.user_id,
        compressedMessage)

    //
    return res.redirect(`/dms/${toUser.public_id}`)
}

//
router.get('/', get)
router.post('/', post)
module.exports = router
