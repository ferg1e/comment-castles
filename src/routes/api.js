const express = require('express')

//
const router = express.Router()

//
router.get('/posts', require('./api-get-posts'))

//
router.get('/sub/posts', require('./api-get-sub-posts'))

//
router.get('/post', require('./api-get-post'))

//
router.post('/post', require('./api-post-post'))

// edit post
router.put('/post', require('./api-put-post'))

// delete post
router.delete('/post', require('./api-delete-post'))

//
router.get('/comment', require('./api-get-comment'))

//
router.post('/comment', require('./api-post-comment'))

// edit comment
router.put('/comment', require('./api-put-comment'))

// delete comment
router.delete('/comment', require('./api-delete-comment'))

//
module.exports = router
