const express = require("express");
const cors = require("cors");
const db = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", function (req, res) {
  res.send("스마트 복약 체크 타이머 서버 실행 중!");
});

// 오늘 날짜의 약 목록과 복용 완료 여부 가져오기
app.get("/api/medications", function (req, res) {
  const today = req.query.date;

  const dateParts = today ? today.split("-") : [];

  if (
    dateParts.length !== 3 ||
    dateParts[0].length !== 4 ||
    dateParts[1].length !== 2 ||
    dateParts[2].length !== 2
  ) {
    res.status(400).json({
      message: "날짜를 YYYY-MM-DD 형식으로 보내 주세요.",
    });
    return;
  }

  const sql = `
    SELECT
      medications.id,
      medications.name,
      medications.created_at,
      medication_schedules.id AS schedule_id,
      medication_schedules.time,
      COALESCE(medication_records.completed, FALSE) AS completed
    FROM medications
    LEFT JOIN medication_schedules
      ON medications.id = medication_schedules.medication_id
    LEFT JOIN medication_records
      ON medication_schedules.id = medication_records.schedule_id
      AND medication_records.taken_date = ?
    ORDER BY medication_schedules.time ASC, medications.id DESC
  `;

  db.query(sql, [today], function (err, results) {
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

// 약 등록
app.post("/api/medications", function (req, res) {
  const name = req.body.name;
  const time = req.body.time;

  if (
    typeof name !== "string" ||
    name.trim() === "" ||
    typeof time !== "string"
  ) {
    res.status(400).json({
      message: "올바른 약 이름과 복용 시간을 입력해 주세요.",
    });
    return;
  }

  const timeParts = time.split(":");

  if (timeParts.length !== 2) {
    res.status(400).json({
      message: "복용 시간을 올바르게 입력해 주세요.",
    });
    return;
  }

  const hour = Number(timeParts[0]);
  const minute = Number(timeParts[1]);

  if (
    timeParts[0].length !== 2 ||
    timeParts[1].length !== 2 ||
    isNaN(hour) ||
    isNaN(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    res.status(400).json({
      message: "복용 시간을 올바르게 입력해 주세요.",
    });
    return;
  }

  const cleanName = name.trim();
  const sql = "INSERT INTO medications (name) VALUES (?)";

  db.query(sql, [cleanName], function (err, result) {
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
      function (scheduleErr, scheduleResult) {
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

// 복용 완료 상태 저장 또는 변경
app.post("/api/medication-records", function (req, res) {
  const scheduleId = Number(req.body.scheduleId);
  const takenDate = req.body.takenDate;
  const completed = req.body.completed;

  const dateParts = typeof takenDate === "string" ? takenDate.split("-") : [];

  if (
    !Number.isInteger(scheduleId) ||
    scheduleId <= 0 ||
    dateParts.length !== 3 ||
    dateParts[0].length !== 4 ||
    dateParts[1].length !== 2 ||
    dateParts[2].length !== 2 ||
    typeof completed !== "boolean"
  ) {
    res.status(400).json({
      message: "복용 기록 정보가 올바르지 않습니다.",
    });
    return;
  }

  const sql = `
    INSERT INTO medication_records
      (schedule_id, taken_date, completed, completed_at)
    VALUES (?, ?, ?, IF(?, NOW(), NULL))
    ON DUPLICATE KEY UPDATE
      completed = VALUES(completed),
      completed_at = IF(VALUES(completed) = TRUE, NOW(), NULL)
  `;

  db.query(sql, [scheduleId, takenDate, completed, completed], function (err) {
    if (err) {
      console.log(err);
      res.status(500).json({
        message: "복용 기록 저장에 실패했습니다.",
      });
      return;
    }

    res.json({
      message: "복용 상태가 저장되었습니다.",
    });
  });
});

// 약 삭제
app.delete("/api/medications/:id", function (req, res) {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({
      message: "올바른 약 번호가 아닙니다.",
    });
    return;
  }

  const sql = "DELETE FROM medications WHERE id = ?";

  db.query(sql, [id], function (err, result) {
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

const PORT = process.env.PORT || 3000;

app.listen(PORT, function () {
  console.log("서버 실행 중: http://localhost:" + PORT);
});
