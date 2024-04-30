const express = require('express')
const db = require('../db')
const myMisc = require('../util/misc.js')
const config = require('../config')

const router = express.Router({mergeParams: true})

router.get(
    '/',
    async (req, res) => {
        const castle = req.params[0]

        //
        const {rows:[sub]} = await db.getSub(castle)

        //
        if(!sub) {
            return myMisc.renderMessage(req, res, castle,
                `The ${castle} castle does not exist yet. ` +
                `You can start this castle by <a href="/new?castle=${castle}">posting</a> to it.`)
        }

        //
        let page = 1

        if(typeof req.query.p !== 'undefined') {
            page = parseInt(req.query.p)

            if(isNaN(page)) {
                return res.redirect(`/r/${castle}`)
            }
        }

        //
        const sort = myMisc.getPostSort(req)

        //
        const {rows} = await db.getTagPosts(
            myMisc.getCurrTimeZone(req),
            page,
            castle,
            sort,
            myMisc.getCurrPostsPerPage(req),
            myMisc.getCurrDateFormat(req))

        res.render(
            'posts2',
            {
                html_title: castle,
                user: req.session.user,
                posts: rows,
                page: page,
                base_url: `/r/${castle}`,
                max_width: myMisc.getCurrSiteMaxWidth(req),
                post_layout: myMisc.getCurrPostLayout(req),
                curr_castle: castle,
                sort: sort,
                posts_vertical_spacing: myMisc.getCurrPostsVerticalSpacing(req),
            })
    }
)

module.exports = router
