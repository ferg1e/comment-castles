const express = require('express')
const myMisc = require('../util/misc.js')
const config = require('../config')
const db = require('../db')

const router = express.Router()

// every request
async function sharedAllHandler(req, res, next) {

    //todo: probably want to put this no www redirect in nginx/apache
    if(parseInt(process.env.IS_PROD) === 1) {
        let host = req.headers.host;

        if(!host.match(/^www\..*/i)) {
            return res.redirect(301, req.protocol + '://www.' + host + req.originalUrl)
        }
    }

    //
    const theme = myMisc.getCurrTheme(req)
    myMisc.setTheme(theme, req)

    //
    if(req.session.user) {
        const {rows:[row]} = await db.getUserDmCountTotal(req.session.user.user_id)
        req.app.locals.dmTotal = row.total
    }

    //
    next()
}

router.route('*')
    .get(sharedAllHandler)
    .post(sharedAllHandler)

router.route('/help')
    .get((req, res) => {
        res.render(
            'instruction-manual',
            {
                html_title: 'Help',
                user: req.session.user,
                max_width: myMisc.getCurrSiteMaxWidth(req),
                default_site_width: config.defaultSiteWidth,
                min_site_width: config.minSiteWidth,
                max_site_width: config.maxSiteWidth,
                default_ppp: config.defaultPostsPerPage,
                min_ppp: config.minPostsPerPage,
                max_ppp: config.maxPostsPerPage,
                default_pvs: config.defaultPostsVerticalSpacing,
                min_pvs: config.minPostsVerticalSpacing,
                max_pvs: config.maxPostsVerticalSpacing,
                main_class: 'main-text'
            })
    })

router.route('/privacy-policy')
    .get((req, res) => {
        res.render(
            'privacy-policy',
            {
                html_title: 'Privacy Policy',
                user: req.session.user,
                max_width: myMisc.getCurrSiteMaxWidth(req),
                main_class: 'main-text'
            })
    })

router.route('/contact-us')
    .get((req, res) => {
        res.render(
            'contact-us',
            {
                html_title: 'Contact Us',
                user: req.session.user,
                max_width: myMisc.getCurrSiteMaxWidth(req),
                contact_email: config.contactEmail,
                main_class: 'main-text'
            })
    })

router.route('/api')
    .get((req, res) => {
        res.render(
            'api',
            {
                html_title: 'API',
                user: req.session.user,
                max_width: myMisc.getCurrSiteMaxWidth(req),
                main_class: 'main-text'
            })
    })

router.get(
    '/logout',
    (req, res) => {
        req.session.destroy()
        res.redirect('/')
    }
)

module.exports = router
