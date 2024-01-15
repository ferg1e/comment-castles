const express = require('express')
const db = require('../db')
const myMisc = require('../util/misc.js')
const config = require('../config')

const router = express.Router()
const htmlTitle = 'Settings / Colors'
const cookieMaxAge = 1000*60*60*24*365*10;

//
const get = async (req, res) => {
    return res.render(
        'my-settings-colors',
        {
            html_title: htmlTitle,
            errors: [],
            user: req.session.user,
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
        )

        return res.redirect('/settings/colors')
    }

    //
    const errors = []

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
            'my-settings-colors',
            {
                html_title: htmlTitle,
                errors: errors,
                user: req.session.user,
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
                max_width: myMisc.getCurrSiteMaxWidth(req)
            })
    }

    //
    await updateSettings(
        req,
        res,
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
    )

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
        'my-settings-colors',
        {
            html_title: htmlTitle,
            errors: [],
            success: 'Colors successfully saved.',
            user: req.session.user,
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
            max_width: myMisc.getCurrSiteMaxWidth(req),
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
) {
    //
    if(req.session.user) {
        await db.updateUserColors(
            req.session.user.user_id,
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
            navLinkColor)

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
    }
    else {

        const cSettings = myMisc.getCookieSettings(req)

        cSettings.one_bg_color = primaryBgColor
        cSettings.two_bg_color = secondaryBgColor
        cSettings.main_text_color = mainTextColor
        cSettings.post_link_color = postLinkColor
        cSettings.post_link_visited_color = postLinkVisitedColor
        cSettings.group_bg_color = groupBgColor
        cSettings.group_text_color = groupTextColor
        cSettings.hidden_color = hiddenColor
        cSettings.domain_name_color = domainNameColor
        cSettings.unfollow_bg_color = unfollowBgColor
        cSettings.unfollow_line_color = unfollowLineColor
        cSettings.unfollow_text_color = unfollowTextColor
        cSettings.follow_bg_color = followBgColor
        cSettings.follow_line_color = followLineColor
        cSettings.follow_text_color = followTextColor
        cSettings.main_link_color = mainLinkColor
        cSettings.nav_link_color = navLinkColor

        res.cookie(
            'settings',
            JSON.stringify(cSettings),
            {maxAge: cookieMaxAge})

    }
}
