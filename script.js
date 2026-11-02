const medicationList = document.getElementById("medicationList");
const totalCount = document.getElementById("totalCount");
const completedCount = document.getElementById("completedCount");
const remainingCount = document.getElementById("remainingCount");
const addButton = document.getElementById("addButton");
const testNotificationButton = document.getElementById(
  "testNotificationButton",
);
const todayDate = document.getElementById("todayDate");

function loadMedications() {
  try {
    const savedData = localStorage.getItem("medications");

    if (savedData === null) {
      return [
        {
          id: 1,
          name: "유산균",
          time: "08:00",
          icon: "🥛",
          completed: false,
        },
        {
          id: 2,
          name: "오메가3",
          time: "12:00",
          icon: "🐟",
          completed: false,
        },
        {
          id: 3,
          name: "비타민",
          time: "19:00",
          icon: "🍊",
          completed: false,
        },
      ];
    }

    const parsedData = JSON.parse(savedData);

    if (!Array.isArray(parsedData)) {
      return [];
    }

    return parsedData;
  } catch (error) {
    console.error("복약 데이터 불러오기 실패:", error);

    return [];
  }
}

let medications = loadMedications();

function displayDate() {
  const today = new Date();

  todayDate.textContent = today.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });
}

function saveMedications() {
  try {
    localStorage.setItem("medications", JSON.stringify(medications));
  } catch (error) {
    console.error("복약 데이터 저장 실패: ", error);

    alert("데이터 저장에 실패했습니다.");
  }
}

function escapeHTML(value) {
  // hmtl 특수문자 처리
  return String(value).replace(/[&<>"']/g, (character) => {
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
