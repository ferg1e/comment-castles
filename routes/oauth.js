const express = require('express')
const db = require('../db')
const myMisc = require('../misc.js')
const config = require('../config')

const router = express.Router()
const htmlTitleHome = "title"

//
router.route('/authorize')
    .get(async (req, res) => {
        res.send('authorize')        
    })

module.exports = router
