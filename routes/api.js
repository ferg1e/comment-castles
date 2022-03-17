const express = require('express')
const db = require('../db')
const myMisc = require('../misc.js')
const pug = require('pug')

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
        const sort = myMisc.getPostSort(req)

        const {rows} = await db.getPosts(
            userId,
            'UTC', //TODO: dry this up
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
                groups: v.tags
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
        const postPublicId = req.query.postid
        const userId = -1
        const filterUserId = 1

        //
        const {rows} = await db.getPostWithPublic2(
            postPublicId,
            'UTC',
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
            let isDiscoverMode = false

            if(typeof req.query.viewmode !== 'undefined' &&
                req.query.viewmode.toLowerCase() == 'discover')
            {
                isDiscoverMode = true
            }

            const{rows:comments} = await db.getPostComments(
                rows[0].post_id,
                'UTC',
                userId,
                isDiscoverMode,
                filterUserId)

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
                groups: rows[0].tags
            }

            res.json(r)
        }
        else {
            res.json(0)
        }
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
        const commentPublicId = req.query.commentid
        const userId = -1
        const filterUserId = 1

        //
        const {rows} = await db.getCommentWithPublic2(
            commentPublicId,
            'UTC',
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
            let isDiscoverMode = false

            if(typeof req.query.viewmode !== 'undefined' &&
                req.query.viewmode.toLowerCase() == 'discover')
            {
                isDiscoverMode = true
            }

            const{rows:comments} = await db.getCommentComments(
                rows[0].path,
                'UTC',
                userId,
                isDiscoverMode,
                filterUserId)

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
router.post(
    '/comment',
    async (req, res) => {
        if(req.session.user) {

            //
            const {rows} = await db.getCommentWithPublic(req.body.commentid)

            //
            if(rows.length) {

                //
                const isAllowed = await db.isAllowedToViewPost(
                    rows[0].private_group_ids,
                    req.session.user.user_id)

                if(!isAllowed) {
                    return res.json(0)
                }

                //
                let [compressedComment, errors] = myMisc.processComment(req.body.text_content)

                if(errors.length) {
                    res.json(0)
                }
                else {

                    //
                    const {rows:data1} = await db.createCommentComment(
                        rows[0].post_id,
                        req.session.user.user_id,
                        compressedComment,
                        rows[0].path,
                        myMisc.getCurrTimeZone(req))

                    //
                    await db.incPostNumComments(rows[0].post_id)

                    //
                    data1[0].by = req.session.user.username

                    //
                    const bbCodesOnly = pug.compileFile('views/bbCodesOnly.pug')
                    data1[0].text_content = bbCodesOnly({text: data1[0].text_content})

                    //
                    res.json(data1[0])
                }
            }
            else {
                res.json(0)
            }
        }
        else {
            res.json(0)
        }
    }
)

router.get(
    '/stats',
    async (req, res) => {
        const stats = await db.getStats()
        res.json(stats)
    }
)

//
module.exports = router
