
//
const express = require('express')
const db = require('../db')
const myMisc = require('../util/misc.js')

const router = express.Router({mergeParams: true})
const htmlTitle = 'Direct Messages'

//
const get = async (req, res) => {

    //
    if(!req.session.user) {
        return myMisc.renderMessage(req, res, htmlTitle,
            "<a href=\"/login\">Log in</a> to view your direct messages.")
    }

    //
    const userPublicId = req.params[0]
    const {rows:[dbUser]} = await db.getUserWithPublicId(userPublicId)

    //
    if(!dbUser) {
        return res.send('invalid id')
    }

    //
    const {rows:dms} = await db.getPairDms(req.session.user.user_id, dbUser.user_id)

    //
    return res.render(
        'dms-pair',
        {
            html_title: `DMs (${dbUser.username})`,
            user: req.session.user,
            max_width: myMisc.getCurrSiteMaxWidth(req),
            dms: dms,
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
    const userPublicId = req.params[0]
    const {rows:[dbUser]} = await db.getUserWithPublicId(userPublicId)

    //
    if(!dbUser) {
        return res.send('invalid id')
    }

    //
    let errors = []

    //
    const [compressedMessage, messageErrors] = myMisc.processDm(req.body.message)
    errors = errors.concat(messageErrors)

    //
    if(errors.length > 0) {

        //
        const {rows:dms} = await db.getPairDms(req.session.user.user_id, dbUser.user_id)

        //
        return res.render(
            'dms-pair',
            {
                html_title: `DMs (${dbUser.username})`,
                user: req.session.user,
                max_width: myMisc.getCurrSiteMaxWidth(req),
                dms: dms,
                errors: errors,
                message: req.body.message
            }
        )
    }

    //
    await db.createDm(
        req.session.user.user_id,
        dbUser.user_id,
        compressedMessage)

    //
    return res.redirect(`/dms/${userPublicId}`)
}

//
router.get('/', get)
router.post('/', post)
module.exports = router
