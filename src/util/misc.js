const {URL} = require('url')
const http = require('http')
const https = require('https')
const config = require('../config')

//
exports.getCurrTimeZone = (req) => {
    let timeZone = undefined

    if(req.session.user) {
        timeZone = req.session.user.time_zone
    }
    else {
        const cSettings = module.exports.getCookieSettings(req)
        timeZone = cSettings.time_zone
    }

    //
    if(typeof timeZone === 'undefined') {
        timeZone = config.defaultTimeZone
    }

    //
    return timeZone
}

//
exports.processComment = (rawText) => {
    const noWhitespace = rawText.replace(/\s/g, '')
    const numNonWsChars = noWhitespace.length
    const compressedText = rawText.trim()
    const errors = []

    if(rawText.length === 0) {
        errors.push({'msg': 'Please fill in a comment'})
    }
    else if(numNonWsChars < 1) {
        errors.push({'msg': 'Comment must be at least 1 character'})
    }

    //
    return [compressedText, errors]
}

//
exports.processPostTitle = (rTitle) => {
    const titleNoWhitespace = rTitle.replace(/\s/g, '')
    const numNonWsChars = titleNoWhitespace.length
    const wsCompressedTitle = rTitle.replace(/\s+/g, ' ').trim()
    let error = null

    if(rTitle.length === 0) {
        error = {'msg': 'Please fill in a title'}
    }
    else if(numNonWsChars < 4) {
        error = {'msg': 'Title must be at least 4 characters'}
    }
    else if(wsCompressedTitle.length > 160) {
        error = {'msg': 'Title can\'t be more than 160 characters'}
    }

    //
    return [wsCompressedTitle, error]
}

//
exports.processPostTags = (rTags) => {
    let tags = rTags.split(',')
    let trimTags = []
    let errors = []

    for(let i = 0; i < tags.length; ++i) {
        let trimTag = tags[i].trim().toLowerCase()

        if(trimTag !== "" && trimTags.indexOf(trimTag) == -1) {
            trimTags.push(trimTag)
        }
    }

    //
    let isCharError = false
    let isLenError = false

    for(let i = 0; i < trimTags.length; ++i) {
        let isMatch = trimTags[i].match(/^[0-9a-zA-Z-]+$/)

        if(!isCharError && isMatch === null) {
            errors.push({'msg': 'group names can only contain numbers, letters and dashes'})
            isCharError = true
        }

        let tagLen = trimTags[i].length
        let isLenOkay = tagLen >= 3 && tagLen <= 20

        if(!isLenError && !isLenOkay) {
            errors.push({'msg': 'each group name must be 3-20 characters'})
            isLenError = true
        }
    }

    //
    if(trimTags.length > 4) {
        errors.push({'msg': 'the max tags per post is 4'})
    }

    //
    return [trimTags, errors]
}

//
exports.validateOauthClient = (appName, redirectUri) => {
    const errors = []

    //
    if(appName.trim() === '') {
        errors.push('Please fill in an application name')
    }

    //
    const urlRegex = /(https?):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|]/ig
    const isValidUri = urlRegex.test(redirectUri)

    if(!isValidUri) {
        errors.push('Please enter a valid http or https URL for redirect URI')
    }

    return errors
}

//
exports.getCurrPostMode = req => {
    if(req.session.user) {
        return (typeof req.session.user.post_mode === 'undefined')
            ? config.defaultViewMode
            : req.session.user.post_mode
    }
    else {
        const cSettings = module.exports.getCookieSettings(req)

        return (typeof cSettings.post_mode === 'undefined')
            ? config.defaultViewMode
            : cSettings.post_mode
    }
}

//
exports.getCurrPostLayout = req => {
    if(req.session.user) {
        return (typeof req.session.user.post_layout === 'undefined')
            ? config.defaultPostLayout
            : req.session.user.post_layout
    }
    else {
        const cSettings = module.exports.getCookieSettings(req)

        return (typeof cSettings.post_layout === 'undefined')
            ? config.defaultPostLayout
            : cSettings.post_layout
    }
}

//
exports.getOneBgColor = req => {
    if(req.session.user) {
        return (typeof req.session.user.one_bg_color === 'undefined')
            ? config.defaultOneBgColor
            : req.session.user.one_bg_color
    }
    else {
        const cSettings = module.exports.getCookieSettings(req)

        return (typeof cSettings.one_bg_color === 'undefined')
            ? config.defaultOneBgColor
            : cSettings.one_bg_color
    }
}

