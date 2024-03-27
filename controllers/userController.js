const nodemailer = require("nodemailer");
const mongoose = require("mongoose");
const User = require("../model/userModel");
const userVerfication = require("../model/userVericatiaonModel");
const PasswordReset = require("../model/passwordRestModel");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");
const asyncHandler = require("express-async-handler");

const path = require("path");
// console.log(User);
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.AUTH_EMAIL,
    pass: process.env.AUTH_PASS,
  },
});
transporter.verify((err, success) => {
  if (err) {
    res
      .status(400)
      .json({ status: "Invlaid", messgage: "transporter verification error" });
  } else {
    console.log(success, ": transporter Verification");
  }
});

const signupUser = (req, res, next) => {
  const { name, email, password, dob } = req.body;
  if (!email || !name || !password || !dob) {
    res.status(400).json({ message: "All fields are mandotory" });
  }
  //   FINDING EMAIL
  User.find({ email })

    .then((result) => {
      if (result.length >= 1) {
        res.status(400).json({ message: "User ALready Login" });
      } else {
        bcrypt
          .hash(password, 10)
          .then((result) => {
            const user = new User({
              name,
              email,
              dob,
              password: result,
              verified: false,
            });
            user
              .save()
              .then((result) => {
                // res.status(200).json();
                sendVerification(result, res);

                // console.log(res);
              })
              .catch((err) => {
                res.status(400).json({ message: "User not saved" });
              });
          })
          .catch((err) => {
            res.status(400).json({ message: "password not Bycrypted" });
          });
      }
    })
    .catch((err) => {
      res.status(400).json({ message: "error occured in finding email" });
    });
};
const sendVerification = ({ email, _id }, res) => {
  const URL = "http://localhost:5001";
  const uniqueString = uuidv4() + _id;
  const mailoption = {
    from: process.env.AUTH_EMAIL,
    to: email,
    subject: "Verfiy your email",
    html: `   <p>this is your verification email.&#160&#160 </p>
        <p> this link will <b>expires in 6hrs</b></p>
        <p>press<a href=${
          // URL + "/verified"
          URL + "/user/verify/" + _id + "/" + uniqueString
        }>here</a>
        to Proceed</p>`,
  };
  bcrypt
    .hash(uniqueString, 10)
    .then((hashUniqueString) => {
      // console.log("hash"+hashUniqueString);
      const newVerfication = new userVerfication({
        userId: _id,
        uniqueString: hashUniqueString,
        createdAt: Date.now(),
        expiresAt: Date.now() + 21600000,
      });
      newVerfication
        .save()
        .then((result) => {
          transporter
            .sendMail(mailoption)
            .then((result) => {
              // console.log(result);
              res
                .status(200)
                .json({ statsu: "PENDING", message: "MAIL SEND " });
            })
            .catch((err) => {
              res.status(400).json({ message: "erro in mail option " });
            });
        })
        .catch((err) => {
          res.status(400).json({ message: "userVerfication didn't saved" });
        });
    })
    .catch((err) => {
      res.status(400).json({ message: "error occured in Unique String" });
    });
};
const getUser = (req, res) => {
  const { userId, uniqueString } = req.params;
  console.log(userId);
  userVerfication
    .find({ userId })
    .then((result) => {
      // console.log("find result0:" + result);
      if (result.length > 0) {
        const { expiresAt } = result[0];
        const hashUniqueString = result[0].uniqueString;
        bcrypt
          .compare(uniqueString, hashUniqueString)
          .then((result) => {
            console.log(result);
            if (result) {
              // res.sendFile(path.join(__dirname, "../views/verified.html"));
              User.updateOne({ _id: userId }, { verified: true })
                .then((result) => {
                  console.log(result);
                  res.sendFile(path.join(__dirname, "../views/verified.html"));
                  // res.status(200).json({ message: "good" });
                })
                .catch((err) => {
                  const message = "cannot be updated users";
                  res.redirect(`/user/verified/error=true&message=${message}`);
                });
            } else {
              const message = "cannot be hashed is false";
              res.redirect(`/user/verified/error=true&message=${message}`);
            }
          })
          .catch((err) => {
            const message = "cannot be hashed the uniqueString";
            res.redirect(`/user/verified/error=true&message=${message}`);
          });
      } else {
        const message = "url is not worked";
        res.redirect(`/user/verified/error=true&message=${message}`);
      }
    })
    .catch((err) => {
      const message = "user Id cannot be find";
      res.redirect(`/user/verified/error=true&message=${message}`);
    });
};
const loginUser = (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ message: "All fields are mandotory" });
  }
  User.find({ email })
    .then((result) => {
      //   console.log(result[0]);
      //   console.log(result);
      // const user = result;
      bcrypt.compare(password, result[0].password, (err, users) => {
        // console.log(users);
        if (err) {
          return res.status(400).json({ message: "Auth failed" });
        }
        if (users) {
          res.status(200).json({ message: "Got it" });
        } else {
          return res.status(400).json({ message: "passwrod  failed" });
        }
      });
    })
    .catch((err) => {
      res.status(400).json({ message: "Email not found " });
    });
};
const verifiedUser = (req, res) => {
  console.log(__dirname);

  res.sendFile(path.join(__dirname, "../views/verified.html"));
  // res.status(200).json({ message: "good" });
};
//PASSWORD REST STUFF
const passwordReset = (req, res) => {
  const { email, redirectUrl } = req.body;
  // data
  User.find({ email })
    .then((result) => {
      // console.log(result);
      if (result.length) {
        if (!result[0].verified) {
          res
            .status(400)
            .json({ status: "INVALID", message: "the user verified is false" });
        } else {
          //proceed with email to reset the password
          sendResetEmail(result[0], redirectUrl, res);
        }
      } else {
        res
          .status(400)
          .json({ status: "INVALID", message: "Cannot find the Email" });
      }
    })
    .catch((err) => {
      console.log(err);
      res
        .status(400)
        .json({ status: "INVALID", message: "Email Hasn't not be verfified" });
    });
};
//send password reset email
const sendResetEmail = ({ _id, email }, redirectUrl, res) => {
  const resetString = uuidv4() + _id;
  PasswordReset.deleteMany({ userId: _id })

    .then((result) => {
      console.log(result);
      const mailoption = {
        from: process.env.AUTH_EMAIL,
        to: email,
        subject: "Rest password your email",
        html: `   <p>this is your reset  email password </p>
          <p> this link will <b>expires in 6hrs</b></p>
          <p>press<a href=${
            // URL + "/verified"
            redirectUrl + "/" + _id + "/" + resetString
          }>here</a>
          to Proceed</p>`,
      };
      bcrypt
        .hash(resetString, 10)
        .then((hashedtSring) => {
          const newPaswwordReset = new PasswordReset({
            userId: _id,
            resetString: hashedtSring,
            createdAt: Date.now(),
            expiresAt: Date.now() + 3600000,
          });
          newPaswwordReset
            .save()
            .then((result) => {
              transporter
                .sendMail(mailoption)
                .then((result) => {
                  res.status(200).json({
                    status: "PENDING",
                    message: "mAIL SENT",
                  });
                })
                .catch((err) => {
                  res.status(400).json({
                    status: "INVALID",
                    message: "Can't send the mail ",
                  });
                });
            })
            .catch((err) => {
              res.status(400).json({
                status: "INVALID",
                message: "passwrd reset model can't be saved",
              });
            });
        })
        .catch((err) => {
          res.status(400).json({
            status: "INVALID",
            message: "Cannot hash while reset the password",
          });
        });
    })
    .catch((err) => {
      res
        .status(400)
        .json({ status: "INVALID", message: "Cannot find the Email" });
    });
};
//ACTUALLY RESET THE PASSWORD
const resetPassword = (req, res) => {
  const { userId, resetString, newPassword } = req.body;
  PasswordReset.find({ userId })
    .then((result) => {
      if (result.length > 0) {
        const hashedtSring = result[0].resetString;
        bcrypt
          .compare(resetString, hashedtSring)
          .then((result) => {
            if (result) {
              bcrypt
                .hash(newPassword, 10)
                .then((hashedNewPassword) => {
                  User.updateOne(
                    { _id: userId },
                    { password: hashedNewPassword }
                  )
                    .then((result) => {
                      PasswordReset.deleteOne({ userId })
                        .then((result) => {
                          res.status(200).json({
                            status: "sucess",
                            message: "password reset successfully",
                          });
                        })
                        .catch((err) => {
                          res.status(400).json({
                            status: "INVALID",
                            message: "password reset cant be deleted",
                          });
                        });
                    })
                    .catch((err) => {
                      res.status(400).json({
                        status: "INVALID",
                        message: "can't update new password",
                      });
                    });
                })
                .catch((err) => {
                  console.log(err);
                  res.status(400).json({
                    status: "INVALID",
                    message: "the newpassword cannot be hashed",
                  });
                });
            } else {
              res.status(400).json({
                status: "INVALID",
                message: "result in bcrypt cant be hashed",
              });
            }
          })
          .catch((err) => {
            res.status(400).json({
              status: "INVALID",
              message: "can't be hashed in google",
            });
          });
      } else {
        res.status(400).json({
          status: "INVALID",
          message: "there is no userId in the result",
        });
      }
    })
    .catch((err) => {
      res.status(400).json({
        status: "INVALID",
        message: "UserId can't find",
      });
    });
};
module.exports = {
  signupUser,
  loginUser,
  getUser,
  verifiedUser,
  passwordReset,
  resetPassword,
};
