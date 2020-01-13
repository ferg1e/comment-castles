const express = require('express')
const argon2 = require('argon2')
const {body, validationResult} = require('express-validator')
const db = require('../db')

const router = express.Router()

router.get(
    '/',
    function(req, res) {
        res.render(
            'index',
            {title:'Express'})
    })

router.get(
    '/sign-up',
    (req, res) => {
        res.render(
            'sign-up',
            {title:"Sign Up Form", errors:[]})
    }
)

router.post(
    '/sign-up',
    body('username', 'Username must be 4-16 characters(letters, numbers and dashes only)')
        .notEmpty().withMessage('Please fill in a username')
        .matches(/^[a-z0-9-]{4,16}$/i),
    body('password', 'Password must be 13-100 characters')
        .notEmpty().withMessage('Please fill in a password')
        .matches(/^.{13,100}$/),
    async (req, res) => {
        let errors = validationResult(req).array({onlyFirstError:true})

        if(errors.length) {
            res.render(
                'sign-up',
                {title:"Sign Up Form", errors:errors})
        }
        else {
            const {username, password} = req.body

            try {
                await db.createUser(username, password)
            }
            catch(err) {
                let errorMessage = (err.constraint == 'tuser_username_key')
                    ? `"${username}" already taken`
                    : 'unknown error, please try again'
                
                //
                res.render(
                    'sign-up',
                    {title:"Sign Up Form", errors:[
                        {msg:errorMessage}
                    ]})
            }

            res.send('create successful')
        }
    }
)

router.get(
    '/login',
    (req, res) => {
        res.render(
            'login',
            {title:"Login Form", errors:[]})
    }
)

router.post(
    '/login',
    async (req, res) => {
        let errors = []
        const {rows} = await db.getUserWithUsername(req.body.username)

        if(rows.length) {
            try {
                if(await argon2.verify(rows[0].password, req.body.password)) {
                    res.send('login success, redirect to home...')
                }
                else {
                    errors.push('Invalid username and password')
                }
            }
            catch(err) {
                errors.push('Unknown error, please try it again')
            }
        }
        else {
            errors.push('Invalid username and password')
        }

        res.render(
            'login',
            {title:"Login Form", errors:errors})
    }
)

module.exports = router
