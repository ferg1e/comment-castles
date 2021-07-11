const express = require('express')
const argon2 = require('argon2')
const db = require('../db')
const myMisc = require('../misc.js')
const config = require('../config')

const router = express.Router()
const regexUsername = /^[a-z0-9-]{4,16}$/i
const htmlTitleSettings = 'Settings'
const htmlTitleSettingsUsername = 'Settings / Username'
const cookieMaxAge = 1000*60*60*24*365*10;

router.route('/')
    .get(async (req, res) => {

        //
        const isViewMode = typeof req.query.viewmode !== 'undefined'

        if(isViewMode) {
            let viewMode = req.query.viewmode == 'discover'
                ? req.query.viewmode
                : 'following-only'

            //
            if(req.session.user) {
                await db.updateUserViewMode(
                    req.session.user.user_id,
                    viewMode)

                req.session.user.post_mode = viewMode
            }
            else {
                res.cookie(
                    'post_mode',
                    viewMode,
                    {maxAge: cookieMaxAge})
            }

            //
            const redirectUrl = (typeof req.query.goto === 'undefined')
                ? '/settings'
                : req.query.goto;

            return res.redirect(redirectUrl)
        }

        //
        const {rows} = await db.getTimeZones()
        const {rows:avaEyes} = await db.getAvailableEyes()
        const currEyes = await getCurrEyes(req)

        res.render(
            'my-settings',
            {
                html_title: htmlTitleSettings,
                errors: [],
                user: req.session.user,
                time_zones: rows,
                time_zone: myMisc.getCurrTimeZone(req),
                avaEyes: avaEyes,
                currEyes: currEyes,
                postMode: myMisc.getCurrPostMode(req),
                commentReplyMode: myMisc.getCurrCommentReplyMode(req),
                siteWidth: myMisc.getCurrSiteMaxWidth(req),
                max_width: myMisc.getCurrSiteMaxWidth(req)
            })
    })
    .post(async (req, res) => {
        
        //
        const {rows} = await db.getTimeZoneWithName(req.body.time_zone)

        //
        let eyesOkay = true
        let eyesValue = null

        //
        if(req.body.eyes !== "") {
            const {rows:eyesLookup} = await db.getUserWithUsername(req.body.eyes)

            if(eyesLookup.length && eyesLookup[0].is_eyes) {
                eyesValue = eyesLookup[0].user_id
            }
            else {
                eyesOkay = false
            }
        }

        //
        let errors = []

        if(!rows.length) {
            errors.push({msg: 'unknown time zone, pick again'})
        }

        if(!eyesOkay) {
            errors.push({msg: 'bad following list'})
        }

        const siteWidthInt = parseInt(req.body.site_width)
        const wisNaN = isNaN(siteWidthInt)
        const widthOkay = (req.body.site_width === '') ||
            (!wisNaN && siteWidthInt >= 500 && siteWidthInt <= 1000)

        if(!widthOkay) {
            errors.push({msg: 'site width must be between 500-1000, or left blank'})
        }

        //
        const {rows:rows2} = await db.getTimeZones()
        const {rows:avaEyes} = await db.getAvailableEyes()
        const currEyes = req.body.eyes

        //
        if(errors.length) {
            res.render(
                'my-settings',
                {
                    html_title: htmlTitleSettings,
                    errors: errors,
                    user: req.session.user,
                    time_zones: rows2,
                    time_zone: req.body.time_zone,
                    avaEyes: avaEyes,
                    currEyes: currEyes,
                    postMode: req.body.post_mode,
                    commentReplyMode: req.body.comment_reply_mode,
                    siteWidth: req.body.site_width,
                    max_width: myMisc.getCurrSiteMaxWidth(req)
                })
        }
        else {
            if(req.session.user) {
                await db.updateUser(
                    req.session.user.user_id,
                    req.body.time_zone,
                    req.body.post_mode,
                    req.body.comment_reply_mode,
                    req.body.site_width,
                    eyesValue)

                req.session.user.time_zone = req.body.time_zone
                req.session.user.post_mode = req.body.post_mode
                req.session.user.comment_reply_mode = req.body.comment_reply_mode
                req.session.user.site_width = (req.body.site_width === '')
                    ? null
                    : parseInt(req.body.site_width);
                
                req.session.user.eyes = eyesValue
            }
            else {
                res.cookie(
                    'time_zone',
                    req.body.time_zone,
                    {maxAge: cookieMaxAge})

                res.cookie(
                    'eyes',
                    req.body.eyes,
                    {maxAge: cookieMaxAge})

                res.cookie(
                    'post_mode',
                    req.body.post_mode,
                    {maxAge: cookieMaxAge})

                res.cookie(
                    'comment_mode',
                    req.body.comment_mode,
                    {maxAge: cookieMaxAge})

                res.cookie(
                    'site_width',
                    req.body.site_width,
                    {maxAge: cookieMaxAge})
            }

            res.render(
                'my-settings',
                {
                    html_title: htmlTitleSettings,
                    errors: [{msg: 'Settings successfully saved.'}],
                    user: req.session.user,
                    time_zones: rows2,
                    time_zone: req.body.time_zone,
                    avaEyes: avaEyes,
                    currEyes: currEyes,
                    postMode: req.body.post_mode,
                    commentReplyMode: req.body.comment_reply_mode,
                    siteWidth: req.body.site_width,
                    max_width: req.body.site_width === '' ? null : parseInt(req.body.site_width)
                })
        }
    })

