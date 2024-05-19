
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
            "<a href=\"/login\">Log in</a> to view your direct messages.")
    }

    //
    return res.render(
        'dms',
        {
            html_title: htmlTitle,
            user: req.session.user,
            max_width: myMisc.getCurrSiteMaxWidth(req)
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
        return res.render(
            'dms',
            {
                html_title: htmlTitle,
                user: req.session.user,
                max_width: myMisc.getCurrSiteMaxWidth(req),
                errors: errors,
                message: req.body.message,
                to: req.body.to,
            }
        )
    }

    //
    await db.createDm(
        req.session.user.user_id,
        toUser.user_id,
        compressedMessage)

    //
    return res.send('dm created')
}

//
router.get('/', get)
router.post('/', post)
module.exports = router