//
exports.getTwoBgColor = req => {
    if(req.session.user) {
        return (typeof req.session.user.two_bg_color === 'undefined')
            ? config.defaultTwoBgColor
            : req.session.user.two_bg_color
    }
    else {
        const cSettings = module.exports.getCookieSettings(req)

        return (typeof cSettings.two_bg_color === 'undefined')
            ? config.defaultTwoBgColor
            : cSettings.two_bg_color
    }
}

//
exports.getMainTextColor = req => {
    if(req.session.user) {
        return (typeof req.session.user.main_text_color === 'undefined')
            ? config.defaultMainTextColor
            : req.session.user.main_text_color
    }
    else {
        const cSettings = module.exports.getCookieSettings(req)

        return (typeof cSettings.main_text_color === 'undefined')
            ? config.defaultMainTextColor
            : cSettings.main_text_color
    }
}

//
exports.getPostLinkColor = req => {
    if(req.session.user) {
        return (typeof req.session.user.post_link_color === 'undefined')
            ? config.defaultPostLinkColor
            : req.session.user.post_link_color
    }
    else {
        const cSettings = module.exports.getCookieSettings(req)

        return (typeof cSettings.post_link_color === 'undefined')
            ? config.defaultPostLinkColor
            : cSettings.post_link_color
    }
}

//
exports.getPostLinkVisitedColor = req => {
    if(req.session.user) {
        return (typeof req.session.user.post_link_visited_color === 'undefined')
            ? config.defaultPostLinkVisitedColor
            : req.session.user.post_link_visited_color
    }
    else {
        const cSettings = module.exports.getCookieSettings(req)

        return (typeof cSettings.post_link_visited_color === 'undefined')
            ? config.defaultPostLinkVisitedColor
            : cSettings.post_link_visited_color
    }
}

//
exports.getGroupBgColor = req => {
    if(req.session.user) {
        return (typeof req.session.user.group_bg_color === 'undefined')
            ? config.defaultGroupBgColor
            : req.session.user.group_bg_color
    }
    else {
        const cSettings = module.exports.getCookieSettings(req)

        return (typeof cSettings.group_bg_color === 'undefined')
            ? config.defaultGroupBgColor
            : cSettings.group_bg_color
    }
}

//
exports.getGroupTextColor = req => {
    if(req.session.user) {
        return (typeof req.session.user.group_text_color === 'undefined')
            ? config.defaultGroupTextColor
            : req.session.user.group_text_color
    }
    else {
        const cSettings = module.exports.getCookieSettings(req)

        return (typeof cSettings.group_text_color === 'undefined')
            ? config.defaultGroupTextColor
            : cSettings.group_text_color
    }
}

//
exports.getHiddenColor = req => {
    if(req.session.user) {
        return (typeof req.session.user.hidden_color === 'undefined')
            ? config.defaultHiddenColor
            : req.session.user.hidden_color
    }
    else {
        const cSettings = module.exports.getCookieSettings(req)

        return (typeof cSettings.hidden_color === 'undefined')
            ? config.defaultHiddenColor
            : cSettings.hidden_color
    }
}

//
exports.getDomainNameColor = req => {
    if(req.session.user) {
        return (typeof req.session.user.domain_name_color === 'undefined')
            ? config.defaultDomainNameColor
            : req.session.user.domain_name_color
    }
    else {
        const cSettings = module.exports.getCookieSettings(req)

        return (typeof cSettings.domain_name_color === 'undefined')
            ? config.defaultDomainNameColor
            : cSettings.domain_name_color
    }
}

//
exports.getUnfollowBgColor = req => {
    if(req.session.user) {
        return (typeof req.session.user.unfollow_bg_color === 'undefined')
            ? config.defaultUnfollowBgColor
            : req.session.user.unfollow_bg_color
    }
    else {
        const cSettings = module.exports.getCookieSettings(req)

        return (typeof cSettings.unfollow_bg_color === 'undefined')
            ? config.defaultUnfollowBgColor
            : cSettings.unfollow_bg_color
    }
}

//
exports.getUnfollowLineColor = req => {
    if(req.session.user) {
        return (typeof req.session.user.unfollow_line_color === 'undefined')
            ? config.defaultUnfollowLineColor
            : req.session.user.unfollow_line_color
    }
    else {
        const cSettings = module.exports.getCookieSettings(req)

        return (typeof cSettings.unfollow_line_color === 'undefined')
            ? config.defaultUnfollowLineColor
            : cSettings.unfollow_line_color
    }
}

