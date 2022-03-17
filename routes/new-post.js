const config = require('../config')
const express = require('express')
const {body, validationResult} = require('express-validator')
const db = require('../db')
const myMisc = require('../misc.js')

const router = express.Router()
const htmlTitleNewPost = 'New Post'

router.route('/')
    .get(async (req, res) => {
        if(req.session.user) {

            //
            const tags = (typeof req.query.group !== 'undefined')
                ? req.query.group
                : "";

            //
            res.render(
                'new-post2',
                {
                    html_title: htmlTitleNewPost,
                    user: req.session.user,
                    errors: [],
                    title: "",
                    link: "",
                    textContent: "",
                    tags: tags,
                    submitLabel: 'Create Post',
                    heading: 'New Post',
                    max_width: myMisc.getCurrSiteMaxWidth(req)
                })
        }
        else {
            res.render(
                'message',
                {
                    html_title: htmlTitleNewPost,
                    message: "Please <a href=\"/login\">log in</a> to create a post.",
                    user: req.session.user,
                    max_width: myMisc.getCurrSiteMaxWidth(req)
                })
        }
    })
    .post(
        (req, res, next) => {

            //remove if blank so it doesn't trigger the validator
            if(req.body.link === '') {
                req.body.link = undefined
            }
    
            next()
        },
        body('text_content', 'Please write some content').optional(),
        body('link', 'link must be an http or https URL')
            .optional()
            .isURL({protocols:['http', 'https'], require_protocol:true}),
        async (req, res) => {
            if(req.session.user) {
                let errors = validationResult(req).array({onlyFirstError:true})

                //
                let [wsCompressedTitle, error] = myMisc.processPostTitle(req.body.title)

                if(error !== null) {
                    errors.push(error)
                }

                //
                let [trimTags, tagErrors] = myMisc.processPostTags(req.body.tags)
                errors = errors.concat(tagErrors)

                // check private group permissions
                if(!errors.length && trimTags.length) {
                    const {rows:privateGroups} = await db.getPrivateGroupsWithNames(trimTags)

                    for(let i = 0; i < privateGroups.length; ++i) {
                        const pGroup = privateGroups[i]

                        if(req.session.user.user_id == pGroup.created_by) {
                            continue
                        }

                        const {rows:gMember} = await db.getGroupMember(
                            pGroup.private_group_id,
                            req.session.user.user_id)

                        if(!gMember.length) {
                            errors.push({msg: "You used a private group you don't have access to"})
                            break
                        }
                    }
                }

                // actions
                if(!errors.length) {
                    const isAction = trimTags.indexOf('action') != -1
                    
                    if(isAction) {
                        let actionType = null

                        for(let i = 0; i < config.validActions.length; ++i) {
                            const action = config.validActions[i]

                            if(trimTags.indexOf(action) != -1) {
                                actionType = action
                                break
                            }
                        }

                        if(actionType != null) {
                            if(actionType == 'new-node') {

                                if(trimTags.length != 3) {
                                    errors.push({msg: "The new-node action uses three groups."})
                                }
                                else {
                                    const filterTags = trimTags.filter(v => ['action', 'new-node'].indexOf(v) == -1)
                                    const nodeUrl = filterTags[0]

                                    // regex is partially copied from bbCodes.pug
                                    const urlRegex = /(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|]/ig
                                    const isValidUrl = urlRegex.test(nodeUrl)

                                    if(isValidUrl) {
                                        console.log('new-node url is valid, request url')
                                    }
                                    else {
                                        errors.push({msg: "Invalid URL for new node action"})
                                    }
                                }
                            }
                        }
                        else {
                            errors.push({msg: "Unknown action"})
                        }
                    }
                }

                //
                if(errors.length) {
                    res.render(
                        'new-post2',
                        {
                            html_title: htmlTitleNewPost,
                            user: req.session.user,
                            errors: errors,
                            title: req.body.title,
                            link: (typeof req.body.link !== 'undefined' ? req.body.link : ''),
                            textContent: req.body.text_content,
                            tags: req.body.tags,
                            submitLabel: 'Create Post',
                            heading: 'New Post',
                            max_width: myMisc.getCurrSiteMaxWidth(req)
                        })
                }
                else {

                    //
                    let domainNameId = null

                    if(typeof req.body.link !== 'undefined') {
                        const domainName = myMisc.getDomainName(req.body.link)
                        domainNameId = await db.getDomainNameId(domainName)
                    }

                    //
                    let vals = db.createPost(
                        req.session.user.user_id,
                        wsCompressedTitle,
                        req.body.text_content,
                        req.body.link,
                        domainNameId)
    
                    const {rows} = await vals[0]

                    //
                    await db.createPostTags(trimTags, rows[0].post_id)
                    
                    //
                    return res.redirect('/p/' + vals[1])
                }
            }
            else {
                res.send('nope...')
            }
        }
    )

module.exports = router
