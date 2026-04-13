const myMisc = require('./misc')
const db = require('../db')
const config = require('../config/index')

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
    const [trimCastle, castleErrors] = module.exports.processPostCastle(castle)
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
module.exports.processPostCastle = (castle) => {
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
    const regexUsername = /^[a-z0-9-]{4,16}$/i
    const regexPassword = /^.{9,100}$/
    const errors = []

    //
    if(username === '') {
        errors.push('Please fill in a username')
    }
    else if(!regexUsername.test(username)) {
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
