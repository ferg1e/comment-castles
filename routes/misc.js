const express = require('express')
const myMisc = require('../misc.js')
const config = require('../config')

const router = express.Router()

// every request
function sharedAllHandler(req, res, next) {

    //
    if(parseInt(process.env.IS_PROD) === 1) {
        let host = req.headers.host;

        if(!host.match(/^www\..*/i)) {
            return res.redirect(301, req.protocol + '://www.' + host + req.originalUrl)
        }
    }

    next()
}

router.route('*')
    .get(sharedAllHandler)
    .post(sharedAllHandler)

router.route('/manual')
    .get((req, res) => {
        res.render(
            'instruction-manual',
            {
                html_title: 'Manual',
                user: req.session.user,
                max_width: myMisc.getCurrSiteMaxWidth(req),
                default_site_width: config.defaultSiteWidth,
                min_site_width: config.minSiteWidth,
                max_site_width: config.maxSiteWidth,
                default_ppp: config.defaultPostsPerPage,
                min_ppp: config.minPostsPerPage,
                max_ppp: config.maxPostsPerPage,
            })
    })

router.route('/privacy-policy')
    .get((req, res) => {
        res.render(
            'privacy-policy',
            {
                html_title: 'Privacy Policy',
                user: req.session.user,
                max_width: myMisc.getCurrSiteMaxWidth(req)
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
                contact_email: config.contactEmail
            })
    })

router.route('/api')
    .get((req, res) => {
        res.render(
            'api',
            {
                html_title: 'API',
                user: req.session.user,
                max_width: myMisc.getCurrSiteMaxWidth(req)
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
