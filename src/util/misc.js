const {URL} = require('url')
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

exports.extractHashtags = (text) => {
    const matches = [...text.matchAll(config.hashtagsRegex)]

    return matches
        .map(v => v[0].substring(1).toLowerCase())
}

//
exports.getPageNum = (req) => {

    //
    if(typeof req.query.p === 'undefined') {
        return 1
    }

    //
    const rawPage = req.query.p
    const intRegex = /^\-?(([1-9]\d*)|0)$/
    const isInt = intRegex.test(rawPage)

    if(!isInt) {
        throw Error('invalid page value: not an integer')
    }

    //
    const intPage = parseInt(rawPage)
    const isInRange = intPage >= 1 && intPage <= Number.MAX_SAFE_INTEGER

    //
    if(!isInRange) {
        throw Error('invalid page value: out of range')
    }

    //
    return intPage
}
