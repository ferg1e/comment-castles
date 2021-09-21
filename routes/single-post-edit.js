const express = require('express')
const {body, validationResult} = require('express-validator')
const db = require('../db')
const myMisc = require('../misc.js')

const router = express.Router({mergeParams: true})
const htmlTitleEditPost = 'Edit Post'

router.route('/')
    .get(async (req, res) => {
        if(req.session.user) {

            //
            const postPublicId = req.params[0]
            const {rows} = await db.getPostWithPublic(postPublicId)

            //
            if(!rows.length) {
                return res.send('unknown post...')
            }

            //
            if(rows[0].user_id != req.session.user.user_id) {
                return res.send('wrong user...')
            }

            //
            res.render(
                'new-post2',
                {
                    html_title: htmlTitleEditPost,
                    user: req.session.user,
                    errors: [],
                    title: rows[0].title,
                    link: rows[0].link === null ? '' : rows[0].link,
                    textContent: rows[0].text_content,
                    tags: rows[0].tags.join(', '),
                    submitLabel: 'Edit Post',
                    heading: 'Edit Post',
                    max_width: myMisc.getCurrSiteMaxWidth(req)
                })
        }
        else {
            res.send('sorry...')
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

                //
                const postPublicId = req.params[0]
                const {rows} = await db.getPostWithPublic(postPublicId)

                //
                if(!rows.length) {
                    return res.send('unknown post...')
                }

                //
                if(rows[0].user_id != req.session.user.user_id) {
                    return res.send('wrong user...')
                }

                let errors = validationResult(req).array({onlyFirstError:true})

                //
                let [wsCompressedTitle, error] = myMisc.processPostTitle(req.body.title)

                if(error !== null) {
                    errors.push(error)
                }

                //
                let [trimTags, tagErrors] = myMisc.processPostTags(req.body.tags)
                errors = errors.concat(tagErrors)

                // start private group check
                const existingPrivateGroups = rows[0].private_group_names
                const editedPrivateGroups = []

                if(trimTags.length) {
                    const {rows:dataGroups} = await db.getPrivateGroupsWithNames(trimTags)

                    for(let i = 0; i < dataGroups.length; ++i) {
                        editedPrivateGroups.push(dataGroups[i].name)
                    }
                }

                //make sure private groups are unchanged
                //check that the lengths are equal
                //and check that one is a subset of the other
                const isPrivateGroupsSame =
                    existingPrivateGroups.length == editedPrivateGroups.length &&
                    existingPrivateGroups.every(v => editedPrivateGroups.includes(v))

                if(!isPrivateGroupsSame) {
                    errors.push({msg: "You cannot edit private groups"})
                }
                // end private group check

                //
                if(errors.length) {
                    res.render(
                        'new-post2',
                        {
                            html_title: htmlTitleEditPost,
                            user: req.session.user,
                            errors: errors,
                            title: req.body.title,
                            link: (typeof req.body.link !== 'undefined' ? req.body.link : ''),
                            textContent: req.body.text_content,
                            tags: req.body.tags,
                            submitLabel: 'Edit Post',
                            heading: 'Edit Post',
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

                    await db.updatePost(
                        rows[0].post_id,
                        wsCompressedTitle,
                        req.body.text_content,
                        req.body.link,
                        domainNameId)

                    // delete tags for this post
                    await db.deletePostTags(rows[0].post_id)

                    //
                    await db.createPostTags(trimTags, rows[0].post_id)
                    
                    //
                    return res.redirect('/p/' + postPublicId)
                }
            }
            else {
                res.send('nope...')
            }
        }
    )

module.exports = router
