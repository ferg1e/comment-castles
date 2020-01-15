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
            {
                title:'Express',
                user: req.session.user})
    })

router.get(
    '/sign-up',
    (req, res) => {
        if(req.session.user) {
            res.render(
                'message',
                {
                    title: 'Sign Up Form',
                    message: "You already signed up." +
                        " If you want to create another account then please log out.",
                    user: req.session.user
                })
        }
        else {
            res.render(
                'sign-up',
                {
                    title:"Sign Up Form",
                    errors:[]
                })
        }
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
        if(req.session.user) {
            res.render(
                'message',
                {
                    title: 'Login Form',
                    message: "You're already logged in." +
                        " If you want to log in with a different account then please log out.",
                    user: req.session.user
                })
        }
        else {
            res.render(
                'login',
                {title:"Login Form", errors:[]})
        }
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
                    req.session.user = {
                        user_id: rows[0].user_id,
                        username: rows[0].username
                    }

                    res.redirect('/')
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

router.get(
    '/logout',
    (req, res) => {
        req.session.destroy()
        res.redirect('/')
    }
)

router.get(
    '/create-group',
    (req, res) => {
        const title = 'Create Group'

        if(req.session.user) {
            res.render(
                'create-group',
                {
                    title: title,
                    errors: [],
                    user: req.session.user
                })
        }
        else {
            res.render(
                'message',
                {
                    title: title,
                    message: "Please log in if you want to create a group."
                })
        }
    }
)

router.post(
    '/create-group',
    body('name', 'Name must be 3-36 characters(letters, numbers and dashes only)')
        .notEmpty().withMessage('Please fill in a name')
        .matches(/^[a-z0-9-]{3,36}$/i),
    async (req, res) => {
        const errors = validationResult(req).array({onlyFirstError:true})

        if(errors.length) {
            res.render(
                'create-group',
                {
                    title: "Create Group",
                    errors: errors,
                    user: req.session.user
                })
        }
        else {
            let name = req.body.name
            const {rows} = await db.getGroupWithName(name)

            if(rows.length) {
                res.render(
                    'create-group',
                    {
                        title: "Create Group",
                        errors: [{msg:`"${name}" has already been created`}],
                        user: req.session.user
                    })
            }
            else {
                await db.createGroup(
                    req.session.user.user_id,
                    name)
                
                res.render(
                    'message',
                    {
                        title: 'Create Group',
                        message: "new group successfully created",
                        user: req.session.user
                    })
            }
        }
    }
)

router.get(
    /^\/g\/([a-z0-9-]{3,36})$/i,
    async (req, res) => {
        const groupName = req.params[0]
        const {rows} = await db.getGroupWithName(groupName)
        
        if(rows.length) {
            res.send('found!')
        }
        else {
            res.send("this group doesn't exist yet, create it")
        }
    }
)

router.get(
    '/groups',
    async (req, res) => {
        const {rows} = await db.getGroups()

        res.render(
            'groups',
            {
                groups: rows,
                user: req.session.user
            })
    }
)

module.exports = router
