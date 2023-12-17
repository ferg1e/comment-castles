const express = require('express')
const db = require('../db')
const myMisc = require('../src/util/misc.js')
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
                renderHtml(req, res, [], privateGroup.private_group_id)
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

                    // start delete member
                    const isDeleteMember = typeof req.body.deleteid !== 'undefined'

                    if(isDeleteMember) {
                        await db.deleteGroupMember(
                            privateGroup.private_group_id,
                            req.body.deleteid)

                        return res.redirect(`/settings/group?name=${req.query.name}`)
                    }
                    // end delete member

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
                        if(submittedUser.user_id == req.session.user.user_id) {
                            errors.push({msg: "You don't need to add yourself"})
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
                        renderHtml(req, res, errors, privateGroup.private_group_id)
                    }
                    else {
                        await db.createGroupMember(
                            privateGroup.private_group_id,
                            submittedUser.user_id)

                        renderHtml(
                            req,
                            res,
                            [],
                            privateGroup.private_group_id,
                            "User successfully added to private group")
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

//
async function renderHtml(req, res, errors, privateGroupId, success) {
    const {rows:groupMembers} = await db.getGroupMembers(privateGroupId)

    //
    res.render(
        'my-settings-group',
        {
            html_title: htmlTitle,
            user: req.session.user,
            max_width: myMisc.getCurrSiteMaxWidth(req),
            errors: errors,
            success: success,
            group_members: groupMembers
        })
}
