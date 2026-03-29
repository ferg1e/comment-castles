const express = require('express')

//
const router = express.Router()

// get all posts
router.get('/posts', require('./api-get-posts'))

// get all posts in a sub
router.get('/sub/posts', require('./api-get-sub-posts'))

// get, create, edit and delete a single post
router.get('/post', require('./api-get-post'))
router.post('/post', require('./api-post-post'))
router.put('/post', require('./api-put-post'))
router.delete('/post', require('./api-delete-post'))

// get, create, edit and delete a single comment
router.get('/comment', require('./api-get-comment'))
router.post('/comment', require('./api-post-comment'))
router.put('/comment', require('./api-put-comment'))
router.delete('/comment', require('./api-delete-comment'))

//
module.exports = router
