const express = require('express')
const myMisc = require('../util/misc.js')
const config = require('../config')

//
const get = (req, res) => {
    return res.render('contact-us', {
        html_title: 'Contact Us',
        user: req.session.user,
        max_width: myMisc.getCurrSiteMaxWidth(req),
        contact_email: config.contactEmail,
        main_class: 'main-text'
    })
}

//
const router = express.Router()
router.get('/', get)
module.exports = router
