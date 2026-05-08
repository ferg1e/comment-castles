const express = require('express')

//
const get = (req, res) => {
    return res.render('privacy-policy', {
        html_title: 'Privacy Policy',
        main_class: 'main-text'
    })
}

//
const router = express.Router()
router.get('/', get)
module.exports = router
