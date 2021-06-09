
//
exports.getCurrTimeZone = (req) => {
    let timeZone = undefined

    if(req.session.user) {
        timeZone = req.session.user.time_zone
    }
    else {
        timeZone = req.cookies.time_zone
    }

    //
    if(typeof timeZone === 'undefined') {
        timeZone = 'UTC'
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
