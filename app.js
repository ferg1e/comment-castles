
//
require('dotenv').config()

//
const express = require('express')
const path = require('path')
const cookieParser = require('cookie-parser')
const uuid = require('uuid/v4')
const session = require('express-session')
const redisStore = require('connect-redis')(session)
const redis = require('redis')
const config = require('./config')

//
const redisClient = redis.createClient(process.env.REDIS_PORT)
const app = express()
const server = app.listen(process.env.HTTP_PORT)

//
app.locals.siteName = config.siteName
app.locals.defaultUsername = config.eyesDefaultUsername
app.locals.commentsPerPage = config.commentsPerPage
app.locals.siteBaseUrl = config.siteBaseUrl
app.locals.apiBaseUrl = config.apiBaseUrl
app.locals.jsDir = config.jsDir
app.locals.cssDir = config.cssDir

//
app.set('view engine', 'pug')
app.set('views', path.join(__dirname, 'views'))

//TODO: use more options to increase cookie/session security
app.use(session({
    genid: req => uuid(),
    name: process.env.SESSION_NAME,
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: new redisStore({ host: "localhost", port: process.env.REDIS_PORT, client: redisClient })
    })
)

//
app.use(express.static(path.join(
    __dirname,
    'public')))

//
app.use(express.urlencoded({extended:false}))
app.use(cookieParser())

//
app.use('/', require('./routes/misc'))
app.use('/', require('./routes/home'))
app.use('/settings/', require('./routes/user-settings'))
app.use('/settings/username/', require('./routes/user-settings-username'))
app.use('/settings/profile/', require('./routes/user-settings-profile'))
app.use('/settings/groups/', require('./routes/user-settings-groups'))
app.use('/settings/group/', require('./routes/user-settings-group'))
app.use('/settings/app-ids/', require('./routes/user-settings-app-ids'))
app.use('/settings/app-id/', require('./routes/user-settings-app-id'))
app.use('/sign-up/', require('./routes/sign-up'))
app.use('/login/', require('./routes/login'))
app.use('/new/', require('./routes/new-post'))
app.use(/^\/p\/([a-z0-9]{22})$/i, require('./routes/display-single-post'))
app.use(/^\/p\/([a-z0-9]{22})\/edit$/i, require('./routes/single-post-edit'))
app.use(/^\/p\/([a-z0-9]{22})\/delete$/i, require('./routes/single-post-delete'))
app.use(/^\/c\/([a-z0-9]{22})$/i, require('./routes/single-comment-display'))
app.use(/^\/c\/([a-z0-9]{22})\/edit$/i, require('./routes/single-comment-edit'))
app.use(/^\/c\/([a-z0-9]{22})\/delete$/i, require('./routes/single-comment-delete'))
app.use(/^\/u\/([a-z0-9]{22})$/i, require('./routes/user-profile'))
app.use('/following/', require('./routes/following'))
app.use(/^\/r\/([a-z0-9-]{3,20})$/, require('./routes/group-posts'))
app.use('/inbox/', require('./routes/inbox'))
app.use('/api/v1/', require('./routes/api'))
app.use('/api/ajax/', require('./routes/ajax'))
app.use('/oauth/', require('./routes/oauth'))
