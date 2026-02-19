const express = require('express')

//
const get = (req, res) => {
    req.session.destroy()
    return res.redirect('/')
}

//
const router = express.Router()
router.get('/', get)
module.exports = router
