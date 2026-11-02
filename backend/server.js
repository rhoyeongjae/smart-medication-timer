const express = require("express");
const cors = require("cors");
const db = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("스마트 복약 체크 타이머 서버 실행 중");
});

// 약 목록 가져오기
app.get("/api/medications", (req, res) => {
  const sql = `
        SELECT
            medications.id,
            medications.name,
            medications.created_at,
            medication_schedules.id AS schedule_id,
            medication_schedules.time
        FROM medications
        LEFT JOIN medication_schedules
        ON medications.id = medication_schedules.medication_id
        ORDER BY medications.id DESC
    `;

  db.query(sql, (err, results) => {
    if (err) {
      console.log(err);
      res.status(500).json({
        message: "약 목록을 불러오지 못했습니다.",
      });
      return;
    }

    res.json(results);
  });
});

// 약 등록하기
app.post("/api/medications", (req, res) => {
  const name = req.body.name;
  const time = req.body.time;

  if (!name || !time) {
    res.status(400).json({
      message: "약 이름과 복용 시간을 입력해 주세요.",
    });
    return;
  }

  const sql = "INSERT INTO medications (name) VALUES (?)";

  db.query(sql, [name], (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).json({
        message: "약 등록에 실패했습니다.",
      });
      return;
    }

    const medicationId = result.insertId;

    const scheduleSql = `
            INSERT INTO medication_schedules
            (medication_id, time)
            VALUES (?, ?)
        `;

    db.query(
      scheduleSql,
      [medicationId, time],
      (scheduleErr, scheduleResult) => {
        if (scheduleErr) {
          console.log(scheduleErr);
          res.status(500).json({
            message: "복용 일정 등록에 실패했습니다.",
          });
          return;
        }

        res.status(201).json({
          message: "약이 등록되었습니다.",
          id: medicationId,
          scheduleId: scheduleResult.insertId,
        });
      },
    );
  });
});

// 약 삭제하기
app.delete("/api/medications/:id", (req, res) => {
  const id = req.params.id;

  const sql = "DELETE FROM medications WHERE id = ?";

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).json({
        message: "약 삭제에 실패했습니다.",
      });
      return;
    }

    if (result.affectedRows === 0) {
      res.status(404).json({
        message: "해당 약을 찾을 수 없습니다.",
      });
      return;
    }

    res.json({
      message: "약이 삭제되었습니다.",
    });
  });
});

app.listen(process.env.PORT, () => {
  console.log(`서버 실행 중: http://localhost:${process.env.PORT}`);
});