//
exports.getUnfollowTextColor = req => {
    if(req.session.user) {
        return (typeof req.session.user.unfollow_text_color === 'undefined')
            ? config.defaultUnfollowTextColor
            : req.session.user.unfollow_text_color
    }
    else {
        const cSettings = module.exports.getCookieSettings(req)

        return (typeof cSettings.unfollow_text_color === 'undefined')
            ? config.defaultUnfollowTextColor
            : cSettings.unfollow_text_color
    }
}

//
exports.getFollowBgColor = req => {
    if(req.session.user) {
        return (typeof req.session.user.follow_bg_color === 'undefined')
            ? config.defaultFollowBgColor
            : req.session.user.follow_bg_color
    }
    else {
        const cSettings = module.exports.getCookieSettings(req)

        return (typeof cSettings.follow_bg_color === 'undefined')
            ? config.defaultFollowBgColor
            : cSettings.follow_bg_color
    }
}

//
exports.getFollowLineColor = req => {
    if(req.session.user) {
        return (typeof req.session.user.follow_line_color === 'undefined')
            ? config.defaultFollowLineColor
            : req.session.user.follow_line_color
    }
    else {
        const cSettings = module.exports.getCookieSettings(req)

        return (typeof cSettings.follow_line_color === 'undefined')
            ? config.defaultFollowLineColor
            : cSettings.follow_line_color
    }
}

//
exports.getFollowTextColor = req => {
    if(req.session.user) {
        return (typeof req.session.user.follow_text_color === 'undefined')
            ? config.defaultFollowTextColor
            : req.session.user.follow_text_color
    }
    else {
        const cSettings = module.exports.getCookieSettings(req)

        return (typeof cSettings.follow_text_color === 'undefined')
            ? config.defaultFollowTextColor
            : cSettings.follow_text_color
    }
}

//
exports.getMainLinkColor = req => {
    if(req.session.user) {
        return (typeof req.session.user.main_link_color === 'undefined')
            ? config.defaultMainLinkColor
            : req.session.user.main_link_color
    }
    else {
        const cSettings = module.exports.getCookieSettings(req)

        return (typeof cSettings.main_link_color === 'undefined')
            ? config.defaultMainLinkColor
            : cSettings.main_link_color
    }
}

//
exports.getNavLinkColor = req => {
    if(req.session.user) {
        return (typeof req.session.user.nav_link_color === 'undefined')
            ? config.defaultNavLinkColor
            : req.session.user.nav_link_color
    }
    else {
        const cSettings = module.exports.getCookieSettings(req)

        return (typeof cSettings.nav_link_color === 'undefined')
            ? config.defaultNavLinkColor
            : cSettings.nav_link_color
    }
}

//
exports.getFooterLinkColor = req => {
    if(req.session.user) {
        return (typeof req.session.user.footer_link_color === 'undefined')
            ? config.defaultFooterLinkColor
            : req.session.user.footer_link_color
    }
    else {
        const cSettings = module.exports.getCookieSettings(req)

        return (typeof cSettings.footer_link_color === 'undefined')
            ? config.defaultFooterLinkColor
            : cSettings.footer_link_color
    }
}

//
exports.getPageBgColor = req => {
    if(req.session.user) {
        return (typeof req.session.user.page_bg_color === 'undefined')
            ? config.defaultPageBgColor
            : req.session.user.page_bg_color
    }
    else {
        const cSettings = module.exports.getCookieSettings(req)

        return (typeof cSettings.page_bg_color === 'undefined')
            ? config.defaultPageBgColor
            : cSettings.page_bg_color
    }
}

//
exports.getPageLineColor = req => {
    if(req.session.user) {
        return (typeof req.session.user.page_line_color === 'undefined')
            ? config.defaultPageLineColor
            : req.session.user.page_line_color
    }
    else {
        const cSettings = module.exports.getCookieSettings(req)

        return (typeof cSettings.page_line_color === 'undefined')
            ? config.defaultPageLineColor
            : cSettings.page_line_color
    }
}

//
exports.getPageTextColor = req => {
    if(req.session.user) {
        return (typeof req.session.user.page_text_color === 'undefined')
            ? config.defaultPageTextColor
            : req.session.user.page_text_color
    }
    else {
        const cSettings = module.exports.getCookieSettings(req)

        return (typeof cSettings.page_text_color === 'undefined')
            ? config.defaultPageTextColor
            : cSettings.page_text_color
    }
}

