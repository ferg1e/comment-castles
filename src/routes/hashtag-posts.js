const express = require('express')
const db = require('../db')
const myMisc = require('../util/misc.js')

const router = express.Router({mergeParams: true})

router.get(
    '/',
    async (req, res) => {
        const hashtag = req.params[0]

        //
        let page = 1

        if(typeof req.query.p !== 'undefined') {
            page = parseInt(req.query.p)

            if(isNaN(page)) {
                return res.redirect(`/t/${hashtag}`)
            }
        }

        //
        const sort = myMisc.getPostSort(req)

        //
        const {rows} = await db.getHashtagPosts(
            myMisc.getCurrTimeZone(req),
            page,
            hashtag,
            sort,
            myMisc.getCurrPostsPerPage(req),
            myMisc.getCurrDateFormat(req))

        res.render(
            'posts2',
            {
                html_title: `#${hashtag}`,
                page_title: `#${hashtag}`,
                user: req.session.user,
                posts: rows,
                page: page,
                base_url: `/t/${hashtag}`,
                max_width: myMisc.getCurrSiteMaxWidth(req),
                post_layout: myMisc.getCurrPostLayout(req),
                sort: sort,
                posts_vertical_spacing: myMisc.getCurrPostsVerticalSpacing(req),
            })
    }
)

module.exports = router
