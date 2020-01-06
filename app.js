const express = require('express')
const path = require('path')
const testRouter = require('./routes/test')

const app = express()
const server = app.listen(7007)

app.set('view engine', 'pug')
app.set('views', path.join(__dirname, 'views'))

app.get(
    '/',
    (req, res) => {
        //res.send("this is not working...iii8")
        res.render(
            'index',
            {title:'Express'})

        console.log(req.query)
    })

app.use(express.static(path.join(
    __dirname,
    'public')))

app.use('/test', testRouter)
