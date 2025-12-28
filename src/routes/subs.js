const express = require('express')
const db = require('../db')
const myMisc = require('../util/misc.js')
const config = require('../config')

const router = express.Router()
const htmlTitle = 'Subs List'

//
const get = async (req, res) => {

    //
    let page = 1

    if(typeof req.query.p !== 'undefined') {
        page = parseInt(req.query.p)

        if(isNaN(page)) {
            return res.redirect('/subs')
        }
    }

    return myMisc.renderMessage(req, res, htmlTitle, 'subs list goes here')
}

//
router.get('/', get)
module.exports = router
