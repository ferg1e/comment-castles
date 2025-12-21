const express = require('express')
const argon2 = require('argon2')
const db = require('../db')
const myMisc = require('../util/misc.js')

const router = express.Router()
const htmlTitleLogin = 'Log In'

//
const get = (req, res) => {
    if(req.session.user) {
        return res.render(
            'message',
            {
                html_title: htmlTitleLogin,
                message: "You're already logged in." +
                    " If you want to log in with a different account then please log out.",
                user: req.session.user,
                max_width: myMisc.getCurrSiteMaxWidth(req)
            })
    }

    //
    return res.render(
        'login',
        {
            html_title: htmlTitleLogin,
            errors:[],
            max_width: myMisc.getCurrSiteMaxWidth(req)
        })
}

//
const post = async (req, res) => {
    let errors = []
    const {rows} = await db.getUserWithUsername(req.body.username)

    if(rows.length) {
        try {
            if(await argon2.verify(rows[0].password, req.body.password)) {
                req.session.user = rows[0]
                delete req.session.user.password

                //
                const redirectUrl = (typeof req.query.rurl === 'undefined')
                    ? '/'
                    : req.query.rurl

                return res.redirect(redirectUrl)
            }
            else {
                errors.push('Invalid username and password')
            }
        }
        catch(err) {
            errors.push('Unknown error, please try it again')
        }
    }
    else {
        errors.push('Invalid username and password')
    }

    res.render(
        'login',
        {
            html_title: htmlTitleLogin,
            errors:errors,
            max_width: myMisc.getCurrSiteMaxWidth(req)
        })
}

//
router.get('/', get)
router.post('/', post)
module.exports = router
