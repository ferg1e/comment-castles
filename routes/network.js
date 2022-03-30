const express = require('express')
const db = require('../db')
const myMisc = require('../misc.js')

const router = express.Router()

router.route('/')
    .get(async (req, res) => {

        const {rows} = await db.getAllNetworkNodes(myMisc.getCurrTimeZone(req))

        res.render('network', {
            html_title: 'Network',
            user: req.session.user,
            max_width: myMisc.getCurrSiteMaxWidth(req),
            nodes: rows
        })
    })

module.exports = router
