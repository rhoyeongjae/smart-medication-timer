const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");

const router = express.Router();

router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      message: "모든 항목을 입력해 주세요.",
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      message: "비밀번호는 8자 이상이어야 합니다.",
    });
  }

  try {
    const [existing] = await db
      .promise()
      .execute("SELECT id FROM users WHERE email = ?", [
        email.trim().toLowerCase(),
      ]);

    if (existing.length > 0) {
      return res.status(409).json({
        message: "이미 가입된 이메일입니다.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10); // 사용자가 입력한 비밀번호를 해시처리 후 저장

    await db
      .promise()
      .execute(
        "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
        [name.trim(), email.trim().toLowerCase(), hashedPassword],
      );

    res.status(201).json({
      message: "회원가입이 완료되었습니다.",
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      message: "회원가입에 실패했습니다.",
    });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "이메일과 비밀번호를 입력해 주세요.",
    });
  }

  try {
    const [users] = await db
      .promise()
      .execute("SELECT * FROM users WHERE email = ?", [
        email.trim().toLowerCase(),
      ]);

    if (users.length === 0) {
      return res.status(401).json({
        message: "이메일 또는 비밀번호가 올바르지 않습니다.",
      });
    }

    const user = users[0];

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({
        message: "이메일 또는 비밀번호가 올바르지 않습니다.",
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      },
    );

    res.json({
      message: "로그인 성공.",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      message: "로그인에 실패했습니다.",
    });
  }
});

module.exports = router;
