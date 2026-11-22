const signupForm = document.getElementById("signupForm");

signupForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;
  const message = document.getElementById("message");

  if (password !== confirmPassword) {
    message.textContent = "비밀번호가 일치하지 않습니다.";
    message.style.color = "red";
    return;
  }

  try {
    const response = await fetch("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: name,
        email: email,
        password: password,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      alert("회원가입이 완료되었습니다!");
      location.href = "login.html";
    } else {
      message.textContent = data.message || "회원가입에 실패했습니다.";
      message.style.color = "red";
    }
  } catch (error) {
    message.textContent = "서버에 연결할 수 없습니다.";
    message.style.color = "red";
  }
});
