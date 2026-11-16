CREATE DATABASE IF NOT EXISTS smart_medication
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE smart_medication;

-- 약 정보
CREATE TABLE IF NOT EXISTS medications (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 약별 복용 시간
CREATE TABLE IF NOT EXISTS medication_schedules (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  medication_id INT UNSIGNED NOT NULL,
  `time` TIME NOT NULL,
  PRIMARY KEY (id),
  INDEX idx_schedules_medication_id (medication_id),
  CONSTRAINT fk_schedules_medication
    FOREIGN KEY (medication_id)
    REFERENCES medications (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 날짜별 복용 기록
CREATE TABLE IF NOT EXISTS medication_records (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  schedule_id INT UNSIGNED NOT NULL,
  taken_date DATE NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_schedule_taken_date (schedule_id, taken_date),
  INDEX idx_records_taken_date (taken_date),
  CONSTRAINT fk_records_schedule
    FOREIGN KEY (schedule_id)
    REFERENCES medication_schedules (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