//
exports.getHighBgColor = req => {
    if(req.session.user) {
        return (typeof req.session.user.high_bg_color === 'undefined')
            ? config.defaultHighBgColor
            : req.session.user.high_bg_color
    }
    else {
        const cSettings = module.exports.getCookieSettings(req)

        return (typeof cSettings.high_bg_color === 'undefined')
            ? config.defaultHighBgColor
            : cSettings.high_bg_color
    }
}

//
exports.getHighTextColor = req => {
    if(req.session.user) {
        return (typeof req.session.user.high_text_color === 'undefined')
            ? config.defaultHighTextColor
            : req.session.user.high_text_color
    }
    else {
        const cSettings = module.exports.getCookieSettings(req)

        return (typeof cSettings.high_text_color === 'undefined')
            ? config.defaultHighTextColor
            : cSettings.high_text_color
    }
}

//
exports.getHighLinkColor = req => {
    if(req.session.user) {
        return (typeof req.session.user.high_link_color === 'undefined')
            ? config.defaultHighLinkColor
            : req.session.user.high_link_color
    }
    else {
        const cSettings = module.exports.getCookieSettings(req)

        return (typeof cSettings.high_link_color === 'undefined')
            ? config.defaultHighLinkColor
            : cSettings.high_link_color
    }
}

//
exports.getCommentHeadColor = req => {
    if(req.session.user) {
        return (typeof req.session.user.comment_head_color === 'undefined')
            ? config.defaultCommentHeadColor
            : req.session.user.comment_head_color
    }
    else {
        const cSettings = module.exports.getCookieSettings(req)

        return (typeof cSettings.comment_head_color === 'undefined')
            ? config.defaultCommentHeadColor
            : cSettings.comment_head_color
    }
}

//
exports.getCommentUserColor = req => {
    if(req.session.user) {
        return (typeof req.session.user.comment_user_color === 'undefined')
            ? config.defaultCommentUserColor
            : req.session.user.comment_user_color
    }
    else {
        const cSettings = module.exports.getCookieSettings(req)

        return (typeof cSettings.comment_user_color === 'undefined')
            ? config.defaultCommentUserColor
            : cSettings.comment_user_color
    }
}

//
exports.getCommentFootColor = req => {
    if(req.session.user) {
        return (typeof req.session.user.comment_foot_color === 'undefined')
            ? config.defaultCommentFootColor
            : req.session.user.comment_foot_color
    }
    else {
        const cSettings = module.exports.getCookieSettings(req)

        return (typeof cSettings.comment_foot_color === 'undefined')
            ? config.defaultCommentFootColor
            : cSettings.comment_foot_color
    }
}

//
exports.getPreBgColor = req => {
    if(req.session.user) {
        return (typeof req.session.user.pre_bg_color === 'undefined')
            ? config.defaultPreBgColor
            : req.session.user.pre_bg_color
    }
    else {
        const cSettings = module.exports.getCookieSettings(req)

        return (typeof cSettings.pre_bg_color === 'undefined')
            ? config.defaultPreBgColor
            : cSettings.pre_bg_color
    }
}

//
exports.getPreTextColor = req => {
    if(req.session.user) {
        return (typeof req.session.user.pre_text_color === 'undefined')
            ? config.defaultPreTextColor
            : req.session.user.pre_text_color
    }
    else {
        const cSettings = module.exports.getCookieSettings(req)

        return (typeof cSettings.pre_text_color === 'undefined')
            ? config.defaultPreTextColor
            : cSettings.pre_text_color
    }
}

//
exports.getPreLinkColor = req => {
    if(req.session.user) {
        return (typeof req.session.user.pre_link_color === 'undefined')
            ? config.defaultPreLinkColor
            : req.session.user.pre_link_color
    }
    else {
        const cSettings = module.exports.getCookieSettings(req)

        return (typeof cSettings.pre_link_color === 'undefined')
            ? config.defaultPreLinkColor
            : cSettings.pre_link_color
    }
}

//
exports.getSuccessTextColor = req => {
    if(req.session.user) {
        return (typeof req.session.user.success_text_color === 'undefined')
            ? config.defaultSuccessTextColor
            : req.session.user.success_text_color
    }
    else {
        const cSettings = module.exports.getCookieSettings(req)

        return (typeof cSettings.success_text_color === 'undefined')
            ? config.defaultSuccessTextColor
            : cSettings.success_text_color
    }
}

