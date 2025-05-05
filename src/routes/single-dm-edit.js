const express = require('express')
const db = require('../db')
const myMisc = require('../util/misc.js')

const router = express.Router({mergeParams: true})
const htmlTitle = 'Edit DM'

router.route('/')
    .get(async (req, res) => {
            
        //
        if(!req.session.user) {
            res.send('sorry...')
        }

        //
        const dmPublicId = req.params[0]
        const {rows:[row]} = await db.getDmWithPublic(dmPublicId)

        //
        if(!row) {
            return res.send('unknown dm...')
        }

        //
        if(row.from_user_id != req.session.user.user_id) {
            return res.send('wrong user...')
        }

        //
        res.render(
            'edit-dm',
            {
                html_title: htmlTitle,
                user: req.session.user,
                errors: [],
                message: row.dmessage,
                max_width: myMisc.getCurrSiteMaxWidth(req)
            })
    })
    .post(async (req, res) => {
        
        //
        if(!req.session.user) {
            res.send('sorry...')
        }

        //
        const dmPublicId = req.params[0]
        const {rows:[row]} = await db.getDmWithPublic(dmPublicId)

        //
        if(!row) {
            return res.send('unknown dm...')
        }

        //
        if(row.from_user_id != req.session.user.user_id) {
            return res.send('wrong user...')
        }

        //
        const [compressedMessage, messageErrors] = myMisc.processDm(req.body.message)

        //
        if(messageErrors.length > 0) {
            return res.render(
                'edit-dm',
                {
                    html_title: htmlTitle,
                    user: req.session.user,
                    errors: messageErrors,
                    message: req.body.message,
                    max_width: myMisc.getCurrSiteMaxWidth(req)
                })
        }

        //
        await db.updateDm(
            row.dm_id,
            compressedMessage)

        //redirect to DMs for this user pair
        const {rows:[toUser]} = await db.getUserWithUserId(row.to_user_id)
        return res.redirect('/dms/' + toUser.public_id)
    })

module.exports = router
