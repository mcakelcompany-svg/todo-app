// --- Görünüm elemanları ---
const authView = document.getElementById("auth-view");
const appView = document.getElementById("app-view");
const resetView = document.getElementById("reset-view");

// Auth
const authForm = document.getElementById("auth-form");
const emailInput = document.getElementById("auth-email");
const passwordInput = document.getElementById("auth-password");
const signupBtn = document.getElementById("signup-btn");
const forgotLink = document.getElementById("forgot-link");
const googleBtn = document.getElementById("google-btn");
const authMessage = document.getElementById("auth-message");
const userEmailEl = document.getElementById("user-email");
const logoutBtn = document.getElementById("logout-btn");

// Şifre sıfırlama
const resetForm = document.getElementById("reset-form");
const resetPassword = document.getElementById("reset-password");
const resetMessage = document.getElementById("reset-message");

// Todo
const form = document.getElementById("todo-form");
const input = document.getElementById("todo-input");
const list = document.getElementById("todo-list");
const countEl = document.getElementById("count");
const clearBtn = document.getElementById("clear-completed");
const filterBtns = document.querySelectorAll(".filter-btn");

const SITE_URL = "https://mcakelcompany-svg.github.io/todo-app/";

let todos = [];
let filter = "all";
let currentUser = null;
let recovering = false; // şifre sıfırlama akışında mıyız?

// ---------------- Görünüm ----------------

function setAuthMessage(text, type) {
  authMessage.textContent = text;
  authMessage.className = "auth-message" + (type ? " " + type : "");
}

function showAuthView() {
  currentUser = null;
  todos = [];
  appView.hidden = true;
  resetView.hidden = true;
  authView.hidden = false;
}

function showAppView(user) {
  currentUser = user;
  userEmailEl.textContent = user.email;
  authView.hidden = true;
  resetView.hidden = true;
  appView.hidden = false;
  loadTodos();
}

function showResetView() {
  authView.hidden = true;
  appView.hidden = true;
  resetView.hidden = false;
}

// ---------------- Auth ----------------

async function handleLogin() {
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  if (!email || !password) return;

  setAuthMessage("Giriş yapılıyor...");
  const { error } = await db.auth.signInWithPassword({ email, password });
  if (error) setAuthMessage(cevirHata(error.message), "error");
  // Başarılıysa onAuthStateChange (SIGNED_IN) uygulamayı açar.
}

async function handleSignup() {
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  if (!email || !password) {
    setAuthMessage("E-posta ve şifre gerekli.", "error");
    return;
  }
  if (password.length < 6) {
    setAuthMessage("Şifre en az 6 karakter olmalı.", "error");
    return;
  }

  setAuthMessage("Kayıt oluşturuluyor...");
  const { data, error } = await db.auth.signUp({ email, password });
  if (error) {
    setAuthMessage(cevirHata(error.message), "error");
    return;
  }
  if (!data.session) {
    setAuthMessage("Kayıt başarılı, şimdi giriş yapabilirsin.", "success");
  }
  // Oturum varsa onAuthStateChange uygulamayı açar.
}

async function handleForgot() {
  const email = emailInput.value.trim();
  if (!email) {
    setAuthMessage("Önce e-posta adresini yaz, sonra 'Şifremi unuttum'a bas.", "error");
    return;
  }
  setAuthMessage("Sıfırlama bağlantısı gönderiliyor...");
  const { error } = await db.auth.resetPasswordForEmail(email, {
    redirectTo: SITE_URL,
  });
  if (error) {
    setAuthMessage(cevirHata(error.message), "error");
    return;
  }
  setAuthMessage("Sıfırlama bağlantısı e-postana gönderildi. Gelen kutunu kontrol et.", "success");
}

async function handleGoogle() {
  const { error } = await db.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: SITE_URL },
  });
  if (error) setAuthMessage(cevirHata(error.message), "error");
}

async function handleResetSubmit() {
  const pw = resetPassword.value;
  if (pw.length < 6) {
    resetMessage.textContent = "Şifre en az 6 karakter olmalı.";
    resetMessage.className = "auth-message error";
    return;
  }
  resetMessage.textContent = "Güncelleniyor...";
  resetMessage.className = "auth-message";
  const { data, error } = await db.auth.updateUser({ password: pw });
  if (error) {
    resetMessage.textContent = cevirHata(error.message);
    resetMessage.className = "auth-message error";
    return;
  }
  recovering = false;
  history.replaceState(null, "", SITE_URL); // URL'deki token'ı temizle
  showAppView(data.user);
}

