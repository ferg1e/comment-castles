const express = require('express')
const db = require('../db')
const myMisc = require('../util/misc.js')
const {isUser} = require('../middleware/is-user')
const {validateDm} = require('../util/validate')

//
const get = async (req, res) => {

    //
    const userPublicId = req.params[0]
    const {rows:[dbUser]} = await db.getUserWithPublicId(userPublicId)

    //
    if(!dbUser) {
        return res.send('invalid id')
    }

    //
    await db.deleteDmCount(dbUser.user_id, req.session.user.user_id)

    /*
    We need to recompute the unread DMs total here because of
    the above deletion. This total is initially computed on every
    page load in sharedAllHandler(). So maybe we can have that initial
    computation not run if it's this page ... so that this db call
    doesn't have to run twice on this page. For now I'm just going
    to have it run twice on this page.
    */
    const {rows:[rowTotal]} = await db.getUserDmCountTotal(req.session.user.user_id)
    req.app.locals.dmTotal = rowTotal.total

    //
    const {rows:dms} = await db.getPairDms(
        req.session.user.user_id,
        dbUser.user_id,
        myMisc.getCurrTimeZone(req),
        myMisc.getCurrDateFormat(req))

    //
    return res.render('dms-pair', {
        html_title: `DMs (${dbUser.username})`,
        user: req.session.user,
        dms: dms,
        pair_username: dbUser.username,
    })
}

//
const post = async(req, res) => {

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
    const [compressedMessage, messageErrors] = validateDm(req.body.message)
    errors = errors.concat(messageErrors)

    //
    if(errors.length > 0) {

        //
        const {rows:dms} = await db.getPairDms(
            req.session.user.user_id,
            dbUser.user_id,
            myMisc.getCurrTimeZone(req),
            myMisc.getCurrDateFormat(req))

        //
        return res.render('dms-pair', {
            html_title: `DMs (${dbUser.username})`,
            user: req.session.user,
            dms: dms,
            pair_username: dbUser.username,
            errors: errors,
            message: req.body.message
        })
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
const router = express.Router({mergeParams: true})
router.get('/', isUser, get)
router.post('/', isUser, post)
module.exports = router
