const express = require('express')
const config = require('../config')

//
const get = (req, res) => {
    return res.render('contact-us', {
        html_title: 'Contact Us',
        user: req.session.user,
        contact_email: config.contactEmail,
        main_class: 'main-text'
    })
}

//
const router = express.Router()
router.get('/', get)
module.exports = router
