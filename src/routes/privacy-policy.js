const express = require('express')
const myMisc = require('../util/misc.js')

//
const get = (req, res) => {
    return res.render('privacy-policy', {
        html_title: 'Privacy Policy',
        user: req.session.user,
        max_width: myMisc.getCurrSiteMaxWidth(req),
        main_class: 'main-text'
    })
}

//
const router = express.Router()
router.get('/', get)
module.exports = router
