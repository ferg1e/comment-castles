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
