document.getElementById("loginForm").addEventListener("submit", function(e) {
    e.preventDefault();

    const username = document.getElementById("usernameInput").value.trim();
    const password = document.getElementById("passwordInput").value;
    const errorDiv = document.getElementById("login-error");

    if (username === "" || password === "") {
        window.location.href = "error.html";
        return;
    }

    // Проверяем есть ли такой пользователь в localStorage
    const key = "user_" + username;
    const saved = localStorage.getItem(key);

    if (!saved) {
        errorDiv.textContent = "Käyttäjää ei löydy. Rekisteröidy ensin.";
        return;
    }

    const userData = JSON.parse(saved);

    if (userData.password !== password) {
        errorDiv.textContent = "Väärä salasana.";
        return;
    }

    // Успешный вход — сохраняем текущего юзера и идём в игру
    errorDiv.textContent = "";
    sessionStorage.setItem("currentUser", username);
    window.location.href = "peli.html";
});
