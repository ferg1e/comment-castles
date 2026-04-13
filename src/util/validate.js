const myMisc = require('./misc')
const db = require('../db')

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
    let [wsCompressedTitle, error] = myMisc.processPostTitle(title)

    if(error !== null) {
        errors.push(error)
    }

    //
    const [trimCastle, castleErrors] = myMisc.processPostCastle(castle)
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
