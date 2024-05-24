
//
require('dotenv').config()

//
const express = require('express')
const path = require('path')
const cookieParser = require('cookie-parser')
const {v4:uuid} = require('uuid')
const session = require('express-session')
const redisStore = require('connect-redis')(session)
const redis = require('redis')
const config = require('./src/config')

//
const redisClient = redis.createClient(process.env.REDIS_PORT)
const app = express()
const server = app.listen(process.env.HTTP_PORT)

//
app.locals.siteName = config.siteName
app.locals.commentsPerPage = config.commentsPerPage
app.locals.siteBaseUrl = config.siteBaseUrl
app.locals.apiBaseUrl = config.apiBaseUrl
app.locals.jsDir = config.jsDir
app.locals.cssDir = config.cssDir
app.locals.adminUserId = config.adminUserId

//
app.set('view engine', 'pug')
app.set('views', path.join(__dirname, 'src/views'))

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
app.use('/', require('./src/routes/misc'))
app.use('/', require('./src/routes/home'))
app.use('/settings/', require('./src/routes/user-settings'))
app.use('/settings/username/', require('./src/routes/user-settings-username'))
app.use('/settings/profile/', require('./src/routes/user-settings-profile'))
app.use('/settings/app-ids/', require('./src/routes/user-settings-app-ids'))
app.use('/settings/app-id/', require('./src/routes/user-settings-app-id'))
app.use('/sign-up/', require('./src/routes/sign-up'))
app.use('/login/', require('./src/routes/login'))
app.use('/new/', require('./src/routes/new-post'))
app.use(/^\/p\/([a-z0-9]{22})$/i, require('./src/routes/display-single-post'))
app.use(/^\/p\/([a-z0-9]{22})\/edit$/i, require('./src/routes/single-post-edit'))
app.use(/^\/p\/([a-z0-9]{22})\/delete$/i, require('./src/routes/single-post-delete'))
app.use(/^\/c\/([a-z0-9]{22})$/i, require('./src/routes/single-comment-display'))
app.use(/^\/c\/([a-z0-9]{22})\/edit$/i, require('./src/routes/single-comment-edit'))
app.use(/^\/c\/([a-z0-9]{22})\/delete$/i, require('./src/routes/single-comment-delete'))
app.use(/^\/u\/([a-z0-9]{22})$/i, require('./src/routes/user-profile'))
app.use(/^\/r\/([a-z0-9-]{3,20})$/, require('./src/routes/group-posts'))
app.use(/^\/r\/([a-z0-9-]{3,20})\/settings$/, require('./src/routes/castle-settings'))
app.use(/^\/r\/([a-z0-9-]{3,20})\/about$/, require('./src/routes/castle-about'))
app.use('/inbox/', require('./src/routes/inbox'))
app.use('/dms/', require('./src/routes/dms'))
app.use(/^\/dms\/([a-z0-9]{22})$/i, require('./src/routes/dms-pair'))
app.use('/api/v1/', require('./src/routes/api'))
app.use('/api/ajax/', require('./src/routes/ajax'))
app.use('/oauth/', require('./src/routes/oauth'))
