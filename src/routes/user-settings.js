const express = require('express')
const db = require('../db')
const userSettings = require('../util/user-settings.js')
const config = require('../config')

const htmlTitle = 'Settings'

//
const get = async (req, res) => {

    //
    return res.render('my-settings', {
        html_title: htmlTitle,
        errors: [],
        user: req.session.user,
        time_zones: config.timeZones,
        date_formats: config.dateFormats,
        time_zone: userSettings.getCurrTimeZone(req),
        postLayout: userSettings.getCurrPostLayout(req),
        postsPerPage: userSettings.getCurrPostsPerPage(req),
        postsVerticalSpacing: userSettings.getCurrPostsVerticalSpacing(req),
        theme: userSettings.getCurrTheme(req),
        commentReplyMode: userSettings.getCurrCommentReplyMode(req),
        siteWidth: userSettings.getCurrSiteMaxWidth(req),
        dateFormat: userSettings.getCurrDateFormat(req)
    })
}

//
const post = async (req, res) => {

    //
    if(req.body.defaults === '1') {
        await userSettings.updateSettings(
            req,
            res,
            config.defaultTimeZone,
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
        errors.push('unknown time zone, pick again')
    }

    //
    const siteWidthInt = parseInt(req.body.site_width)
    const wisNaN = isNaN(siteWidthInt)
    const widthOkay = (req.body.site_width === '') ||
        (!wisNaN && siteWidthInt >= config.minSiteWidth && siteWidthInt <= config.maxSiteWidth)

    if(!widthOkay) {
        errors.push(`site width must be between ${config.minSiteWidth}-${config.maxSiteWidth}, or left blank`)
    }

    //
    const postsPerPageInt = parseInt(req.body.posts_per_page)
    const pppIsNaN = isNaN(postsPerPageInt)
    const pppOkay = !pppIsNaN &&
        postsPerPageInt >= config.minPostsPerPage &&
        postsPerPageInt <= config.maxPostsPerPage

    if(!pppOkay) {
        errors.push(`posts per page must be between ${config.minPostsPerPage}-${config.maxPostsPerPage}`)
    }

    //
    const postsVerticalSpacingInt = parseInt(req.body.posts_vertical_spacing)
    const pvsIsNaN = isNaN(postsVerticalSpacingInt)
    const pvsOkay = !pvsIsNaN &&
        postsVerticalSpacingInt >= config.minPostsVerticalSpacing &&
        postsVerticalSpacingInt <= config.maxPostsVerticalSpacing

    if(!pvsOkay) {
        errors.push(`posts vertical spacing must be between ${config.minPostsVerticalSpacing}-${config.maxPostsVerticalSpacing}`)
    }

    //
    if(errors.length) {
        return res.render('my-settings', {
            html_title: htmlTitle,
            errors: errors,
            user: req.session.user,
            time_zones: config.timeZones,
            date_formats: config.dateFormats,
            time_zone: req.body.time_zone,
            postLayout: req.body.post_layout,
            postsPerPage: req.body.posts_per_page,
            postsVerticalSpacing: req.body.posts_vertical_spacing,
            theme: req.body.theme,
            commentReplyMode: req.body.comment_reply_mode,
            siteWidth: req.body.site_width,
            dateFormat: req.body.date_format
        })
    }

    //
    await userSettings.updateSettings(
        req,
        res,
        req.body.time_zone,
        req.body.comment_reply_mode,
        req.body.site_width,
        req.body.post_layout,
        postsPerPageInt,
        postsVerticalSpacingInt,
        req.body.theme,
        req.body.date_format,
    )

    //
    userSettings.setTheme(req.body.theme, res)

    //
    const siteWidthNulled = req.body.site_width === ''
        ? null
        : siteWidthInt

    //
    res.locals.max_width = siteWidthNulled

    //
    return res.render('my-settings', {
        html_title: htmlTitle,
        errors: [],
        success: 'Settings successfully saved.',
        user: req.session.user,
        time_zones: config.timeZones,
        date_formats: config.dateFormats,
        time_zone: req.body.time_zone,
        postLayout: req.body.post_layout,
        postsPerPage: req.body.posts_per_page,
        postsVerticalSpacing: req.body.posts_vertical_spacing,
        theme: req.body.theme,
        commentReplyMode: req.body.comment_reply_mode,
        siteWidth: req.body.site_width,
        dateFormat: req.body.date_format
    })
}

//
const router = express.Router()
router.get('/', get)
router.post('/', post)
module.exports = router
