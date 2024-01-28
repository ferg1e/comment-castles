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
            footerLinkColorForm: myMisc.getFooterLinkColor(req),
            pageBgColorForm: myMisc.getPageBgColor(req),
            pageLineColorForm: myMisc.getPageLineColor(req),
            pageTextColorForm: myMisc.getPageTextColor(req),
            highBgColorForm: myMisc.getHighBgColor(req),
            highTextColorForm: myMisc.getHighTextColor(req),
            highLinkColorForm: myMisc.getHighLinkColor(req),
            commentHeadColorForm: myMisc.getCommentHeadColor(req),
            commentUserColorForm: myMisc.getCommentUserColor(req),
            commentFootColorForm: myMisc.getCommentFootColor(req),
            preBgColorForm: myMisc.getPreBgColor(req),
            preTextColorForm: myMisc.getPreTextColor(req),
            preLinkColorForm: myMisc.getPreLinkColor(req),
            successTextColorForm: myMisc.getSuccessTextColor(req),
            errorTextColorForm: myMisc.getErrorTextColor(req),
            emBgColorForm: myMisc.getEmBgColor(req),
            emTextColorForm: myMisc.getEmTextColor(req),
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
            config.defaultFooterLinkColor,
            config.defaultPageBgColor,
            config.defaultPageLineColor,
            config.defaultPageTextColor,
            config.defaultHighBgColor,
            config.defaultHighTextColor,
            config.defaultHighLinkColor,
            config.defaultCommentHeadColor,
            config.defaultCommentUserColor,
            config.defaultCommentFootColor,
            config.defaultPreBgColor,
            config.defaultPreTextColor,
            config.defaultPreLinkColor,
            config.defaultSuccessTextColor,
            config.defaultErrorTextColor,
            config.defaultEmBgColor,
            config.defaultEmTextColor,
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
    const sFooterLinkColorBite = req.body.footer_link_color.substring(1)
    const sPageBgColorBite = req.body.page_bg_color.substring(1)
    const sPageLineColorBite = req.body.page_line_color.substring(1)
    const sPageTextColorBite = req.body.page_text_color.substring(1)
    const sHighBgColorBite = req.body.high_bg_color.substring(1)
    const sHighTextColorBite = req.body.high_text_color.substring(1)
    const sHighLinkColorBite = req.body.high_link_color.substring(1)
    const sCommentHeadColorBite = req.body.comment_head_color.substring(1)
    const sCommentUserColorBite = req.body.comment_user_color.substring(1)
    const sCommentFootColorBite = req.body.comment_foot_color.substring(1)
    const sPreBgColorBite = req.body.pre_bg_color.substring(1)
    const sPreTextColorBite = req.body.pre_text_color.substring(1)
    const sPreLinkColorBite = req.body.pre_link_color.substring(1)
    const sSuccessTextColorBite = req.body.success_text_color.substring(1)
    const sErrorTextColorBite = req.body.error_text_color.substring(1)
    const sEmBgColorBite = req.body.em_bg_color.substring(1)
    const sEmTextColorBite = req.body.em_text_color.substring(1)

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
                footerLinkColorForm: sFooterLinkColorBite,
                pageBgColorForm: sPageBgColorBite,
                pageLineColorForm: sPageLineColorBite,
                pageTextColorForm: sPageTextColorBite,
                highBgColorForm: sHighBgColorBite,
                highTextColorForm: sHighTextColorBite,
                highLinkColorForm: sHighLinkColorBite,
                commentHeadColorForm: sCommentHeadColorBite,
                commentUserColorForm: sCommentUserColorBite,
                commentFootColorForm: sCommentFootColorBite,
                preBgColorForm: sPreBgColorBite,
                preTextColorForm: sPreTextColorBite,
                preLinkColorForm: sPreLinkColorBite,
                successTextColorForm: sSuccessTextColorBite,
                errorTextColorForm: sErrorTextColorBite,
                emBgColorForm: sEmBgColorBite,
                emTextColorForm: sEmTextColorBite,
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
        sFooterLinkColorBite,
        sPageBgColorBite,
        sPageLineColorBite,
        sPageTextColorBite,
        sHighBgColorBite,
        sHighTextColorBite,
        sHighLinkColorBite,
        sCommentHeadColorBite,
        sCommentUserColorBite,
        sCommentFootColorBite,
        sPreBgColorBite,
        sPreTextColorBite,
        sPreLinkColorBite,
        sSuccessTextColorBite,
        sErrorTextColorBite,
        sEmBgColorBite,
        sEmTextColorBite,
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
    req.app.locals.footerLinkColor = sFooterLinkColorBite
    req.app.locals.pageBgColor = sPageBgColorBite
    req.app.locals.pageLineColor = sPageLineColorBite
    req.app.locals.pageTextColor = sPageTextColorBite
    req.app.locals.highBgColor = sHighBgColorBite
    req.app.locals.highTextColor = sHighTextColorBite
    req.app.locals.highLinkColor = sHighLinkColorBite
    req.app.locals.commentHeadColor = sCommentHeadColorBite
    req.app.locals.commentUserColor = sCommentUserColorBite
    req.app.locals.commentFootColor = sCommentFootColorBite
    req.app.locals.preBgColor = sPreBgColorBite
    req.app.locals.preTextColor = sPreTextColorBite
    req.app.locals.preLinkColor = sPreLinkColorBite
    req.app.locals.successTextColor = sSuccessTextColorBite
    req.app.locals.errorTextColor = sErrorTextColorBite
    req.app.locals.emBgColor = sEmBgColorBite
    req.app.locals.emTextColor = sEmTextColorBite

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
            footerLinkColorForm: sFooterLinkColorBite,
            pageBgColorForm: sPageBgColorBite,
            pageLineColorForm: sPageLineColorBite,
            pageTextColorForm: sPageTextColorBite,
            highBgColorForm: sHighBgColorBite,
            highTextColorForm: sHighTextColorBite,
            highLinkColorForm: sHighLinkColorBite,
            commentHeadColorForm: sCommentHeadColorBite,
            commentUserColorForm: sCommentUserColorBite,
            commentFootColorForm: sCommentFootColorBite,
            preBgColorForm: sPreBgColorBite,
            preTextColorForm: sPreTextColorBite,
            preLinkColorForm: sPreLinkColorBite,
            successTextColorForm: sSuccessTextColorBite,
            errorTextColorForm: sErrorTextColorBite,
            emBgColorForm: sEmBgColorBite,
            emTextColorForm: sEmTextColorBite,
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
    footerLinkColor,
    pageBgColor,
    pageLineColor,
    pageTextColor,
    highBgColor,
    highTextColor,
    highLinkColor,
    commentHeadColor,
    commentUserColor,
    commentFootColor,
    preBgColor,
    preTextColor,
    preLinkColor,
    successTextColor,
    errorTextColor,
    emBgColor,
    emTextColor,
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
            navLinkColor,
            footerLinkColor,
            pageBgColor,
            pageLineColor,
            pageTextColor,
            highBgColor,
            highTextColor,
            highLinkColor,
            commentHeadColor,
            commentUserColor,
            commentFootColor,
            preBgColor,
            preTextColor,
            preLinkColor,
            successTextColor,
            errorTextColor,
            emBgColor,
            emTextColor)

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
        req.session.user.footer_link_color = footerLinkColor
        req.session.user.page_bg_color = pageBgColor
        req.session.user.page_line_color = pageLineColor
        req.session.user.page_text_color = pageTextColor
        req.session.user.high_bg_color = highBgColor
        req.session.user.high_text_color = highTextColor
        req.session.user.high_link_color = highLinkColor
        req.session.user.comment_head_color = commentHeadColor
        req.session.user.comment_user_color = commentUserColor
        req.session.user.comment_foot_color = commentFootColor
        req.session.user.pre_bg_color = preBgColor
        req.session.user.pre_text_color = preTextColor
        req.session.user.pre_link_color = preLinkColor
        req.session.user.success_text_color = successTextColor
        req.session.user.error_text_color = errorTextColor
        req.session.user.em_bg_color = emBgColor
        req.session.user.em_text_color = emTextColor
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
        cSettings.footer_link_color = footerLinkColor
        cSettings.page_bg_color = pageBgColor
        cSettings.page_line_color = pageLineColor
        cSettings.page_text_color = pageTextColor
        cSettings.high_bg_color = highBgColor
        cSettings.high_text_color = highTextColor
        cSettings.high_link_color = highLinkColor
        cSettings.comment_head_color = commentHeadColor
        cSettings.comment_user_color = commentUserColor
        cSettings.comment_foot_color = commentFootColor
        cSettings.pre_bg_color = preBgColor
        cSettings.pre_text_color = preTextColor
        cSettings.pre_link_color = preLinkColor
        cSettings.success_text_color = successTextColor
        cSettings.error_text_color = errorTextColor
        cSettings.em_bg_color = emBgColor
        cSettings.em_text_color = emTextColor

        res.cookie(
            'settings',
            JSON.stringify(cSettings),
            {maxAge: cookieMaxAge})

    }
}
