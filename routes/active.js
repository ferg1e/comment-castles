const express = require('express')
const {body, validationResult} = require('express-validator')

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
    (req, res) => {
        let errors = validationResult(req).array({onlyFirstError:true})

        if(errors.length) {
            res.render(
                'sign-up',
                {title:"Sign Up Form", errors:errors})
        }
        else {
            res.send('no errors')
        }
    }
)

module.exports = router
