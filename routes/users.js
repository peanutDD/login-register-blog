const express = require('express');
const { check, validationResult } = require('express-validator/check');
const bcrypt = require('bcrypt')
const passport = require('passport');
const chalk = require('chalk');


/*=============================================
=            -S chalk s-            =
=============================================*/




/**
 *
 * TODO: chalk 用法
 *
 */


const log = console.log;

// Combine styled and normal strings
log(chalk.blue('Hello') + 'World' + chalk.red('!'));

// Compose multiple styles using the chainable API
log(chalk.blue.bgRed.bold('Hello world!'));

// Pass in multiple arguments
log(chalk.blue('Hello', 'World!', 'Foo', 'bar', 'biz', 'baz'));

// Nest styles
log(chalk.red('Hello', chalk.underline.bgBlue('world') + '!'));

// Nest styles of the same type even (color, underline, background)
log(chalk.green(
    'I am a green line ' +
    chalk.blue.underline.bold('with a blue substring') +
    ' that becomes green again!'
));

// ES2015 template literal
log(`
CPU: ${chalk.red('90%')}
RAM: ${chalk.green('40%')}
DISK: ${chalk.yellow('70%')}
`);

// ES2015 tagged template literal
// log(chalk`
// CPU: {red ${cpu.totalPercent}%}
// RAM: {green ${ram.used / ram.total * 100}%}
// DISK: {rgb(255,131,0) ${disk.used / disk.total * 100}%}
// `);

// Use RGB colors in terminal emulators that support it.
log(chalk.keyword('orange')('Yay for orange colored text!'));
log(chalk.rgb(123, 45, 67).underline('Underlined reddish color'));
log(chalk.hex('#DEADED').bold('Bold gray!'));


/*=====  End of chalk  ======*/



let router = express.Router()
let User = require('../models/user')

router.get('/register', function (req, res) {
  res.render('users/register')
})

router.post('/register', [
  check('name').isLength({min: 1}).withMessage('name is required'),
  check('username').isLength({min: 1}).withMessage('username is required'),
  check('email').isLength({min: 1}).withMessage('email is required'),
  check('email').isEmail({min: 1}).withMessage('email is invalid'),
  check("password", "invalid password").isLength({ min: 1 })
    .custom((value,{req, loc, path}) => {
        if (value !== req.body.confirmpassword) {
            // trow error if passwords do not match
            throw new Error("Passwords don't match");
        } else {
            return value;
        }
    })
], function (req, res) {
  // Finds the validation errors in this request and wraps them in an object with handy functions
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.render('users/register', {
      errors: errors.array()
    })
  } else {
    let user = new User(req.body);

    bcrypt.genSalt(10, function (err, salt) {
      bcrypt.hash(user.password, salt, function (err, hash) {
        // Store hash in your password DB.
        if (err) {
          console.log(err);
          return;
        } else {
          /**
           *
           *!mongodb出现多余字段“ __v”: 0
           * todo 简单说这个字段用来在 save 文档时作为一个查询条件， 以免在从「 取出数据」 到「 save 数据」 这段时间里， 数据被其他进程修改， 导致最后修改出现冲突。
           */

          user.password = hash
          user.save(function (err) {
            if (err) {
              console.log(err);
              return;
            } else {
              req.flash("success", "You are now registered and can log in");
              res.redirect('/users/login')
            }
          })
        }
      });
    });
  }
})

router.get('/login', function (req, res) {
  res.render('users/login')
})

router.post('/login', function (req, res, next) {
  passport.authenticate('local', { successRedirect: '/', failureRedirect: '/users/login', failureFlash: true, successFlash: 'Welcome!' })(req, res, next)
})

router.get('/logout', function(req, res){
  req.logout()
  req.flash('success', 'You are logged out!')
  res.redirect('/users/login')
})


module.exports = router;