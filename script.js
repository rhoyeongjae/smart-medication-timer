const API_URL = "http://localhost:3000/api";

const medicationList = document.getElementById("medicationList");
const totalCount = document.getElementById("totalCount");
const completedCount = document.getElementById("completedCount");
const remainingCount = document.getElementById("remainingCount");
const addButton = document.getElementById("addButton");
const testNotificationButton = document.getElementById(
  "testNotificationButton",
);
const todayDate = document.getElementById("todayDate");

let medications = [];

function getTodayDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return year + "-" + month + "-" + day;
}

// 화면 위에 오늘 날짜 표시
function displayDate() {
  todayDate.textContent = new Date().toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });
}

// 약 이름에 따라 아이콘 선택
function getMedicationIcon(name) {
  if (name.includes("유산균")) return "🥛";
  if (name.includes("오메가")) return "🐟";
  if (name.includes("비타민")) return "🍊";
  return "💊";
}

// 입력값의 특수문자를 HTML 문자로 변환
function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, function (character) {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return entities[character];
  });
}

// 서버에서 오늘의 약 목록 가져옴
async function loadMedications() {
  medicationList.innerHTML =
    '<p class="empty-message">복약 목록을 불러오는 중입니다...</p>';

  try {
    const response = await fetch(
      API_URL + "/medications?date=" + getTodayDate(),
    );

    if (!response.ok) {
      throw new Error("약 목록을 불러오지 못했습니다.");
    }

    medications = await response.json();
    renderMedications();
  } catch (error) {
    console.error("복약 목록 불러오기 실패:", error);
    medicationList.innerHTML =
      '<p class="empty-message">서버에 연결할 수 없습니다. 백엔드 서버가 실행 중인지 확인해 주세요.</p>';
  }
}

// 약 목록과 복용 현황 화면에 표시
function renderMedications() {
  let completedTotal = 0;

  medications.forEach(function (medication) {
    if (Boolean(medication.completed)) {
      completedTotal++;
    }
  });

  totalCount.textContent = medications.length + "개";
  completedCount.textContent = completedTotal + "개";
  remainingCount.textContent = medications.length - completedTotal + "개";

  if (medications.length === 0) {
    medicationList.innerHTML =
      '<p class="empty-message">등록된 복약 일정이 없습니다. 약을 추가해 보세요!</p>';
    return;
  }

  let html = "";

  medications.forEach(function (medication) {
    const completed = Boolean(medication.completed);
    const icon = getMedicationIcon(medication.name);
    const time = medication.time
      ? String(medication.time).slice(0, 5)
      : "시간 미정";

    html += `
      <article class="medication-card ${completed ? "is-completed" : ""}">
        <div class="medication-info">
          <div class="medication-icon">${icon}</div>
          <div>
            <h3>${escapeHTML(medication.name)}</h3>
            <p>오늘의 복약 일정</p>
          </div>
        </div>
        <div class="medication-actions">
          <span class="time-label">🕒 ${escapeHTML(time)}</span>
          <button
            class="check-button ${completed ? "completed" : ""}"
            data-schedule-id="${medication.schedule_id || ""}"
            data-completed="${completed}"
            ${medication.schedule_id ? "" : "disabled"}
          >${completed ? "복용 완료" : "복용 체크"}</button>
          <button
            class="delete-button"
            data-medication-id="${medication.id}"
            aria-label="약 삭제"
          >×</button>
        </div>
      </article>
    `;
  });

  medicationList.innerHTML = html;

  document.querySelectorAll(".check-button").forEach(function (button) {
    button.onclick = handleCompleteClick;
  });

  document.querySelectorAll(".delete-button").forEach(function (button) {
    button.onclick = handleDeleteClick;
  });
}

// 약 등록
async function addMedication(name, time) {
  const cleanName = name.trim();

  if (!cleanName || !time) {
    alert("약 이름과 복용 시간을 모두 입력해 주세요.");
    return;
  }

  try {
    const response = await fetch(API_URL + "/medications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: cleanName, time: time }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "약 등록에 실패했습니다.");
    }

    alert("약이 등록되었습니다!");
    await loadMedications();
  } catch (error) {
    console.error("약 등록 실패:", error);
    alert(error.message || "서버에 연결할 수 없습니다.");
  }
}

// 약 삭제
async function handleDeleteClick(event) {
  const medicationId = event.currentTarget.dataset.medicationId;

  if (!confirm("이 약을 삭제할까요?")) return;

  try {
    const response = await fetch(API_URL + "/medications/" + medicationId, {
      method: "DELETE",
    });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "약 삭제에 실패했습니다.");
    }

    await loadMedications();
  } catch (error) {
    console.error("약 삭제 실패:", error);
    alert(error.message || "약 삭제 중 오류가 발생했습니다.");
  }
}

// 복용 완료 또는 취소
async function handleCompleteClick(event) {
  const button = event.currentTarget;
  const scheduleId = Number(button.dataset.scheduleId);
  const wasCompleted = button.dataset.completed === "true";

  try {
    const response = await fetch(API_URL + "/medication-records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scheduleId: scheduleId,
        takenDate: getTodayDate(),
        completed: !wasCompleted,
      }),
    });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "복용 상태 저장에 실패했습니다.");
    }

    await loadMedications();
  } catch (error) {
    console.error("복용 상태 저장 실패:", error);
    alert(error.message || "복용 상태를 저장하지 못했습니다.");
  }
}

// 직접 약 추가
addButton.onclick = async function () {
  const name = prompt("약 이름을 입력해 주세요.");
  if (name === null) return;

  const time = prompt("복용 시간을 입력해 주세요. (예: 08:00)");
  if (time === null) return;

  if (!/^\d{2}:\d{2}$/.test(time)) {
    alert("시간은 00:00 형식으로 입력해 주세요.");
    return;
  }

  await addMedication(name, time + ":00");
};

// 자주 등록하는 약 버튼
const quickButtons = document.querySelectorAll(".quick-button");
quickButtons.forEach(function (button) {
  button.onclick = async function () {
    const name = button.dataset.name;
    const time = prompt(name + " 복용 시간을 입력해 주세요. (예: 08:00)");
    if (time === null) return;

    if (!/^\d{2}:\d{2}$/.test(time)) {
      alert("시간은 08:00 형식으로 입력해 주세요.");
      return;
    }

    await addMedication(name, time + ":00");
  };
});

// 10초 뒤 테스트 알림
testNotificationButton.onclick = async function () {
  if (!("Notification" in window)) {
    alert("이 브라우저는 알림 기능을 지원하지 않습니다.");
    return;
  }

  if (Notification.permission === "denied") {
    alert("브라우저 설정에서 알림 권한을 허용해 주세요.");
    return;
  }

  if (Notification.permission !== "granted") {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      alert("알림 권한이 허용되지 않았습니다.");
      return;
    }
  }

  testNotificationButton.disabled = true;
  testNotificationButton.textContent = "알림 대기 중...";

  setTimeout(function () {
    new Notification("복약 체크 타이머", {
      body: "알림 테스트입니다. 복약 시간을 확인해 보세요!",
    });

    testNotificationButton.disabled = false;
    testNotificationButton.textContent = "10초 뒤 알림 테스트";
  }, 10000);
};

displayDate();
loadMedications();
