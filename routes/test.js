const express = require('express')

const router = express.Router()

router.use((req, res, next) => {
    console.log('MW...')
    next()
})

router.get(
    '/',
    function(req, res) {
        console.log('test route root')
        res.send('test route root')
    })

router.get(
    '/a',
    (req, res) => {
        res.send('"a" test route')
    }
)

module.exports = router