async function handleLogout() {
  await db.auth.signOut();
  showAuthView();
}

// Sık karşılaşılan hata mesajlarını Türkçeleştir
function cevirHata(msg) {
  if (/Invalid login credentials/i.test(msg)) return "E-posta veya şifre hatalı.";
  if (/User already registered/i.test(msg)) return "Bu e-posta zaten kayıtlı. Giriş yap.";
  if (/Password should be at least/i.test(msg)) return "Şifre en az 6 karakter olmalı.";
  if (/valid email/i.test(msg)) return "Geçerli bir e-posta gir.";
  if (/provider is not enabled/i.test(msg)) return "Google girişi henüz etkin değil.";
  if (/rate limit|too many/i.test(msg)) return "Çok fazla deneme. Biraz sonra tekrar dene.";
  return msg;
}

authForm.addEventListener("submit", (e) => {
  e.preventDefault();
  handleLogin();
});
signupBtn.addEventListener("click", handleSignup);
forgotLink.addEventListener("click", (e) => {
  e.preventDefault();
  handleForgot();
});
googleBtn.addEventListener("click", handleGoogle);
resetForm.addEventListener("submit", (e) => {
  e.preventDefault();
  handleResetSubmit();
});
logoutBtn.addEventListener("click", handleLogout);

// ---------------- Todo ----------------

function showMessage(text) {
  list.innerHTML = "";
  const li = document.createElement("li");
  li.className = "empty";
  li.textContent = text;
  list.appendChild(li);
}

async function loadTodos() {
  showMessage("Yükleniyor...");
  const { data, error } = await db
    .from("todos")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error(error);
    showMessage("Veriler yüklenemedi 😕");
    return;
  }
  todos = data;
  render();
}

function render() {
  list.innerHTML = "";

  const filtered = todos.filter((t) => {
    if (filter === "active") return !t.completed;
    if (filter === "completed") return t.completed;
    return true;
  });

  if (filtered.length === 0) {
    showMessage("Görev yok 🎉");
  }

  filtered.forEach((todo) => {
    const li = document.createElement("li");
    li.className = "todo-item" + (todo.completed ? " completed" : "");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = todo.completed;
    checkbox.addEventListener("change", () => toggle(todo));

    const span = document.createElement("span");
    span.textContent = todo.text;

    const del = document.createElement("button");
    del.className = "delete";
    del.textContent = "×";
    del.title = "Sil";
    del.addEventListener("click", () => remove(todo.id));

    li.append(checkbox, span, del);
    list.appendChild(li);
  });

  const active = todos.filter((t) => !t.completed).length;
  countEl.textContent = `${active} görev`;
}

async function addTodo(text) {
  const { data, error } = await db
    .from("todos")
    .insert({ text, user_id: currentUser.id })
    .select()
    .single();

  if (error) {
    console.error(error);
    alert("Görev eklenemedi.");
    return;
  }
  todos.push(data);
  render();
}

async function toggle(todo) {
  const { data, error } = await db
    .from("todos")
    .update({ completed: !todo.completed })
    .eq("id", todo.id)
    .select()
    .single();

  if (error) {
    console.error(error);
    return;
  }
  todos = todos.map((t) => (t.id === data.id ? data : t));
  render();
}

async function remove(id) {
  const { error } = await db.from("todos").delete().eq("id", id);
  if (error) {
    console.error(error);
    return;
  }
  todos = todos.filter((t) => t.id !== id);
  render();
}

async function clearCompleted() {
  const { error } = await db.from("todos").delete().eq("completed", true);
  if (error) {
    console.error(error);
    return;
  }
  todos = todos.filter((t) => !t.completed);
  render();
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  input.value = "";
  input.focus();
  await addTodo(text);
});

clearBtn.addEventListener("click", clearCompleted);

filterBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    filterBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    filter = btn.dataset.filter;
    render();
  });
});

// ---------------- Oturum durumu ----------------
// Tüm görünüm geçişlerini tek noktadan yönet (giriş, çıkış, Google dönüşü,
// şifre sıfırlama linkiyle gelme dahil).
db.auth.onAuthStateChange((event, session) => {
  if (event === "PASSWORD_RECOVERY") {
    recovering = true;
    showResetView();
    return;
  }
  if (recovering) return; // sıfırlama bitene kadar diğer olayları yok say
  if (session) {
    showAppView(session.user);
  } else {
    showAuthView();
  }
});
