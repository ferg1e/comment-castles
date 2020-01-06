var express = require('express');
var multer = require('multer');

var router = express.Router();
var upload = multer({
    dest: 'C:/Users/Ry/my-node/my-exp2/my-files/'
});


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post(
    '/',
    upload.single('myfile'),
    function(req, res, next) {
        console.log(req.body);
        console.log(req.file);
        console.log(req.files);
        res.render('index-post');
    });

module.exports = router;
