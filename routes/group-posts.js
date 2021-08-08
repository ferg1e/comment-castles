const express = require('express')
const db = require('../db')
const myMisc = require('../misc.js')

const router = express.Router({mergeParams: true})

router.get(
    '/',
    async (req, res) => {
        const tag = req.params[0]
        let finalUserId = req.session.user ? req.session.user.user_id : -1

        //
        let page = 1

        if(typeof req.query.p !== 'undefined') {
            page = parseInt(req.query.p)

            if(isNaN(page)) {
                return res.redirect(`/r/${tag}`)
            }
        }

        //
        let sort = ''
        const validSortVals = ['oldest', 'comments', 'last']
        const isSortVal = (typeof req.query.sort !== 'undefined')
        const isSort = isSortVal && (validSortVals.indexOf(req.query.sort) != -1)

        if(isSort) {
            sort = req.query.sort
        }

        //
        const isDiscoverMode = myMisc.isDiscover(req)
        const filterUserId = await db.getCurrEyesId(req)

        //
        const {rows} = await db.getTagPosts(
            finalUserId,
            myMisc.getCurrTimeZone(req),
            page,
            tag,
            isDiscoverMode,
            filterUserId,
            sort)

        res.render(
            'posts2',
            {
                html_title: tag,
                user: req.session.user,
                posts: rows,
                page: page,
                base_url: `/r/${tag}`,
                is_discover_mode: isDiscoverMode,
                max_width: myMisc.getCurrSiteMaxWidth(req),
                page_tag: tag
            })
    }
)

module.exports = router
