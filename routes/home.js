const express = require('express')
const db = require('../db')
const myMisc = require('../misc.js')
const config = require('../config')

const router = express.Router()
const htmlTitleHome = config.siteName

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
        const sort = myMisc.getPostSort(req)

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
            sort,
            myMisc.getCurrPostsPerPage(req))

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
                post_layout: myMisc.getCurrPostLayout(req),
                sort: sort,
                posts_vertical_spacing: myMisc.getCurrPostsVerticalSpacing(req),
            })
    })

module.exports = router
