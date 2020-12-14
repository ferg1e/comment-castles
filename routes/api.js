const express = require('express')
const db = require('../db')

//
const router = express.Router()

router.get(
    '/posts',
    async (req, res) => {

        //
        let page = 1

        if(typeof req.query.p !== 'undefined') {
            page = parseInt(req.query.p)

            if(isNaN(page)) {
                page = 1
            }
        }

        //
        let isDiscoverMode = false

        if(typeof req.query.viewmode !== 'undefined' &&
            req.query.viewmode.toLowerCase() == 'discover')
        {
            isDiscoverMode = true
        }

        const userId = -1
        const filterUserId = 1

        const {rows} = await db.getPosts(
            userId,
            'UTC', //TODO: dry this up
            page,
            isDiscoverMode,
            filterUserId)

        //
        let rows2 = []

        for(const i in rows) {
            let v = rows[i]

            rows2.push({
                post_id: v.public_id,
                title: v.is_visible ? v.title : false,
                link: v.is_visible ? v.link : false,
                post_time: v.created_on_raw,
                by: v.username,
                num_comments: v.num_comments,
                tags: v.tags
            })
        }

        res.json(rows2)
    }
)

//
module.exports = router
