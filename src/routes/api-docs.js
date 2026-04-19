const express = require('express')

//
const get = (req, res) => {
    return res.render('api', {
        html_title: 'API',
        user: req.session.user,
        main_class: 'main-text'
    })
}

//
const router = express.Router()
router.get('/', get)
module.exports = router
