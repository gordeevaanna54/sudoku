const form = document.getElementById('registerForm');
const btn = document.querySelector('.btn-submit');
const inputs = document.querySelectorAll('input');
const successMsg = document.getElementById('successMsg');

function checkFields() {
    const allFilled = [...inputs].every(input => input.value.trim() !== '');
    btn.disabled = !allFilled;
}

inputs.forEach(input => input.addEventListener('input', checkFields));

form.addEventListener('submit', function(e) {
    e.preventDefault();

    const username  = form.querySelector('input[type="text"]').value.trim();
    const email     = form.querySelector('input[type="email"]').value.trim();
    const password  = form.querySelectorAll('input[type="password"]')[0].value;
    const password2 = form.querySelectorAll('input[type="password"]')[1].value;

    if (password !== password2) {
        alert("Salasanat eivät täsmää!");
        return;
    }

    const key = "user_" + username;
    if (localStorage.getItem(key)) {
        alert("Käyttäjänimi on jo käytössä. Valitse toinen.");
        return;
    }

    const userData = { username, email, password, records: {} };
    localStorage.setItem(key, JSON.stringify(userData));

    successMsg.style.display = 'block';
    btn.disabled = true;

    setTimeout(() => { window.location.href = 'index.html'; }, 2000);
});

checkFields();