const form = document.getElementById("todo-form");
const input = document.getElementById("todo-input");
const list = document.getElementById("todo-list");
const countEl = document.getElementById("count");
const clearBtn = document.getElementById("clear-completed");
const filterBtns = document.querySelectorAll(".filter-btn");

let todos = [];
let filter = "all";

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
    .insert({ text })
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
  const { error } = await db
    .from("todos")
    .delete()
    .eq("completed", true);
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

loadTodos();
