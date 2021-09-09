const express = require('express')
const db = require('../db')
const myMisc = require('../misc.js')
const router = express.Router()
const htmlTitle = 'Settings / Group'

router.route('/')
    .get(async (req, res) => {

        //
        if(!req.session.user) {
            return res.redirect('/settings')
        }

        //
        const {rows:data1} = await db.getPrivateGroupWithName(req.query.name)

        //
        if(data1.length) {

            //
            const privateGroup = data1[0]

            if(privateGroup.created_by == req.session.user.user_id) {

                //
                const {rows:groupMembers} = await db.getGroupMembers(privateGroup.private_group_id)

                //
                res.render(
                    'my-settings-group',
                    {
                        html_title: htmlTitle,
                        user: req.session.user,
                        max_width: myMisc.getCurrSiteMaxWidth(req),
                        errors: [],
                        group_members: groupMembers
                    })
            }
            else {
                res.send('hello...')
            }
        }
        else {
            res.send('private group does not exist')
        }
    })
    .post(async (req, res) => {

        //
        if(req.session.user) {

            //
            const {rows:data1} = await db.getPrivateGroupWithName(req.query.name)

            //
            if(data1.length) {

                //
                const privateGroup = data1[0]

                if(privateGroup.created_by == req.session.user.user_id) {

                    //
                    const errors = []
                    let submittedUser = null

                    if(req.body.user === '') {
                        errors.push({msg: 'Please fill in a username'})
                    }

                    //
                    if(!errors.length) {
                        const {rows:data2} = await db.getUserWithUsername(req.body.user)

                        if(!data2.length) {
                            errors.push({msg: 'No such user'})
                        }
                        else {
                            submittedUser = data2[0]
                        }
                    }

                    //
                    if(!errors.length) {
                        const {rows:data3} = await db.getGroupMember(
                            privateGroup.private_group_id,
                            submittedUser.user_id)

                        if(data3.length) {
                            errors.push({msg: 'User is already a member'})
                        }
                    }

                    //
                    if(errors.length) {
                        const {rows:groupMembers} = await db.getGroupMembers(privateGroup.private_group_id)

                        res.render(
                            'my-settings-group',
                            {
                                html_title: htmlTitle,
                                user: req.session.user,
                                max_width: myMisc.getCurrSiteMaxWidth(req),
                                errors: errors,
                                group_members: groupMembers
                            })
                    }
                    else {
                        await db.createGroupMember(
                            privateGroup.private_group_id,
                            submittedUser.user_id)

                        res.send('good..')
                    }
                }
                else {
                    res.send('hello...')
                }
            }
            else {
                res.send('private group does not exist')
            }
        }
        else {
            res.send('please log in')
        }
    })

module.exports = router
