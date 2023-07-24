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
        const {rows:privateGroup} = await db.getPrivateGroupWithName(tag)

        if(privateGroup.length) {
            const ids = []

            if(req.session.user) {
                const {rows:userPrivateGroups} = await db.getUserAllPrivateGroupIds(req.session.user.user_id)

                for(const i in userPrivateGroups) {
                    ids.push(userPrivateGroups[i].private_group_id)
                }
            }

            const isAllowed = ids.includes(privateGroup[0].private_group_id)

            if(!isAllowed) {
                return res.render(
                    'message',
                    {
                        html_title: tag,
                        message: "This group is private and you do not have access.",
                        user: req.session.user,
                        max_width: myMisc.getCurrSiteMaxWidth(req)
                    })
            }
        }

        //
        const sort = myMisc.getPostSort(req)

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
                post_layout: myMisc.getCurrPostLayout(req),
                page_tag: tag,
                sort: sort
            })
    }
)

module.exports = router
