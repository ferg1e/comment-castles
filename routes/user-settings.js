const express = require('express')
const db = require('../db')
const myMisc = require('../misc.js')
const config = require('../config')

const router = express.Router()
const htmlTitleSettings = 'Settings'
const cookieMaxAge = 1000*60*60*24*365*10;

router.route('/')
    .get(async (req, res) => {

        //
        const isViewMode = typeof req.query.viewmode !== 'undefined'

        if(isViewMode) {
            let viewMode = req.query.viewmode == 'discover'
                ? req.query.viewmode
                : 'following-only'

            //
            if(req.session.user) {
                await db.updateUserViewMode(
                    req.session.user.user_id,
                    viewMode)

                req.session.user.post_mode = viewMode
            }
            else {
                const cSettings = myMisc.getCookieSettings(req)
                cSettings.post_mode = viewMode

                res.cookie(
                    'settings',
                    JSON.stringify(cSettings),
                    {maxAge: cookieMaxAge})
            }

            //
            const redirectUrl = (typeof req.query.goto === 'undefined')
                ? '/settings'
                : req.query.goto;

            return res.redirect(redirectUrl)
        }

        //
        const rows = config.timeZones
        const {rows:avaEyes} = await db.getAvailableEyes()
        const currEyes = await getCurrEyes(req)

        res.render(
            'my-settings',
            {
                html_title: htmlTitleSettings,
                errors: [],
                user: req.session.user,
                time_zones: rows,
                time_zone: myMisc.getCurrTimeZone(req),
                avaEyes: avaEyes,
                currEyes: currEyes,
                postMode: myMisc.getCurrPostMode(req),
                postLayout: myMisc.getCurrPostLayout(req),
                postsPerPage: myMisc.getCurrPostsPerPage(req),
                commentReplyMode: myMisc.getCurrCommentReplyMode(req),
                siteWidth: myMisc.getCurrSiteMaxWidth(req),
                max_width: myMisc.getCurrSiteMaxWidth(req)
            })
    })
    .post(async (req, res) => {
        
        //
        const {rows} = await db.getTimeZoneWithName(req.body.time_zone)

        //
        let eyesOkay = true
        let eyesValue = null

        //
        if(req.body.eyes !== "") {
            const {rows:eyesLookup} = await db.getUserWithUsername(req.body.eyes)

            if(eyesLookup.length && eyesLookup[0].is_eyes) {
                eyesValue = eyesLookup[0].user_id
            }
            else {
                eyesOkay = false
            }
        }

        //
        let errors = []

        if(!rows.length) {
            errors.push({msg: 'unknown time zone, pick again'})
        }

        if(!eyesOkay) {
            errors.push({msg: 'bad following list'})
        }

        //
        const siteWidthInt = parseInt(req.body.site_width)
        const wisNaN = isNaN(siteWidthInt)
        const widthOkay = (req.body.site_width === '') ||
            (!wisNaN && siteWidthInt >= config.minSiteWidth && siteWidthInt <= config.maxSiteWidth)

        if(!widthOkay) {
            errors.push({msg: `site width must be between ${config.minSiteWidth}-${config.maxSiteWidth}, or left blank`})
        }

        //
        const postsPerPageInt = parseInt(req.body.posts_per_page)
        const pppIsNaN = isNaN(postsPerPageInt)
        const pppOkay = !pppIsNaN &&
            postsPerPageInt >= config.minPostsPerPage &&
            postsPerPageInt <= config.maxPostsPerPage

        if(!pppOkay) {
            errors.push({msg: `posts per page must be between ${config.minPostsPerPage}-${config.maxPostsPerPage}`})
        }

        //
        const rows2 = config.timeZones
        const {rows:avaEyes} = await db.getAvailableEyes()
        const currEyes = req.body.eyes

        //
        if(errors.length) {
            res.render(
                'my-settings',
                {
                    html_title: htmlTitleSettings,
                    errors: errors,
                    user: req.session.user,
                    time_zones: rows2,
                    time_zone: req.body.time_zone,
                    avaEyes: avaEyes,
                    currEyes: currEyes,
                    postMode: req.body.post_mode,
                    postLayout: req.body.post_layout,
                    postsPerPage: req.body.posts_per_page,
                    commentReplyMode: req.body.comment_reply_mode,
                    siteWidth: req.body.site_width,
                    max_width: myMisc.getCurrSiteMaxWidth(req)
                })
        }
        else {

            //
            const siteWidthEmptied = req.body.site_width === ''
                ? ''
                : siteWidthInt

            //
            const siteWidthNulled = req.body.site_width === ''
                ? null
                : siteWidthInt

            //
            if(req.session.user) {
                await db.updateUser(
                    req.session.user.user_id,
                    req.body.time_zone,
                    req.body.post_mode,
                    req.body.comment_reply_mode,
                    siteWidthNulled,
                    eyesValue,
                    req.body.post_layout,
                    postsPerPageInt)

                req.session.user.time_zone = req.body.time_zone
                req.session.user.post_mode = req.body.post_mode
                req.session.user.post_layout = req.body.post_layout
                req.session.user.posts_per_page = postsPerPageInt
                req.session.user.comment_reply_mode = req.body.comment_reply_mode
                req.session.user.site_width = siteWidthNulled
                req.session.user.eyes = eyesValue
            }
            else {

                //
                const settings = {
                    time_zone: req.body.time_zone,
                    eyes: req.body.eyes,
                    post_mode: req.body.post_mode,
                    post_layout: req.body.post_layout,
                    posts_per_page: postsPerPageInt,
                    site_width: siteWidthEmptied,
                }

                res.cookie(
                    'settings',
                    JSON.stringify(settings),
                    {maxAge: cookieMaxAge})
            }

            res.render(
                'my-settings',
                {
                    html_title: htmlTitleSettings,
                    errors: [],
                    success: 'Settings successfully saved.',
                    user: req.session.user,
                    time_zones: rows2,
                    time_zone: req.body.time_zone,
                    avaEyes: avaEyes,
                    currEyes: currEyes,
                    postMode: req.body.post_mode,
                    postLayout: req.body.post_layout,
                    postsPerPage: req.body.posts_per_page,
                    commentReplyMode: req.body.comment_reply_mode,
                    siteWidth: req.body.site_width,
                    max_width: siteWidthNulled
                })
        }
    })

module.exports = router

//
async function getCurrEyes(req) {
    let eyes = ''

    if(req.session.user && req.session.user.eyes) {
        const {rows} = await db.getUserWithUserId(req.session.user.eyes)
        eyes = rows[0].username
    }
    else if(!req.session.user) {
        const cSettings = myMisc.getCookieSettings(req)
        eyes = typeof cSettings.eyes !== 'undefined'
            ? cSettings.eyes
            : config.eyesDefaultUsername
    }

    return eyes
}
