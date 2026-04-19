const {checkSub} = require('../middleware/check-sub.js')
const express = require('express')

//
const get = async (req, res) => {

    //
    const subSlug = res.locals.subSlug
    const sub = res.locals.sub

    //
    return res.render('castle-about', {
        html_title: `About ${subSlug}`,
        user: req.session.user,
        desc: sub.sub_desc,
        lead_mod_user_id: sub.lead_mod,
        lead_mod_public_id: sub.lead_mod_public_id,
        lead_mod_username: sub.lead_mod_username,
        curr_castle: subSlug,
        main_class: 'main-text'
    })
}

//
const router = express.Router({mergeParams: true})
router.get('/', checkSub, get)
module.exports = router
