const express = require('express')
const {body, validationResult} = require('express-validator')
const db = require('../db')
const myMisc = require('../util/misc.js')

const router = express.Router()
const regexUsername = /^[a-z0-9-]{4,16}$/i
const htmlTitleSignUp = 'Sign Up'

const get = async (req, res) => {

    //
    if(req.session.user) {
        return myMisc.renderMessage(req, res, htmlTitleSignUp,
            "You already signed up. If you want to create another account then please <a href=\"/logout\">log out</a>.")
    }

    //
    return res.render(
        'sign-up',
        {
            html_title: htmlTitleSignUp,
            errors:[],
            username: "",
            is_login: "yes",
            max_width: myMisc.getCurrSiteMaxWidth(req)
        }
    )
}

const post = async(req, res) => {

    //
    const errors = validationResult(req).array({onlyFirstError:true})

    //
    if(errors.length > 0) {
        return res.render(
            'sign-up',
            {
                html_title: htmlTitleSignUp,
                errors: errors,
                username: req.body.username,
                is_login: req.body.is_login,
                max_width: myMisc.getCurrSiteMaxWidth(req)
            }
        )
    }

    //
    const {username, password} = req.body

    try {
        var {rows:[newUser]} = await db.createUser(username, password)
    }
    catch(err) {
        console.log(err)
        const errorMessage = (err.constraint == 'username_unique_idx')
            ? `"${username}" already taken`
            : 'unknown error, please try again'
        
        //
        return res.render(
            'sign-up',
            {
                html_title: htmlTitleSignUp,
                errors:[{msg:errorMessage}],
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
    return myMisc.renderMessage(req, res, htmlTitleSignUp,
        "Sign up was successful, you can now <a href=\"/login\">log in</a>.")
}

//
router.get('/', get)

router.post(
    '/',
    body('username', 'Username must be 4-16 characters (letters, numbers and dashes only)')
        .notEmpty().withMessage('Please fill in a username')
        .matches(regexUsername),
    body('password', 'Password must be 9-100 characters')
        .notEmpty().withMessage('Please fill in a password')
        .matches(/^.{9,100}$/),
    post)

module.exports = router
