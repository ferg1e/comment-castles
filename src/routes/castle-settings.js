const {checkSub} = require('../middleware/check-sub.js')
const express = require('express')
const db = require('../db')
const myMisc = require('../util/misc.js')

const router = express.Router({mergeParams: true})

//
const get = async (req, res) => {

    //
    if(!req.session.user) {
        return res.send('nope')
    }

    //
    const subSlug = res.locals.subSlug
    const sub = res.locals.sub

    //
    if(req.session.user.user_id != sub.lead_mod) {
        return res.send('wrong user')
    }

    //
    return res.render('castle-settings', {
        html_title: `${subSlug} Settings`,
        user: req.session.user,
        errors: [],
        desc: sub.sub_desc,
        lead_mod_user_id: sub.lead_mod,
        curr_castle: subSlug,
        max_width: myMisc.getCurrSiteMaxWidth(req)
    })
}

//
const post = async(req, res) => {

    //
    if(!req.session.user) {
        return res.send('nope')
    }

    //
    const subSlug = res.locals.subSlug
    const sub = res.locals.sub

    //
    if(req.session.user.user_id != sub.lead_mod) {
        return res.send('wrong user')
    }

    //
    db.updateSub(sub.sub_id, req.body.desc)

    //
    return res.render('castle-settings', {
        html_title: `${subSlug} Settings`,
        user: req.session.user,
        success: 'Settings successfully saved.',
        errors: [],
        desc: req.body.desc,
        lead_mod_user_id: sub.lead_mod,
        curr_castle: subSlug,
        max_width: myMisc.getCurrSiteMaxWidth(req)
    })
}

//
router.get('/', checkSub, get)
router.post('/', checkSub, post)
module.exports = router
