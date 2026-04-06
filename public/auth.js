function loadSession() {
    const raw = localStorage.getItem('chessAuth');
    if (!raw) return null;

    try {
        return JSON.parse(raw);
    } catch {
        localStorage.removeItem('chessAuth');
        return null;
    }
}

function saveSession(session) {
    localStorage.setItem('chessAuth', JSON.stringify(session));
}

function setMessage(text, type = '') {
    const authMessage = document.getElementById('authMessage');
    if (!authMessage) return;

    authMessage.textContent = text;
    authMessage.classList.remove('error', 'success');
    if (type) authMessage.classList.add(type);
}

async function requestJson(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        }
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(data.message || data.error || 'Request failed');
    }

    return data;
}

function redirectIfLoggedIn() {
    const session = loadSession();
    if (session?.token && session?.user) {
        window.location.replace('/game.html');
    }
}

function bindLoginForm() {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;

        setMessage('Signing in...');

        try {
            const data = await requestJson('/users/login', {
                method: 'POST',
                body: JSON.stringify({ email, password })
            });

            saveSession({ token: data.token, user: data.user });
            window.location.replace('/game.html');
        } catch (error) {
            setMessage(error.message, 'error');
        }
    });
}

function bindRegisterForm() {
    const registerForm = document.getElementById('registerForm');
    if (!registerForm) return;

    registerForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const name = document.getElementById('registerName').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const password = document.getElementById('registerPassword').value;

        setMessage('Creating account...');

        try {
            await requestJson('/users', {
                method: 'POST',
                body: JSON.stringify({ name, email, password })
            });

            setMessage('Account created. Redirecting to login...', 'success');
            registerForm.reset();
            setTimeout(() => {
                window.location.replace('/login.html');
            }, 800);
        } catch (error) {
            setMessage(error.message, 'error');
        }
    });
}

redirectIfLoggedIn();
bindLoginForm();
bindRegisterForm();