//
exports.getErrorTextColor = req => {
    if(req.session.user) {
        return (typeof req.session.user.error_text_color === 'undefined')
            ? config.defaultErrorTextColor
            : req.session.user.error_text_color
    }
    else {
        const cSettings = module.exports.getCookieSettings(req)

        return (typeof cSettings.error_text_color === 'undefined')
            ? config.defaultErrorTextColor
            : cSettings.error_text_color
    }
}

//
exports.getEmBgColor = req => {
    if(req.session.user) {
        return (typeof req.session.user.em_bg_color === 'undefined')
            ? config.defaultEmBgColor
            : req.session.user.em_bg_color
    }
    else {
        const cSettings = module.exports.getCookieSettings(req)

        return (typeof cSettings.em_bg_color === 'undefined')
            ? config.defaultEmBgColor
            : cSettings.em_bg_color
    }
}

//
exports.getEmTextColor = req => {
    if(req.session.user) {
        return (typeof req.session.user.em_text_color === 'undefined')
            ? config.defaultEmTextColor
            : req.session.user.em_text_color
    }
    else {
        const cSettings = module.exports.getCookieSettings(req)

        return (typeof cSettings.em_text_color === 'undefined')
            ? config.defaultEmTextColor
            : cSettings.em_text_color
    }
}

//
exports.getCurrCommentReplyMode = req => {
    if(req.session.user) {
        return (typeof req.session.user.comment_reply_mode === 'undefined')
            ? config.defaultCommentReplyMode
            : req.session.user.comment_reply_mode
    }
    else {
        return config.defaultCommentReplyMode
    }
}

//
exports.getCurrPostsVerticalSpacing = req => {

    //
    if(req.session.user) {
        return (typeof req.session.user.posts_vertical_spacing == 'undefined')
            ? config.defaultPostsVerticalSpacing
            : req.session.user.posts_vertical_spacing
    }

    //
    const cSettings = module.exports.getCookieSettings(req)

    if(typeof cSettings.posts_vertical_spacing == 'undefined') {
        return config.defaultPostsVerticalSpacing
    }

    //
    const postsVerticalSpacingInt = parseInt(cSettings.posts_vertical_spacing)

    if(isNaN(postsVerticalSpacingInt)) {
        return config.defaultPostsVerticalSpacing
    }

    if(postsVerticalSpacingInt < config.minPostsVerticalSpacing || postsVerticalSpacingInt > config.maxPostsVerticalSpacing) {
        return config.defaultPostsVerticalSpacing
    }

    //
    return postsVerticalSpacingInt
}

//
exports.getCurrPostsPerPage = req => {
    if(req.session.user) {
        return (typeof req.session.user.posts_per_page === 'undefined')
            ? config.defaultPostsPerPage
            : req.session.user.posts_per_page
    }
    else {
        const cSettings = module.exports.getCookieSettings(req)

        if(typeof cSettings.posts_per_page === 'undefined') {
            return config.defaultPostsPerPage
        }
        else {
            const postsPerPageInt = parseInt(cSettings.posts_per_page)

            if(isNaN(postsPerPageInt)) {
                return config.defaultPostsPerPage
            }
            else if(postsPerPageInt < config.minPostsPerPage || postsPerPageInt > config.maxPostsPerPage) {
                return config.defaultPostsPerPage
            }
            else {
                return postsPerPageInt
            }
        }
    }
}

//
exports.getCurrSiteMaxWidth = req => {
    if(req.session.user) {
        return (typeof req.session.user.site_width === 'undefined')
            ? config.defaultSiteWidth
            : req.session.user.site_width
    }
    else {
        const cSettings = module.exports.getCookieSettings(req)

        if(typeof cSettings.site_width === 'undefined') {
            return config.defaultSiteWidth
        }
        else if(cSettings.site_width === '') {
            return null
        }
        else {
            const siteWidthInt = parseInt(cSettings.site_width)

            if(isNaN(siteWidthInt)) {
                return config.defaultSiteWidth
            }
            else if(siteWidthInt < config.minSiteWidth || siteWidthInt > config.maxSiteWidth) {
                return config.defaultSiteWidth
            }
            else {
                return siteWidthInt
            }
        }
    }
}

//
exports.isDiscover = req => {
    return module.exports.getCurrPostMode(req) !== 'discover'
        ? 0
        : 1
}

