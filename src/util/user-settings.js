const db = require('../db')
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
exports.getCurrTheme = req => {
    if(req.session.user) {
        return (typeof req.session.user.theme === 'undefined')
            ? config.defaultTheme
            : req.session.user.theme
    }
    else {
        const cSettings = module.exports.getCookieSettings(req)

        return (typeof cSettings.theme === 'undefined')
            ? config.defaultTheme
            : cSettings.theme
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
exports.getCurrDateFormat = req => {
    if(req.session.user) {
        return (typeof req.session.user.date_format === 'undefined')
            ? config.defaultDateFormat
            : req.session.user.date_format
    }
    else {
        const cSettings = module.exports.getCookieSettings(req)

        return (typeof cSettings.date_format === 'undefined')
            ? config.defaultDateFormat
            : cSettings.date_format
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
exports.getCookieSettings = req => {
    const settingsC = req.cookies.settings
    const defaults = {
        time_zone: config.defaultTimeZone,
        post_layout: config.defaultPostLayout,
        posts_per_page: config.defaultPostsPerPage,
        posts_vertical_spacing: config.defaultPostsVerticalSpacing,
        theme: config.defaultTheme,
        site_width: config.defaultSiteWidth,
        date_format: config.defaultDateFormat,
    }

    if(typeof settingsC == 'undefined') {
        return defaults
    }

    //
    const settings = JSON.parse(settingsC)
    return settings
}

//
exports.setTheme = (theme, res) => {
    if(theme == 'original') {
        res.locals.oneBgColor = "fefefe"
        res.locals.twoBgColor = "b6b09e"
        res.locals.themeCss = `${config.cssDir}/theme-original.css`
        res.locals.themeLogo = '/images/logo2.png'
    }
    else {
        res.locals.oneBgColor = "050505"
        res.locals.twoBgColor = "323334"
        res.locals.themeCss = `${config.cssDir}/theme-dark-mode.css`
        res.locals.themeLogo = '/images/logo-dm.png'
    }
}

//
exports.updateSettings = async (
    req,
    res,
    timeZone,
    commentReplyMode,
    siteWidth,
    postLayout,
    postsPerPage,
    postsVerticalSpacing,
    theme,
    dateFormat
) => {

    //
    const cookieMaxAge = 1000*60*60*24*365*10

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
            commentReplyMode,
            siteWidthNulled,
            postLayout,
            postsPerPage,
            postsVerticalSpacing,
            theme,
            dateFormat)

        req.session.user.time_zone = timeZone
        req.session.user.post_layout = postLayout
        req.session.user.posts_per_page = postsPerPage
        req.session.user.posts_vertical_spacing = postsVerticalSpacing
        req.session.user.theme = theme
        req.session.user.comment_reply_mode = commentReplyMode
        req.session.user.date_format = dateFormat
        req.session.user.site_width = siteWidthNulled
    }
    else {

        const cSettings = module.exports.getCookieSettings(req)

        cSettings.time_zone = timeZone
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
