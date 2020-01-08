const express = require('express')

const router = express.Router()

router.get(
    '/',
    function(req, res) {
        res.render(
            'index',
            {title:'Express'})
    })

router.get(
    '/sign-up',
    (req, res) => {
        res.render(
            'sign-up',
            {title:"Sign Up Form"})
    }
)

module.exports = router