//
exports.getDomainName = link => {
    const myUrl = new URL(link)
    return myUrl.hostname.replace(/^(www\.)/, '')
}

//
exports.getPostSort = req => {
    let sort = ''
    const validSortVals = ['oldest', 'comments', 'last']
    const isSortVal = (typeof req.query.sort !== 'undefined')
    const isSort = isSortVal && (validSortVals.indexOf(req.query.sort) != -1)

    if(isSort) {
        sort = req.query.sort
    }

    return sort
}

//
exports.getUrlContent = url => {
    return new Promise((resolve, reject) => {
        const myUrl = new URL(url)
        const protocol = myUrl.protocol == 'https:'
            ? https
            : http

        protocol.get(url, res => {
            res.setEncoding('utf8')

            let rawData = ''

            res.on('data', chunk => rawData += chunk)

            res.on('end', () => {
                resolve(rawData)
            })
        }).on('error', () => {
            reject('error')
        })
    })
}

//
exports.numToOrderedAlpha = num => {
    var first = Math.ceil(num/676)

    var second = Math.ceil(num/26)%26
    second = second ? second : 26

    var third = Math.ceil(num%26)
    third = third ? third : 26

    return String.fromCharCode(96 + first) +
        String.fromCharCode(96 + second) +
        String.fromCharCode(96 + third)
}

//
exports.orderedAlphaToNum = oAlpha => {
    const rightChar = oAlpha.substring(2, 3)
    const rightValue = rightChar.charCodeAt() - 96
  
    const middleChar = oAlpha.substring(1, 2)
    const middleValue = 26*(middleChar.charCodeAt() - 97)
  
    const leftChar = oAlpha.substring(0, 1)
    const leftValue = 26*26*(leftChar.charCodeAt() - 97)
  
    return rightValue + middleValue + leftValue
}

//
exports.getCookieSettings = req => {
    const settingsC = req.cookies.settings
    const defaults = {
        time_zone: config.defaultTimeZone,
        post_mode: config.defaultViewMode,
        post_layout: config.defaultPostLayout,
        one_bg_color: config.defaultOneBgColor,
        two_bg_color: config.defaultTwoBgColor,
        main_text_color: config.defaultMainTextColor,
        post_link_color: config.defaultPostLinkColor,
        post_link_visited_color: config.defaultPostLinkVisitedColor,
        group_bg_color: config.defaultGroupBgColor,
        group_text_color: config.defaultGroupTextColor,
        hidden_color: config.defaultHiddenColor,
        domain_name_color: config.defaultDomainNameColor,
        unfollow_bg_color: config.defaultUnfollowBgColor,
        unfollow_line_color: config.defaultUnfollowLineColor,
        unfollow_text_color: config.defaultUnfollowTextColor,
        follow_bg_color: config.defaultFollowBgColor,
        follow_line_color: config.defaultFollowLineColor,
        follow_text_color: config.defaultFollowTextColor,
        main_link_color: config.defaultMainLinkColor,
        nav_link_color: config.defaultNavLinkColor,
        footer_link_color: config.defaultFooterLinkColor,
        page_bg_color: config.defaultPageBgColor,
        page_line_color: config.defaultPageLineColor,
        page_text_color: config.defaultPageTextColor,
        high_bg_color: config.defaultHighBgColor,
        high_text_color: config.defaultHighTextColor,
        high_link_color: config.defaultHighLinkColor,
        comment_head_color: config.defaultCommentHeadColor,
        comment_user_color: config.defaultCommentUserColor,
        comment_foot_color: config.defaultCommentFootColor,
        pre_bg_color: config.defaultPreBgColor,
        pre_text_color: config.defaultPreTextColor,
        pre_link_color: config.defaultPreLinkColor,
        success_text_color: config.defaultSuccessTextColor,
        error_text_color: config.defaultErrorTextColor,
        em_bg_color: config.defaultEmBgColor,
        em_text_color: config.defaultEmTextColor,
        posts_per_page: config.defaultPostsPerPage,
        posts_vertical_spacing: config.defaultPostsVerticalSpacing,
        site_width: config.defaultSiteWidth,
    }

    if(typeof settingsC == 'undefined') {
        return defaults
    }

    //
    const settings = JSON.parse(settingsC)
    return settings
}

//
exports.renderMessage = (req, res, title, message) => {
    return res.render(
        'message',
        {
            html_title: title,
            message: message,
            user: req.session.user,
            max_width: module.exports.getCurrSiteMaxWidth(req)
        })
}
