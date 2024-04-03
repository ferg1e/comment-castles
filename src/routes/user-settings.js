const express = require('express')
const db = require('../db')
const myMisc = require('../util/misc.js')
const config = require('../config')

const router = express.Router()
const htmlTitleSettings = 'Settings'
const cookieMaxAge = 1000*60*60*24*365*10;

//
const get = async (req, res) => {

    //
    const isViewMode = typeof req.query.viewmode !== 'undefined'

    if(isViewMode) {
        const viewMode = req.query.viewmode == 'discover'
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

    return res.render(
        'my-settings',
        {
            html_title: htmlTitleSettings,
            errors: [],
            user: req.session.user,
            time_zones: rows,
            defaultDateFormat: config.defaultDateFormat,
            dateFormat1: config.dateFormat1,
            time_zone: myMisc.getCurrTimeZone(req),
            postMode: myMisc.getCurrPostMode(req),
            postLayout: myMisc.getCurrPostLayout(req),
            postsPerPage: myMisc.getCurrPostsPerPage(req),
            postsVerticalSpacing: myMisc.getCurrPostsVerticalSpacing(req),
            theme: myMisc.getCurrTheme(req),
            commentReplyMode: myMisc.getCurrCommentReplyMode(req),
            siteWidth: myMisc.getCurrSiteMaxWidth(req),
            dateFormat: myMisc.getCurrDateFormat(req),
            max_width: myMisc.getCurrSiteMaxWidth(req)
        })
}

//
const post = async (req, res) => {

    //
    if(req.body.defaults === '1') {
        await updateSettings(
            req,
            res,
            config.defaultTimeZone,
            config.defaultViewMode,
            config.defaultCommentReplyMode,
            config.defaultSiteWidth,
            config.defaultPostLayout,
            config.defaultPostsPerPage,
            config.defaultPostsVerticalSpacing,
            config.defaultTheme,
            config.defaultDateFormat,
        )

        return res.redirect('/settings')
    }

    //
    const {rows} = await db.getTimeZoneWithName(req.body.time_zone)

    //
    const errors = []

    if(!rows.length) {
        errors.push({msg: 'unknown time zone, pick again'})
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
    const postsVerticalSpacingInt = parseInt(req.body.posts_vertical_spacing)
    const pvsIsNaN = isNaN(postsVerticalSpacingInt)
    const pvsOkay = !pvsIsNaN &&
        postsVerticalSpacingInt >= config.minPostsVerticalSpacing &&
        postsVerticalSpacingInt <= config.maxPostsVerticalSpacing

    if(!pvsOkay) {
        errors.push({msg: `posts vertical spacing must be between ${config.minPostsVerticalSpacing}-${config.maxPostsVerticalSpacing}`})
    }

    //
    const rows2 = config.timeZones

    //
    if(errors.length) {
        return res.render(
            'my-settings',
            {
                html_title: htmlTitleSettings,
                errors: errors,
                user: req.session.user,
                time_zones: rows2,
                defaultDateFormat: config.defaultDateFormat,
                dateFormat1: config.dateFormat1,
                time_zone: req.body.time_zone,
                postMode: req.body.post_mode,
                postLayout: req.body.post_layout,
                postsPerPage: req.body.posts_per_page,
                postsVerticalSpacing: req.body.posts_vertical_spacing,
                theme: req.body.theme,
                commentReplyMode: req.body.comment_reply_mode,
                siteWidth: req.body.site_width,
                dateFormat: req.body.date_format,
                max_width: myMisc.getCurrSiteMaxWidth(req)
            })
    }

    //
    await updateSettings(
        req,
        res,
        req.body.time_zone,
        req.body.post_mode,
        req.body.comment_reply_mode,
        req.body.site_width,
        req.body.post_layout,
        postsPerPageInt,
        postsVerticalSpacingInt,
        req.body.theme,
        req.body.date_format,
    )

    //
    myMisc.setTheme(req.body.theme, req)

    //
    const siteWidthNulled = req.body.site_width === ''
        ? null
        : siteWidthInt

    //
    return res.render(
        'my-settings',
        {
            html_title: htmlTitleSettings,
            errors: [],
            success: 'Settings successfully saved.',
            user: req.session.user,
            time_zones: rows2,
            defaultDateFormat: config.defaultDateFormat,
            dateFormat1: config.dateFormat1,
            time_zone: req.body.time_zone,
            postMode: req.body.post_mode,
            postLayout: req.body.post_layout,
            postsPerPage: req.body.posts_per_page,
            postsVerticalSpacing: req.body.posts_vertical_spacing,
            theme: req.body.theme,
            commentReplyMode: req.body.comment_reply_mode,
            siteWidth: req.body.site_width,
            dateFormat: req.body.date_format,
            max_width: siteWidthNulled
        })
}

//
router.get('/', get)
router.post('/', post)
module.exports = router

//
async function updateSettings(
    req,
    res,
    timeZone,
    viewMode,
    commentReplyMode,
    siteWidth,
    postLayout,
    postsPerPage,
    postsVerticalSpacing,
    theme,
    dateFormat
) {

    //
    const siteWidthEmptied = siteWidth === ''
        ? ''
        : parseInt(siteWidth)

    //
    const siteWidthNulled = siteWidth === ''
        ? null
        : parseInt(siteWidth)

    //
    if(req.session.user) {
        await db.updateUser(
            req.session.user.user_id,
            timeZone,
            viewMode,
            commentReplyMode,
            siteWidthNulled,
            postLayout,
            postsPerPage,
            postsVerticalSpacing,
            theme,
            dateFormat)

        req.session.user.time_zone = timeZone
        req.session.user.post_mode = viewMode
        req.session.user.post_layout = postLayout
        req.session.user.posts_per_page = postsPerPage
        req.session.user.posts_vertical_spacing = postsVerticalSpacing
        req.session.user.theme = theme
        req.session.user.comment_reply_mode = commentReplyMode
        req.session.user.date_format = dateFormat
        req.session.user.site_width = siteWidthNulled
    }
    else {

        const cSettings = myMisc.getCookieSettings(req)

        cSettings.time_zone = timeZone
        cSettings.post_mode = viewMode
        cSettings.post_layout = postLayout
        cSettings.posts_per_page = postsPerPage
        cSettings.posts_vertical_spacing = postsVerticalSpacing
        cSettings.theme = theme
        cSettings.site_width = siteWidthEmptied
        cSettings.date_format = dateFormat

        res.cookie(
            'settings',
            JSON.stringify(cSettings),
            {maxAge: cookieMaxAge})
    }
}
