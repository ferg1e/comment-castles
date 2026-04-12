const express = require('express')
const db = require('../db')
const myMisc = require('../util/misc.js')
const {render403, renderMessage} = require('../util/render')
const {validateSignUp} = require('../util/validate')

const htmlTitle = 'Sign Up'

const get = async (req, res) => {

    //
    if(req.session.user) {
        return render403(res,
            `You already signed up. ` +
            `If you want to create another account ` +
            `then please <a href="/logout">log out</a>. ` +
            `Or <a href="/">return to the home page</a>.`)
    }

    //
    return res.render('sign-up', {
        html_title: htmlTitle,
        errors:[],
        username: "",
        is_login: "yes",
        max_width: myMisc.getCurrSiteMaxWidth(req)
    })
}

const post = async (req, res) => {

    //
    const errors = validateSignUp(req.body.username, req.body.password)

    //
    if(errors.length > 0) {
        return res.render('sign-up', {
            html_title: htmlTitle,
            errors: errors,
            username: req.body.username,
            is_login: req.body.is_login,
            max_width: myMisc.getCurrSiteMaxWidth(req)
        })
    }

    //
    const {username, password} = req.body

    try {
        var {rows:[newUser]} = await db.createUser(username, password)
    }
    catch(err) {
        const errorMessage = (err.constraint == 'username_unique_idx')
            ? `"${username}" already taken`
            : 'unknown error, please try again'
        
        //
        return res.render('sign-up', {
            html_title: htmlTitle,
            errors:[errorMessage],
            username: req.body.username,
            is_login: req.body.is_login,
            max_width: myMisc.getCurrSiteMaxWidth(req)
        })
    }

    //
    if(req.body.is_login === 'yes') {
        req.session.user = newUser
        return res.redirect('/')
    }

    //
    return renderMessage(req, res, htmlTitle,
        "Sign up was successful, you can now <a href=\"/login\">log in</a>.",
        "main-text")
}

//
const router = express.Router()
router.get('/', get)
router.post('/', post)
module.exports = router
