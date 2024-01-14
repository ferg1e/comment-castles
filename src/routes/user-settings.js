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
            time_zone: myMisc.getCurrTimeZone(req),
            postMode: myMisc.getCurrPostMode(req),
            postLayout: myMisc.getCurrPostLayout(req),
            oneBgColorForm: myMisc.getOneBgColor(req),
            twoBgColorForm: myMisc.getTwoBgColor(req),
            mainTextColorForm: myMisc.getMainTextColor(req),
            postLinkColorForm: myMisc.getPostLinkColor(req),
            postLinkVisitedColorForm: myMisc.getPostLinkVisitedColor(req),
            groupBgColorForm: myMisc.getGroupBgColor(req),
            groupTextColorForm: myMisc.getGroupTextColor(req),
            hiddenColorForm: myMisc.getHiddenColor(req),
            domainNameColorForm: myMisc.getDomainNameColor(req),
            unfollowBgColorForm: myMisc.getUnfollowBgColor(req),
            unfollowLineColorForm: myMisc.getUnfollowLineColor(req),
            unfollowTextColorForm: myMisc.getUnfollowTextColor(req),
            followBgColorForm: myMisc.getFollowBgColor(req),
            followLineColorForm: myMisc.getFollowLineColor(req),
            followTextColorForm: myMisc.getFollowTextColor(req),
            mainLinkColorForm: myMisc.getMainLinkColor(req),
            navLinkColorForm: myMisc.getNavLinkColor(req),
            postsPerPage: myMisc.getCurrPostsPerPage(req),
            postsVerticalSpacing: myMisc.getCurrPostsVerticalSpacing(req),
            commentReplyMode: myMisc.getCurrCommentReplyMode(req),
            siteWidth: myMisc.getCurrSiteMaxWidth(req),
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
            config.defaultOneBgColor,
            config.defaultTwoBgColor,
            config.defaultMainTextColor,
            config.defaultPostLinkColor,
            config.defaultPostLinkVisitedColor,
            config.defaultGroupBgColor,
            config.defaultGroupTextColor,
            config.defaultHiddenColor,
            config.defaultDomainNameColor,
            config.defaultUnfollowBgColor,
            config.defaultUnfollowLineColor,
            config.defaultUnfollowTextColor,
            config.defaultFollowBgColor,
            config.defaultFollowLineColor,
            config.defaultFollowTextColor,
            config.defaultMainLinkColor,
            config.defaultNavLinkColor,
            config.defaultPostsVerticalSpacing,
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

    //remove # char
    const sOneBgColorBite = req.body.one_bg_color.substring(1)
    const sTwoBgColorBite = req.body.two_bg_color.substring(1)
    const sMainTextColorBite = req.body.main_text_color.substring(1)
    const sPostLinkColorBite = req.body.post_link_color.substring(1)
    const sPostLinkVisitedColorBite = req.body.post_link_visited_color.substring(1)
    const sGroupBgColorBite = req.body.group_bg_color.substring(1)
    const sGroupTextColorBite = req.body.group_text_color.substring(1)
    const sHiddenColorBite = req.body.hidden_color.substring(1)
    const sDomainNameColorBite = req.body.domain_name_color.substring(1)
    const sUnfollowBgColorBite = req.body.unfollow_bg_color.substring(1)
    const sUnfollowLineColorBite = req.body.unfollow_line_color.substring(1)
    const sUnfollowTextColorBite = req.body.unfollow_text_color.substring(1)
    const sFollowBgColorBite = req.body.follow_bg_color.substring(1)
    const sFollowLineColorBite = req.body.follow_line_color.substring(1)
    const sFollowTextColorBite = req.body.follow_text_color.substring(1)
    const sMainLinkColorBite = req.body.main_link_color.substring(1)
    const sNavLinkColorBite = req.body.nav_link_color.substring(1)

    //
    if(errors.length) {
        return res.render(
            'my-settings',
            {
                html_title: htmlTitleSettings,
                errors: errors,
                user: req.session.user,
                time_zones: rows2,
                time_zone: req.body.time_zone,
                postMode: req.body.post_mode,
                postLayout: req.body.post_layout,
                oneBgColorForm: sOneBgColorBite,
                twoBgColorForm: sTwoBgColorBite,
                mainTextColorForm: sMainTextColorBite,
                postLinkColorForm: sPostLinkColorBite,
                postLinkVisitedColorForm: sPostLinkVisitedColorBite,
                groupBgColorForm: sGroupBgColorBite,
                groupTextColorForm: sGroupTextColorBite,
                hiddenColorForm: sHiddenColorBite,
                domainNameColorForm: sDomainNameColorBite,
                unfollowBgColorForm: sUnfollowBgColorBite,
                unfollowLineColorForm: sUnfollowLineColorBite,
                unfollowTextColorForm: sUnfollowTextColorBite,
                followBgColorForm: sFollowBgColorBite,
                followLineColorForm: sFollowLineColorBite,
                followTextColorForm: sFollowTextColorBite,
                mainLinkColorForm: sMainLinkColorBite,
                navLinkColorForm: sNavLinkColorBite,
                postsPerPage: req.body.posts_per_page,
                postsVerticalSpacing: req.body.posts_vertical_spacing,
                commentReplyMode: req.body.comment_reply_mode,
                siteWidth: req.body.site_width,
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
        sOneBgColorBite,
        sTwoBgColorBite,
        sMainTextColorBite,
        sPostLinkColorBite,
        sPostLinkVisitedColorBite,
        sGroupBgColorBite,
        sGroupTextColorBite,
        sHiddenColorBite,
        sDomainNameColorBite,
        sUnfollowBgColorBite,
        sUnfollowLineColorBite,
        sUnfollowTextColorBite,
        sFollowBgColorBite,
        sFollowLineColorBite,
        sFollowTextColorBite,
        sMainLinkColorBite,
        sNavLinkColorBite,
        postsVerticalSpacingInt,
    )

    //
    const siteWidthNulled = req.body.site_width === ''
        ? null
        : siteWidthInt

    //
    req.app.locals.oneBgColor = sOneBgColorBite
    req.app.locals.twoBgColor = sTwoBgColorBite
    req.app.locals.mainTextColor = sMainTextColorBite
    req.app.locals.postLinkColor = sPostLinkColorBite
    req.app.locals.postLinkVisitedColor = sPostLinkVisitedColorBite
    req.app.locals.groupBgColor = sGroupBgColorBite
    req.app.locals.groupTextColor = sGroupTextColorBite
    req.app.locals.hiddenColor = sHiddenColorBite
    req.app.locals.domainNameColor = sDomainNameColorBite
    req.app.locals.unfollowBgColor = sUnfollowBgColorBite
    req.app.locals.unfollowLineColor = sUnfollowLineColorBite
    req.app.locals.unfollowTextColor = sUnfollowTextColorBite
    req.app.locals.followBgColor = sFollowBgColorBite
    req.app.locals.followLineColor = sFollowLineColorBite
    req.app.locals.followTextColor = sFollowTextColorBite
    req.app.locals.mainLinkColor = sMainLinkColorBite
    req.app.locals.navLinkColor = sNavLinkColorBite

    //
    return res.render(
        'my-settings',
        {
            html_title: htmlTitleSettings,
            errors: [],
            success: 'Settings successfully saved.',
            user: req.session.user,
            time_zones: rows2,
            time_zone: req.body.time_zone,
            postMode: req.body.post_mode,
            postLayout: req.body.post_layout,
            oneBgColorForm: sOneBgColorBite,
            twoBgColorForm: sTwoBgColorBite,
            mainTextColorForm: sMainTextColorBite,
            postLinkColorForm: sPostLinkColorBite,
            postLinkVisitedColorForm: sPostLinkVisitedColorBite,
            groupBgColorForm: sGroupBgColorBite,
            groupTextColorForm: sGroupTextColorBite,
            hiddenColorForm: sHiddenColorBite,
            domainNameColorForm: sDomainNameColorBite,
            unfollowBgColorForm: sUnfollowBgColorBite,
            unfollowLineColorForm: sUnfollowLineColorBite,
            unfollowTextColorForm: sUnfollowTextColorBite,
            followBgColorForm: sFollowBgColorBite,
            followLineColorForm: sFollowLineColorBite,
            followTextColorForm: sFollowTextColorBite,
            mainLinkColorForm: sMainLinkColorBite,
            navLinkColorForm: sNavLinkColorBite,
            postsPerPage: req.body.posts_per_page,
            postsVerticalSpacing: req.body.posts_vertical_spacing,
            commentReplyMode: req.body.comment_reply_mode,
            siteWidth: req.body.site_width,
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
    primaryBgColor,
    secondaryBgColor,
    mainTextColor,
    postLinkColor,
    postLinkVisitedColor,
    groupBgColor,
    groupTextColor,
    hiddenColor,
    domainNameColor,
    unfollowBgColor,
    unfollowLineColor,
    unfollowTextColor,
    followBgColor,
    followLineColor,
    followTextColor,
    mainLinkColor,
    navLinkColor,
    postsVerticalSpacing,
) {
    console.log(navLinkColor)

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
        /*await db.updateUser(
            req.session.user.user_id,
            timeZone,
            viewMode,
            commentReplyMode,
            siteWidthNulled,
            postLayout,
            postsPerPage,
            primaryBgColor,
            secondaryBgColor,
            mainTextColor,
            postLinkColor,
            postLinkVisitedColor,
            groupBgColor,
            groupTextColor,
            hiddenColor,
            domainNameColor,
            unfollowBgColor,
            unfollowLineColor,
            unfollowTextColor,
            followBgColor,
            followLineColor,
            followTextColor,
            mainLinkColor,
            navLinkColor,
            postsVerticalSpacing)*/

        req.session.user.time_zone = timeZone
        req.session.user.post_mode = viewMode
        req.session.user.post_layout = postLayout
        req.session.user.one_bg_color = primaryBgColor
        req.session.user.two_bg_color = secondaryBgColor
        req.session.user.main_text_color = mainTextColor
        req.session.user.post_link_color = postLinkColor
        req.session.user.post_link_visited_color = postLinkVisitedColor
        req.session.user.group_bg_color = groupBgColor
        req.session.user.group_text_color = groupTextColor
        req.session.user.hidden_color = hiddenColor
        req.session.user.domain_name_color = domainNameColor
        req.session.user.unfollow_bg_color = unfollowBgColor
        req.session.user.unfollow_line_color = unfollowLineColor
        req.session.user.unfollow_text_color = unfollowTextColor
        req.session.user.follow_bg_color = followBgColor
        req.session.user.follow_line_color = followLineColor
        req.session.user.follow_text_color = followTextColor
        req.session.user.main_link_color = mainLinkColor
        req.session.user.nav_link_color = navLinkColor
        req.session.user.posts_per_page = postsPerPage
        req.session.user.posts_vertical_spacing = postsVerticalSpacing
        req.session.user.comment_reply_mode = commentReplyMode
        req.session.user.site_width = siteWidthNulled
    }
    else {

        //
        const settings = {
            time_zone: timeZone,
            post_mode: viewMode,
            post_layout: postLayout,
            one_bg_color: primaryBgColor,
            two_bg_color: secondaryBgColor,
            main_text_color: mainTextColor,
            post_link_color: postLinkColor,
            post_link_visited_color: postLinkVisitedColor,
            group_bg_color: groupBgColor,
            group_text_color: groupTextColor,
            hidden_color: hiddenColor,
            domain_name_color: domainNameColor,
            unfollow_bg_color: unfollowBgColor,
            unfollow_line_color: unfollowLineColor,
            unfollow_text_color: unfollowTextColor,
            follow_bg_color: followBgColor,
            follow_line_color: followLineColor,
            follow_text_color: followTextColor,
            main_link_color: mainLinkColor,
            nav_link_color: navLinkColor,
            posts_per_page: postsPerPage,
            posts_vertical_spacing: postsVerticalSpacing,
            site_width: siteWidthEmptied,
        }

        res.cookie(
            'settings',
            JSON.stringify(settings),
            {maxAge: cookieMaxAge})
    }
}
