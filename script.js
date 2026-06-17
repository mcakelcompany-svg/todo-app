// --- Görünüm elemanları ---
const authView = document.getElementById("auth-view");
const appView = document.getElementById("app-view");

// Auth
const authForm = document.getElementById("auth-form");
const emailInput = document.getElementById("auth-email");
const passwordInput = document.getElementById("auth-password");
const signupBtn = document.getElementById("signup-btn");
const authMessage = document.getElementById("auth-message");
const userEmailEl = document.getElementById("user-email");
const logoutBtn = document.getElementById("logout-btn");

// Todo
const form = document.getElementById("todo-form");
const input = document.getElementById("todo-input");
const list = document.getElementById("todo-list");
const countEl = document.getElementById("count");
const clearBtn = document.getElementById("clear-completed");
const filterBtns = document.querySelectorAll(".filter-btn");

let todos = [];
let filter = "all";
let currentUser = null;

// ---------------- Auth ----------------

function setAuthMessage(text, type) {
  authMessage.textContent = text;
  authMessage.className = "auth-message" + (type ? " " + type : "");
}

function showAuthView() {
  currentUser = null;
  todos = [];
  appView.hidden = true;
  authView.hidden = false;
}

function showAppView(user) {
  currentUser = user;
  userEmailEl.textContent = user.email;
  authView.hidden = true;
  appView.hidden = false;
  loadTodos();
}

async function handleLogin() {
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  if (!email || !password) return;

  setAuthMessage("Giriş yapılıyor...");
  const { data, error } = await db.auth.signInWithPassword({ email, password });
  if (error) {
    setAuthMessage(cevirHata(error.message), "error");
    return;
  }
  showAppView(data.user);
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
  // E-posta onayı kapalı olduğu için kullanıcı doğrudan oturum açar.
  if (data.session) {
    showAppView(data.user);
  } else {
    setAuthMessage("Kayıt başarılı, şimdi giriş yapabilirsin.", "success");
  }
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
  return msg;
}

authForm.addEventListener("submit", (e) => {
  e.preventDefault();
  handleLogin();
});
signupBtn.addEventListener("click", handleSignup);
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

// ---------------- Başlangıç ----------------

async function init() {
  const { data } = await db.auth.getSession();
  if (data.session) {
    showAppView(data.session.user);
  } else {
    showAuthView();
  }
}

init();
