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
exports.processDm = (rawText) => {
    const noWhitespace = rawText.replace(/\s/g, '')
    const numNonWsChars = noWhitespace.length
    const compressedMessage = rawText.trim()
    const errors = []

    if(rawText.length === 0) {
        errors.push('Please fill in a message')
    }
    else if(numNonWsChars < 1) {
        errors.push('Message must be at least 1 character')
    }

    //
    return [compressedMessage, errors]
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
exports.processPostCastle = (castle) => {
    const errors = []
    const trimCastle = castle.trim().toLowerCase()

    //
    if(trimCastle === '') {
        return [
            trimCastle,
            [{'msg': 'Please fill in a sub'}]]
    }

    //
    const isMatch = trimCastle.match(/^[0-9a-z-]+$/)

    if(isMatch === null) {
        errors.push({'msg': 'sub can only contain numbers, letters and dashes'})
    }

    const castleLen = trimCastle.length
    const isLenOkay = castleLen >= 3 && castleLen <= 20

    if(!isLenOkay) {
        errors.push({'msg': 'sub must be 3-20 characters'})
    }

    //
    return [trimCastle, errors]
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

//
exports.renderNoSubMessage = (req, res, subName) => {
    return module.exports.renderMessage(req, res, subName,
        `The ${subName} castle does not exist yet. ` +
        `You can start this castle by <a href="/new?castle=${subName}">posting</a> to it.`)
}

//
exports.setTheme = (theme, req) => {
    if(theme == 'original') {
        req.app.locals.oneBgColor = "fefefe"
        req.app.locals.twoBgColor = "b6b09e"
        req.app.locals.themeCss = `${config.cssDir}/theme-original.css`
        req.app.locals.themeLogo = '/images/logo2.png'
    }
    else {
        req.app.locals.oneBgColor = "050505"
        req.app.locals.twoBgColor = "323334"
        req.app.locals.themeCss = `${config.cssDir}/theme-dark-mode.css`
        req.app.locals.themeLogo = '/images/logo-dm.png'
    }
}
