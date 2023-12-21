const express = require('express')
const db = require('../db')
const myMisc = require('../util/misc.js')
const config = require('../config')

//
const router = express.Router()

//
const get = async (req, res) => {

    //
    const isFollow = typeof req.query.follow !== 'undefined'
    const isFollowed = typeof req.query.followed !== 'undefined'
    const isUnfollow = typeof req.query.unfollow !== 'undefined'
    const isUnfollowed = typeof req.query.unfollowed !== 'undefined'

    //
    if(!req.session.user) {

        //
        if(isFollow) {
            return res.redirect(`/sign-up?follow=${req.query.follow}`)
        }

        //
        if(isUnfollow) {
            return res.redirect(`/sign-up?unfollow=${req.query.unfollow}`)
        }

        //
        return res.render(
            'message',
            {
                html_title: 'Following',
                message: "<a href=\"/login\">Log in</a> to view the following page.",
                user: req.session.user,
                max_width: myMisc.getCurrSiteMaxWidth(req)
            })
    }

    //
    if(isUnfollow) {
        const userPublicId = req.query.unfollow
        const {rows:[user]} = await db.getUserWithPublicId(userPublicId)

        //
        if(!user) {
            return renderFollowing(req, res,
                [{msg: 'No such user'}],
                '')
        }

        //
        const {rows:[followee]} = await db.getUserFollowee(
            req.session.user.user_id,
            user.user_id
        )

        if(!followee) {
            return renderFollowing(req, res,
                [{msg: 'You are not following that user'}],
                '')
        }

        //
        await db.removeFollower(
            req.session.user.user_id,
            user.user_id
        )

        const redirectUrl = (typeof req.query.goto == 'undefined')
            ? `/following?unfollowed=${user.username}`
            : req.query.goto;

        return res.redirect(redirectUrl)
    }
    else if(isFollow) {
        const userPublicId = req.query.follow
        const {rows:[user]} = await db.getUserWithPublicId(userPublicId)

        //
        if(!user) {
            return renderFollowing(req, res,
                [{msg: 'No such user'}],
                '')
        }

        //
        if(req.session.user.user_id == user.user_id) {
            return renderFollowing(req, res,
                [{msg: 'You don\'t need to follow yourself'}],
                user.username)
        }

        //
        const {rows:[followee]} = await db.getUserFollowee(
            req.session.user.user_id,
            user.user_id
        )

        //
        if(followee) {
            return renderFollowing(req, res,
                [{msg: 'You are already following that user'}],
                user.username)
        }

        //
        await db.addFollower(
            req.session.user.user_id,
            user.user_id
        )

        const redirectUrl = (typeof req.query.goto === 'undefined')
            ? `/following?followed=${user.username}`
            : req.query.goto;

        return res.redirect(redirectUrl)
    }
    else if(isFollowed) {

        //TODO: should probably check if
        //username exists and is followed by
        //logged in user

        return renderFollowing(req, res,
            [{msg: `You followed ${req.query.followed}`}],
            '')
    }
    else if(isUnfollowed) {

        //TODO: should probably check if
        //username exists and is not followed by
        //logged in user

        return renderFollowing(req, res,
            [{msg: `You unfollowed ${req.query.unfollowed}`}],
            '')
    }

    //
    renderFollowing(req, res, [], '')
}

//
const post = async (req, res) => {

    //
    if(!req.session.user) {
        return res.send('permission denied...')
    }

    //
    if(req.body.uall === '1') {
        await db.unfollowAll(req.session.user.user_id)
        return res.redirect('/following')
    }

    //
    if(req.body.call === '1') {
        await db.unfollowAll(req.session.user.user_id)
        await db.copyAdminsFollowees(req.session.user.user_id)
        return res.redirect('/following')
    }

    //
    const errors = []

    //
    if(req.body.username === '') {
        errors.push({msg: 'Please fill in a username'})
    }

    //
    if(errors.length > 0) {
        return renderFollowing(req, res, errors, req.body.username)
    }

    //
    const {rows:[user]} = await db.getUserWithUsername(req.body.username)

    //
    if(!user) {
        return renderFollowing(req, res,
            [{msg: 'No such user'}], req.body.username)
    }

    //
    if(req.session.user.user_id == user.user_id) {
        return renderFollowing(req, res,
            [{msg: 'You don\'t need to follow yourself'}],
            req.body.username)
    }

    //
    const {rows:[followee]} = await db.getUserFollowee(
        req.session.user.user_id,
        user.user_id
    )

    //
    if(followee) {
        return renderFollowing(req, res,
            [{msg: 'You are already following that user'}],
            req.body.username)
    }

    //
    await db.addFollower(
        req.session.user.user_id,
        user.user_id
    )

    return res.redirect('/following')
}

//
router.get('/', get)
router.post('/', post)
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
            max_width: myMisc.getCurrSiteMaxWidth(req),
            admin_username: config.adminUsername,
        }
    )
}
