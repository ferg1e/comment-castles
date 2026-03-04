const express = require('express')
const argon2 = require('argon2')
const db = require('../db')
const myMisc = require('../util/misc.js')

const router = express.Router()
const htmlTitle = 'Log In'

//
const get = (req, res) => {

    //
    if(req.session.user) {
        return res.status(403).render('http-error-403', {
            message: `You cannot log in because ` +
                `you are already logged in. ` +
                `If you want to log in as a different user ` +
                `then please <a href="/logout">log out</a>. ` +
                `Or <a href="/">return to the home page</a>.`
        })
    }

    //
    return res.render(
        'login',
        {
            html_title: htmlTitle,
            errors:[],
            max_width: myMisc.getCurrSiteMaxWidth(req)
        })
}

//
const post = async (req, res) => {
    const errors = []
    const {rows:[dbUser]} = await db.getUserWithUsername(req.body.username)

    if(dbUser) {
        try {
            if(await argon2.verify(dbUser.password, req.body.password)) {
                req.session.user = dbUser
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
            html_title: htmlTitle,
            errors:errors,
            max_width: myMisc.getCurrSiteMaxWidth(req)
        })
}

//
router.get('/', get)
router.post('/', post)
module.exports = router
