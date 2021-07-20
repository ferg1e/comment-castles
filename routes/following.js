const express = require('express')
const db = require('../db')
const myMisc = require('../misc.js')

const router = express.Router()

router.route('/')
    .get(async (req, res) => {

        //
        const isFollow = typeof req.query.follow !== 'undefined'
        const isFollowed = typeof req.query.followed !== 'undefined'
        const isUnfollow = typeof req.query.unfollow !== 'undefined'
        const isUnfollowed = typeof req.query.unfollowed !== 'undefined'

        if(req.session.user) {

            if(isUnfollow) {
                const userPublicId = req.query.unfollow
                const {rows} = await db.getUserWithPublicId(userPublicId)

                if(rows.length) {

                    //
                    const username = rows[0].username

                    //
                    const {rows:rows2} = await db.getUserFollowee(
                        req.session.user.user_id,
                        rows[0].user_id
                    )

                    //
                    if(rows2.length) {
                        await db.removeFollower(
                            req.session.user.user_id,
                            rows[0].user_id
                        )

                        const redirectUrl = (typeof req.query.goto === 'undefined')
                                ? `/following?unfollowed=${username}`
                                : req.query.goto;

                        return res.redirect(redirectUrl)
                    }
                    else {
                        renderFollowing(req, res,
                            [{msg: 'You are not following that user'}],
                            '')
                    }
                }
                else {
                    renderFollowing(req, res,
                        [{msg: 'No such user'}],
                        '')
                }
            }
            else if(isFollow) {
                const userPublicId = req.query.follow
                const {rows} = await db.getUserWithPublicId(userPublicId)

                if(rows.length) {

                    //
                    const username = rows[0].username

                    //
                    if(req.session.user.user_id == rows[0].user_id) {
                        renderFollowing(req, res,
                            [{msg: 'You don\'t need to follow yourself'}],
                            username)
                    }
                    else {
                        //
                        const {rows:rows2} = await db.getUserFollowee(
                            req.session.user.user_id,
                            rows[0].user_id
                        )

                        //
                        if(rows2.length) {
                            renderFollowing(req, res,
                                [{msg: 'You are already following that user'}],
                                username)
                        }
                        else {
                            await db.addFollower(
                                req.session.user.user_id,
                                rows[0].user_id
                            )

                            const redirectUrl = (typeof req.query.goto === 'undefined')
                                ? `/following?followed=${username}`
                                : req.query.goto;

                            return res.redirect(redirectUrl)
                        }
                    }
                }
                else {
                    renderFollowing(req, res,
                        [{msg: 'No such user'}],
                        '')
                }
            }
            else if(isFollowed) {

                //TODO: should probably check if
                //username exists and is followed by
                //logged in user

                renderFollowing(req, res,
                    [{msg: `You followed ${req.query.followed}`}],
                    '')
            }
            else if(isUnfollowed) {

                //TODO: should probably check if
                //username exists and is not followed by
                //logged in user

                renderFollowing(req, res,
                    [{msg: `You unfollowed ${req.query.unfollowed}`}],
                    '')
            }
            else {
                renderFollowing(req, res, [], '')
            }
        }
        else {
            res.redirect('/sign-up')
        }
    })
    .post(async (req, res) => {
        if(req.session.user) {

            //
            let errors = []

            if(req.body.username === '') {
                errors.push({msg: 'Please fill in a username'})
            }

            //
            if(errors.length) {
                renderFollowing(req, res, errors, req.body.username)
            }
            else {
                const {rows} = await db.getUserWithUsername(req.body.username)

                if(rows.length) {

                    if(req.session.user.user_id == rows[0].user_id) {
                        renderFollowing(req, res,
                            [{msg: 'You don\'t need to follow yourself'}],
                            req.body.username)
                    }
                    else {
                        //
                        const {rows:rows2} = await db.getUserFollowee(
                            req.session.user.user_id,
                            rows[0].user_id
                        )

                        //
                        if(rows2.length) {
                            renderFollowing(req, res,
                                [{msg: 'You are already following that user'}],
                                req.body.username)
                        }
                        else {
                            await db.addFollower(
                                req.session.user.user_id,
                                rows[0].user_id
                            )

                            return res.redirect('/following')
                        }
                    }
                }
                else {
                    renderFollowing(req, res, [{msg: 'No such user'}], req.body.username)
                }
            }
        }
        else {
            res.send('permission denied...')
        }
    })

module.exports = router

//
async function renderFollowing(req, res, errors, formUsername) {
    const {rows} = await db.getUserFollowees(req.session.user.user_id)

    //
    res.render(
        'following',
        {
            html_title: 'Following',
            errors: errors,
            user: req.session.user,
            followees: rows,
            formUsername: formUsername,
            max_width: myMisc.getCurrSiteMaxWidth(req)
        }
    )
}
