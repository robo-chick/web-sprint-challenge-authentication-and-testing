const router = require('express').Router();
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken");
const Users = require("./auth-model")

router.post('/register', async (req, res, next) => {
  // implement registration
  try {
    const { username, password } = req.body
    const user = await Users.getBy({ username }).first()

    if (user) {
      return res.status(409).json({
        message: "Username is already taken",
      })
    }
    const newUser = await Users.add({
      username,
      password: await bcrypt.hash(password, 14)
    })

    res.status(201).json(newUser)
  } catch (err) {
    next(err)
  }
});

router.post('/login', async (req, res, next) => {
  // implement login
  try {
    const { username, password } = req.body
    const user = await Users.getBy({ username }).first()

    if (!user) {
      return res.status(401).json({
        message: "Invalid credentials",
      })
    }

    const validPass = await bcrypt.compare(password, user.password)

    if (!validPass) {
      return res.status(401).json({
        message: "Invalid credentials"
      })
    }

    const payload = {
      userId: user.id,
      username: user.username
    }

    res.json({
      userID: user.id,
      message: `Welcome ${user.username}`,
      token: jwt.sign(payload, process.env.JWT_SECRET || "secret")
    })
  } catch (err) {
    next(err)
  }
});

router.get("/logout", (req, res, next) => {
  try {
    res.json({
      message: "You have been successfully logged out",
    })
  } catch(err) {
    next(err)
  }
})

module.exports = router;
