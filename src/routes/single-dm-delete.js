const express = require('express')
const db = require('../db')
const myMisc = require('../util/misc.js')

const router = express.Router({mergeParams: true})
const htmlTitle = 'Delete DM'

router.route('/')
    .get(async (req, res) => {

        //
        if(!req.session.user) {
            return res.send('sorry...')
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
            'delete-dm',
            {
                html_title: htmlTitle,
                user: req.session.user,
                message: row.dmessage,
                max_width: myMisc.getCurrSiteMaxWidth(req)
            })
    })
    .post(async (req, res) => {
            
        //
        if(!req.session.user) {
            return res.send('sorry...')
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

        await db.deleteDm(row.dm_id)
        
        return res.render(
            'message',
            {
                html_title: htmlTitle,
                message: "The DM was successfully deleted.",
                user: req.session.user,
                max_width: myMisc.getCurrSiteMaxWidth(req)
            })
    })

module.exports = router
