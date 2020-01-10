const express = require('express')
const path = require('path')
const activeRouter = require('./routes/active')

const app = express()
const server = app.listen(7007)

app.set('view engine', 'pug')
app.set('views', path.join(__dirname, 'views'))

app.use(express.static(path.join(
    __dirname,
    'public')))

app.use(express.urlencoded({extended:false}))
app.use('/', activeRouter)
app.locals.pretty = true
