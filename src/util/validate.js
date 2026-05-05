const db = require('../db')
const config = require('../config/index')

//
exports.validateComment = (rawText) => {
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
exports.validateDm = (rawText) => {
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
exports.validateEditPost = (title, link) => {

    //
    let errors = []

    //
    const isValidLink = 
        link === '' ||
        config.singleUrlRegex.test(link)

    if(!isValidLink) {
        errors.push({msg: 'link must be an http or https URL'})
    }

    //
    let [wsCompressedTitle, error] = module.exports.validatePostTitle(title)

    if(error !== null) {
        errors.push(error)
    }

    //
    return [errors, wsCompressedTitle]
}

//
module.exports.validateNewPost = async (title, link, castle) => {

    //
    let errors = []

    //
    const urlRegex = /(https?):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|]/ig
    const isValidLink = 
        link === '' ||
        urlRegex.test(link)

    if(!isValidLink) {
        errors.push({msg: 'link must be an http or https URL'})
    }

    //
    let [wsCompressedTitle, error] = module.exports.validatePostTitle(title)

    if(error !== null) {
        errors.push(error)
    }

    //
    const [trimCastle, castleErrors] = module.exports.validatePostSub(castle)
    errors = errors.concat(castleErrors)

    //
    if(errors.length == 0) {
        const {rows:[sub]} = await db.getSub(trimCastle)

        if(sub && sub.is_post_locked) {
            errors.push({msg: 'no new posts allowed for this sub'})
        }
    }

    //
    return [errors, wsCompressedTitle, trimCastle]
}

//
module.exports.validateOauthClient = (appName, redirectUri) => {
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
module.exports.validatePageNum = (req) => {

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

//
exports.validatePostSort = req => {
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
module.exports.validatePostSub = (castle) => {
    const errors = []
    const trimCastle = castle.trim().toLowerCase()

    //if blank it's no sub,
    //so just return without errors
    if(trimCastle === '') {
        return [
            trimCastle,
            []]
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
module.exports.validatePostTitle = (rTitle) => {
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
module.exports.validateSignUp = (username, password) => {
    const regexPassword = /^.{9,100}$/
    const errors = []

    //
    if(username === '') {
        errors.push('Please fill in a username')
    }
    else if(!config.regexUsername.test(username)) {
        errors.push('Username must be 4-16 characters (letters, numbers and dashes only)')
    }

    //
    if(password === '') {
        errors.push('Please fill in a password')
    }
    else if(!regexPassword.test(password)) {
        errors.push('Password must be 9-100 characters')
    }

    return errors
}