//
router.route('/username')
    .get(async (req, res) => {

        //
        if(!req.session.user) {
            return res.redirect('/settings')
        }

        //
        res.render(
            'my-settings-username',
            {
                html_title: htmlTitleSettingsUsername,
                user: req.session.user,
                max_width: myMisc.getCurrSiteMaxWidth(req),
                errors: [],
                username: req.session.user.username
            })
    })
    .post(async (req, res) => {

        if(req.session.user) {

            //
            const errors = []
            const username = req.body.username

            //
            if(!username.match(regexUsername)) {
                errors.push({msg: "Username must be 4-16 characters(letters, numbers and dashes only)"})
            }
            else {
                const {rows} = await db.getUserWithUsername(username)

                if(rows.length && rows[0].user_id != req.session.user.user_id) {
                    errors.push({msg: "username already taken"})
                }
            }

            //
            const {rows:rows2} = await db.getUserWithUserId(req.session.user.user_id)
            const isCorrectPassword = await argon2.verify(rows2[0].password, req.body.password)

            if(!isCorrectPassword) {
                errors.push({msg: "incorrect existing password"})
            }

            //
            if(errors.length) {
                res.render(
                    'my-settings-username',
                    {
                        html_title: htmlTitleSettingsUsername,
                        user: req.session.user,
                        max_width: myMisc.getCurrSiteMaxWidth(req),
                        errors: errors,
                        username: username
                    })
            }
            else {

                //
                await db.updateUserUsername(req.session.user.user_id, username)
                req.session.user.username = username

                //
                res.render(
                    'my-settings-username',
                    {
                        html_title: htmlTitleSettingsUsername,
                        user: req.session.user,
                        max_width: myMisc.getCurrSiteMaxWidth(req),
                        errors: [{'msg': 'Username successfully saved'}],
                        username: username
                    })
            }
        }
        else {
            res.send('nope...')
        }
    })

module.exports = router

//
async function getCurrEyes(req) {
    let eyes = ''

    if(req.session.user && req.session.user.eyes) {
        const {rows} = await db.getUserWithUserId(req.session.user.eyes)
        eyes = rows[0].username
    }
    else if(!req.session.user) {
        eyes = typeof req.cookies.eyes !== 'undefined'
            ? req.cookies.eyes
            : config.eyesDefaultUsername
    }

    return eyes
}
