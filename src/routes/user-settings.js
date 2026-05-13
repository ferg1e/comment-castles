const express = require('express')
const db = require('../db')
const userSettings = require('../util/user-settings.js')
const config = require('../config')
const {validateUserSettings} = require('../validate/validateUserSettings')

//
const htmlTitle = 'Settings'

//
const get = async (req, res) => {

    //
    return res.render('my-settings', {
        html_title: htmlTitle,
        errors: [],
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
    const errors = await validateUserSettings(req)

    //
    if(errors.length) {
        return res.render('my-settings', {
            html_title: htmlTitle,
            errors: errors,
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
        parseInt(req.body.posts_per_page),
        parseInt(req.body.posts_vertical_spacing),
        req.body.theme,
        req.body.date_format,
    )

    //
    userSettings.setTheme(req.body.theme, res)

    //
    const siteWidthNulled = req.body.site_width === ''
        ? null
        : parseInt(req.body.site_width)

    //
    res.locals.max_width = siteWidthNulled

    //
    return res.render('my-settings', {
        html_title: htmlTitle,
        errors: [],
        success: 'Settings successfully saved.',
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
