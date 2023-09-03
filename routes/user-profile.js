
//
const express = require('express')
const db = require('../db')
const myMisc = require('../misc.js')

const router = express.Router()
//const htmlTitleNewPost = 'New Post'

//
const get = async (req, res) => {

    const username = "Jon23"
    const profileText = "fkasjd fksjdf ksjdf kasjdf ksdjf ksadjf kasdjf kasdjf ksadjf ksadjf ksdfj fkasjd fksjdf ksjdf kasjdf ksdjf ksadjf kasdjf kasdjf ksadjf ksadjf ksdfj fkasjd fksjdf ksjdf kasjdf ksdjf ksadjf kasdjf kasdjf ksadjf ksadjf ksdfj fkasjd fksjdf ksjdf kasjdf ksdjf ksadjf kasdjf kasdjf ksadjf ksadjf ksdfj fkasjd fksjdf ksjdf kasjdf ksdjf ksadjf kasdjf kasdjf ksadjf ksadjf ksdfj fkasjd fksjdf ksjdf kasjdf ksdjf ksadjf kasdjf kasdjf ksadjf ksadjf ksdfj"

    return res.render(
        'user-profile',
        {
            html_title: "username",
            user: req.session.user,
            max_width: myMisc.getCurrSiteMaxWidth(req),
            username: username,
            profile_text: profileText,
        }
    )
}

//
router.get('/', get)
module.exports = router
