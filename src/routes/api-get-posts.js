const express = require('express')
const db = require('../db')
const myMisc = require('../util/misc.js')
const config = require('../config')
const OAuth2Server = require('oauth2-server')
const Request = require('oauth2-server').Request
const Response = require('oauth2-server').Response

//
const router = express.Router()

//
const oauth = new OAuth2Server({
    model: require('../oauth-model.js')
})

//
router.get(
    '/',
    async (req, res) => {

        //
        let page

        try {
            page = myMisc.getPageNum(req)
        }
        catch(e) {
            return res.status(400).json({
                errors: ['invalid page (p) value'],
            })
        }

        //
        const postsPerPage = config.defaultPostsPerPage
        const {rows:[{count:postsCount}]} = await db.getPostsCount()
        const numPages = Math.ceil(postsCount/postsPerPage)

        //
        if(numPages > 0 && page > numPages) {
            return res.status(404).json({
                errors: ['page (p) value higher than number of pages'],
            })
        }

        //
        const oauthData = await oauthAuthenticate(req, res)

        //
        const sort = myMisc.getPostSort(req)
        const timeZone = oauthData ? oauthData.user.time_zone : config.defaultTimeZone

        const {rows} = await db.getPosts(
            timeZone,
            page,
            sort,
            postsPerPage,
            config.defaultDateFormat)

        //
        const rows2 = []

        for(const i in rows) {
            const v = rows[i]

            rows2.push({
                post_id: v.public_id,
                title: v.title,
                link: v.link,
                post_time: v.created_on_raw,
                author_username: v.username,
                author_user_id: v.user_public_id,
                num_comments: v.num_comments,
                sub: v.castle
            })
        }

        return res.json(rows2)
    }
)

//
module.exports = router

//
async function oauthAuthenticate(req, res) {
    const request = new Request(req)
    const response = new Response(res)
    const options = {}
    let oauthData = null

    try {
        oauthData = await oauth.authenticate(request, response, options)
    }
    catch(e) {
        // basically no access token in header
        // or wrong access token in header
        // either way, do nothing and proceed
        // with API call render
    }

    return oauthData
}
