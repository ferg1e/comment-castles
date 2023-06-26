const express = require('express')
const db = require('../db')
const myMisc = require('../misc.js')
const pug = require('pug')
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
        const oauthData = await oauthAuthenticate(req, res)

        //
        const isDiscoverMode = oauthData
            ? (oauthData.user.post_mode == 'discover')
            : (typeof req.query.viewmode !== 'undefined' && req.query.viewmode.toLowerCase() == 'discover')

        const userId = oauthData ? oauthData.user.user_id : -1
        const filterUserId = oauthData
            ? (oauthData.user.eyes ? oauthData.user.eyes : oauthData.user.user_id)
            : 1

        const sort = myMisc.getPostSort(req)
        const timeZone = oauthData ? oauthData.user.time_zone : 'UTC'

        const {rows} = await db.getPosts(
            userId,
            timeZone,
            page,
            isDiscoverMode,
            filterUserId,
            sort)

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
                groups: v.is_visible ? v.tags : false
            })
        }

        res.json(rows2)
    }
)

router.get(
    '/post',
    async (req, res) => {

        //
        if(typeof req.query.postid === 'undefined') {
            return res.json(0)
        }

        //
        const oauthData = await oauthAuthenticate(req, res)

        //
        const postPublicId = req.query.postid
        const userId = oauthData ? oauthData.user.user_id : -1
        const filterUserId = oauthData
            ? (oauthData.user.eyes ? oauthData.user.eyes : oauthData.user.user_id)
            : 1

        const timeZone = oauthData ? oauthData.user.time_zone : 'UTC'

        //
        const {rows} = await db.getPostWithPublic2(
            postPublicId,
            timeZone,
            userId,
            filterUserId)

        //
        if(rows.length) {

            //
            const isAllowed = await db.isAllowedToViewPost(
                rows[0].private_group_ids,
                userId)

            if(!isAllowed) {
                return res.json(0)
            }

            //
            const isDiscoverMode = oauthData
                ? (oauthData.user.post_mode == 'discover')
                : (typeof req.query.viewmode !== 'undefined' && req.query.viewmode.toLowerCase() == 'discover')

            //
            let page = 1

            if(typeof req.query.p !== 'undefined') {
                page = parseInt(req.query.p)

                if(isNaN(page)) {
                    page = 1
                }
            }

            //
            const{rows:comments} = await db.getPostComments(
                rows[0].post_id,
                timeZone,
                userId,
                isDiscoverMode,
                filterUserId,
                page)

            //
            let comments2 = []

            for(const i in comments) {
                const c = comments[i]
                const dotCount = (c.path.match(/\./g)||[]).length

                comments2.push({
                    comment_text: c.is_visible ? c.text_content : false,
                    indent_level: dotCount - 1,
                    by: c.username,
                    comment_time: c.created_on_raw,
                    comment_id: c.public_id
                })
            }
            
            let r = {
                title: rows[0].is_visible ? rows[0].title : false,
                link: rows[0].is_visible ? rows[0].link : false,
                post_text: rows[0].is_visible ? rows[0].text_content : false,
                post_time: rows[0].created_on_raw,
                by: rows[0].username,
                comments: comments2,
                groups: rows[0].is_visible ? rows[0].tags : false
            }

            res.json(r)
        }
        else {
            res.json(0)
        }
    }
)

//
router.post(
    '/post',
    async (req, res) => {

        //
        const title = (typeof req.body.title === 'undefined') ? '' : req.body.title
        const text_content = (typeof req.body.text_content === 'undefined') ? '' : req.body.text_content
        const link = (typeof req.body.link === 'undefined') ? '' : req.body.link
        const tags = (typeof req.body.tags === 'undefined') ? '' : req.body.tags

        //
        const oauthData = await oauthAuthenticate(req, res)

        //
        if(!oauthData) {
            return res.json({
                errors: ['no user auth'],
            })
        }

        //
        const [errors, wsCompressedTitle, trimTags] = await db.validateNewPost(
            title,
            link,
            tags,
            oauthData.user.user_id)

        //
        if(errors.length) {
            return res.json({
                errors: errors,
            })
        }

        //
        const publicPostId = await db.createPost(
            oauthData.user.user_id,
            wsCompressedTitle,
            text_content,
            link,
            trimTags)

        //
        return res.json({
            post_id: publicPostId,
        })
    }
)

//
router.get(
    '/comment',
    async (req, res) => {

        //
        if(typeof req.query.commentid === 'undefined') {
            return res.json(0)
        }

        //
        const oauthData = await oauthAuthenticate(req, res)

        //
        const commentPublicId = req.query.commentid
        const userId = oauthData ? oauthData.user.user_id : -1
        const filterUserId = oauthData
            ? (oauthData.user.eyes ? oauthData.user.eyes : oauthData.user.user_id)
            : 1

        const timeZone = oauthData ? oauthData.user.time_zone : 'UTC'

        //
        const {rows} = await db.getCommentWithPublic2(
            commentPublicId,
            timeZone,
            userId,
            filterUserId)

        //
        if(rows.length) {

            //
            const isAllowed = await db.isAllowedToViewPost(
                rows[0].private_group_ids,
                userId)

            if(!isAllowed) {
                return res.json(0)
            }

            //
            const isDiscoverMode = oauthData
                ? (oauthData.user.post_mode == 'discover')
                : (typeof req.query.viewmode !== 'undefined' && req.query.viewmode.toLowerCase() == 'discover')

            //
            let page = 1

            if(typeof req.query.p !== 'undefined') {
                page = parseInt(req.query.p)

                if(isNaN(page)) {
                    page = 1
                }
            }

            //
            const{rows:comments} = await db.getCommentComments(
                rows[0].path,
                timeZone,
                userId,
                isDiscoverMode,
                filterUserId,
                page)

            //
            let comments2 = []
            const rootDotCount = (rows[0].path.match(/\./g)||[]).length

            for(const i in comments) {
                const c = comments[i]
                const dotCount = (c.path.match(/\./g)||[]).length

                comments2.push({
                    comment_text: c.is_visible ? c.text_content : false,
                    indent_level: dotCount - rootDotCount - 1,
                    by: c.username,
                    comment_time: c.created_on_raw,
                    comment_id: c.public_id
                })
            }
            
            let r = {
                comment_text: rows[0].is_visible ? rows[0].text_content : false,
                comment_time: rows[0].created_on_raw,
                by: rows[0].username,
                comments: comments2
            }

            res.json(r)
        }
        else {
            res.json(0)
        }
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
