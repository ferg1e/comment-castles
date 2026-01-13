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
        const {rows:[dbHashtag]} = await db.getHashtag(hashtag)
        const sort = myMisc.getPostSort(req)
        let posts = []
        let numPages = 0

        //
        if(dbHashtag) {

            //
            const postsPerPage = 3
            const {rows:[{count:postsCount}]} = await db.getHashtagPostsCount(dbHashtag.hashtag_id)
            numPages = Math.ceil(postsCount/postsPerPage)

            //
            const {rows} = await db.getHashtagPosts(
                myMisc.getCurrTimeZone(req),
                page,
                dbHashtag.hashtag_id,
                sort,
                postsPerPage,
                myMisc.getCurrDateFormat(req))

            posts = rows
        }

        //
        res.render(
            'posts2',
            {
                html_title: `#${hashtag}`,
                page_title: `#${hashtag}`,
                user: req.session.user,
                posts: posts,
                page: page,
                base_url: `/t/${hashtag}`,
                max_width: myMisc.getCurrSiteMaxWidth(req),
                post_layout: myMisc.getCurrPostLayout(req),
                sort: sort,
                posts_vertical_spacing: myMisc.getCurrPostsVerticalSpacing(req),
                num_pages: numPages
            })
    }
)

module.exports = router
