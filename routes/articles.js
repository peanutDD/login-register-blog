const express = require('express');
const { check, validationResult } = require('express-validator/check');

let router = express.Router()
let Article = require('../models/articles')
let User = require('../models/user')

router.get('/new', ensureAuthenticated, function (req, res) {
  res.render('articles/new', {
    title: 'Add Article'
  });
})

router.get('/:id', function (req, res) {
  Article.findById(req.params.id, function (err, article) {
    User.findById(article.author, function (err, user) {
      res.render('articles/show', {
        article: article,
        author: user.name
      })
      console.log(user)

    })
  })
})

router.get('/:id/edit', ensureAuthenticated, function (req, res) {
  Article.findById(req.params.id, function (err, article) {
    if (article.author != req.user._id) {

      req.flash('danger', 'Not Authorized')
      return res.redirect('/');
    }
    res.render('articles/edit', {
      title: 'Edit Article',
      article: article
    })
  })
})

router.post('/create', [
  // username must be an email
  check('title').isLength({min: 1}).withMessage('Title is required'),
  check('body').isLength({min: 1}).withMessage('body is required'),
  // password must be at least 5 chars long
  // check('password').isLength({ min: 5 })
], function (req, res) {

  // Finds the validation errors in this request and wraps them in an object with handy functions
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors.array());
    res.render('articles/new', {
      title: 'add article',
      errors: errors.array()
    })
  } else {

    let article = new Article(req.body);
    /**
     *
     *!mongodb出现多余字段“ __v”: 0
     * todo 简单说这个字段用来在 save 文档时作为一个查询条件， 以免在从「 取出数据」 到「 save 数据」 这段时间里， 数据被其他进程修改， 导致最后修改出现冲突。
     */
    console.log(req.user)
    article.author = req.user._id
    article.save(function (err) {
      if (err) {
        console.log(err);
        return;
      } else {
        req.flash("success", "Article Added");
        res.redirect('/')
      }
    })
  }
})

router.post('/update/:id', function (req, res) {
  let query = {
    _id: req.params.id
  }

  Article.update(query, req.body, function (err) {
    if (err) {
      console.log(err);
      return;
    } else {
      res.redirect('/')
    }
  })
})

router.delete('/:id', function (req, res) {
  if (!req.user._id) {
    res.status(500).send()
  }
  let query = {
    _id: req.params.id
  };

  Article.findById(req.params.id, function (err, article) {
    if (article.author != req.user._id) {
      res.status(500).send()
    } else {
      Article.remove(query, function (err) {
        if (err) {
          console.log(err);
        }
        res.send('Success');
      })
    }
  })
})

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    console.log(66666)
    return next();
  } else {
    req.flash('danger', 'Please login')
    res.redirect('/users/login')
  }
}
module.exports = router;