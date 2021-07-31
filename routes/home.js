const express = require('express')
const db = require('../db')
const myMisc = require('../misc.js')

const router = express.Router()
const htmlTitleHome = "Peaches 'n' Stink"

//
router.route('/')
    .get(async (req, res) => {
        let finalUserId = req.session.user ? req.session.user.user_id : -1

        //
        let page = 1

        if(typeof req.query.p !== 'undefined') {
            page = parseInt(req.query.p)

            if(isNaN(page)) {
                return res.redirect('/')
            }
        }

        //
        let sort = ''
        const validSortVals = ['oldest', 'comments']
        const isSortVal = (typeof req.query.sort !== 'undefined')
        const isSort = isSortVal && (validSortVals.indexOf(req.query.sort) != -1)

        if(isSort) {
            sort = req.query.sort
        }

        //
        const isDiscoverMode = myMisc.isDiscover(req)
        const filterUserId = await db.getCurrEyesId(req)

        //
        const {rows} = await db.getPosts(
            finalUserId,
            myMisc.getCurrTimeZone(req),
            page,
            isDiscoverMode,
            filterUserId,
            sort)

        res.render(
            'posts2',
            {
                html_title: htmlTitleHome,
                user: req.session.user,
                posts: rows,
                page: page,
                base_url: '/',
                is_discover_mode: isDiscoverMode,
                max_width: myMisc.getCurrSiteMaxWidth(req),
                sort: sort
            })
    })

module.exports = router
