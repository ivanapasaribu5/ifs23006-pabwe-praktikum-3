// === DOM Elements ===
const form = document.getElementById("formData");
const todoInput = document.getElementById("todo-input");
const todoList = document.getElementById("todoList");
const searchInput = document.getElementById("search-input");
const filterButtons = document.getElementById("filter-buttons");

// === State Management ===
let todos = [];
let currentFilter = "all"; // 'all', 'completed', 'uncompleted'
let searchTerm = "";
let draggedItem = null;

// === Functions ===

/**
 * Memuat todos dari localStorage saat halaman dimuat.
 */
function loadTodos() {
  const storedTodos = localStorage.getItem("todos");
  if (storedTodos) {
    todos = JSON.parse(storedTodos);
  }
  renderTodos();
}

/**
 * Menyimpan todos ke localStorage.
 */
function saveTodos() {
  localStorage.setItem("todos", JSON.stringify(todos));
}

/**
 * Merender daftar todo ke UI berdasarkan filter dan pencarian.
 */
function renderTodos() {
  todoList.innerHTML = ""; // Kosongkan daftar sebelum merender

  // 1. Filter berdasarkan status (all, completed, uncompleted)
  let filteredTodos = todos.filter((item) => {
    if (currentFilter === "completed") return item.completed;
    if (currentFilter === "uncompleted") return !item.completed;
    return true; // 'all'
  });

  // 2. Filter berdasarkan pencarian
  if (searchTerm) {
    filteredTodos = filteredTodos.filter((item) =>
      item.todo.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  // 3. Render setiap todo yang sudah difilter
  if (filteredTodos.length === 0) {
    todoList.innerHTML = `<li class="list-group-item text-center text-muted">Tidak ada todo yang ditemukan.</li>`;
  } else {
    filteredTodos.forEach((item, index) => {
      const li = createTodoElement(item);
      todoList.appendChild(li);
    });
  }
}

/**
 * Membuat elemen <li> untuk satu item todo.
 * @param {object} item - Objek todo.
 * @returns {HTMLLIElement} - Elemen <li> yang sudah jadi.
 */
function createTodoElement(item) {
  const li = document.createElement("li");
  li.className = "list-group-item d-flex align-items-center";
  li.draggable = true;
  li.dataset.id = item.id; // Gunakan ID unik untuk identifikasi

  const isCompleted = item.completed;
  const textDecoration = isCompleted ? "line-through" : "none";

  li.innerHTML = `
    <div class="flex-fill" style="text-decoration: ${textDecoration};">
      <input class="form-check-input me-2" type="checkbox" ${
        isCompleted ? "checked" : ""
      }>
      <span class="todo-item-label">${item.todo}</span>
    </div>
    <div>
      <button class="btn btn-sm btn-outline-primary me-1 edit-btn">
        <i class="bi bi-pencil"></i>
      </button>
      <button class="btn btn-sm btn-outline-danger delete-btn">
        <i class="bi bi-trash"></i>
      </button>
    </div>
  `;

  // Event listener untuk checkbox
  li.querySelector('input[type="checkbox"]').addEventListener("change", () => {
    toggleTodoStatus(item.id);
  });

  // Event listener untuk tombol hapus
  li.querySelector(".delete-btn").addEventListener("click", () => {
    deleteTodo(item.id);
  });

  // Event listener untuk tombol edit
  li.querySelector(".edit-btn").addEventListener("click", () => {
    editTodo(item.id, li);
  });

  // Event listener untuk drag-and-drop
  li.addEventListener("dragstart", handleDragStart);
  li.addEventListener("dragover", handleDragOver);
  li.addEventListener("dragleave", handleDragLeave);
  li.addEventListener("drop", handleDrop);
  li.addEventListener("dragend", handleDragEnd);

  return li;
}

/**
 * Menambahkan todo baru.
 */
function addTodo(event) {
  event.preventDefault();
  const todoText = todoInput.value.trim();

  if (todoText === "") {
    alert("Todo tidak boleh kosong!");
    return;
  }

  // Validasi judul duplikat (case-insensitive)
  const isDuplicate = todos.some(
    (item) => item.todo.toLowerCase() === todoText.toLowerCase()
  );
  if (isDuplicate) {
    alert("Todo dengan judul yang sama sudah ada!");
    return;
  }

  const newTodo = {
    id: Date.now(), // ID unik berdasarkan timestamp
    todo: todoText,
    completed: false,
  };

  todos.unshift(newTodo); // Tambah ke awal array
  form.reset();
  saveAndRender();
}

/**
 * Menghapus todo berdasarkan ID.
 */
function deleteTodo(id) {
  if (confirm("Apakah Anda yakin ingin menghapus todo ini?")) {
    todos = todos.filter((item) => item.id !== id);
    saveAndRender();
  }
}

/**
 * Mengubah status completed/uncompleted todo.
 */
function toggleTodoStatus(id) {
  const todo = todos.find((item) => item.id === id);
  if (todo) {
    todo.completed = !todo.completed;
    saveAndRender();
  }
}

/**
 * Mengaktifkan mode edit untuk sebuah todo.
 */
function editTodo(id, listItem) {
  const todo = todos.find((item) => item.id === id);
  if (!todo) return;

  const label = listItem.querySelector(".todo-item-label");
  const container = label.parentElement;

  const input = document.createElement("input");
  input.type = "text";
  input.className = "form-control form-control-sm";
  input.value = todo.todo;

  container.replaceChild(input, label);
  input.focus();

  const saveButton = document.createElement("button");
  saveButton.className = "btn btn-sm btn-success me-1";
  saveButton.innerHTML = '<i class="bi bi-check-lg"></i>';

  const originalButtons = listItem.querySelector("div:last-child");
  originalButtons.style.display = "none";
  listItem.appendChild(saveButton);

  const saveChanges = () => {
    const newTodoText = input.value.trim();
    if (newTodoText && newTodoText.toLowerCase() !== todo.todo.toLowerCase()) {
      // Cek duplikat lagi, kecuali untuk item itu sendiri
      const isDuplicate = todos.some(
        (item) =>
          item.id !== id &&
          item.todo.toLowerCase() === newTodoText.toLowerCase()
      );
      if (isDuplicate) {
        alert("Todo dengan judul yang sama sudah ada!");
        input.focus(); // Kembalikan fokus ke input
        return;
      }
      todo.todo = newTodoText;
    }
    // Keluar dari mode edit
    container.replaceChild(label, input);
    saveButton.remove();
    originalButtons.style.display = "block";
    saveAndRender();
  };

  saveButton.addEventListener("click", saveChanges);
  input.addEventListener("blur", saveChanges); // Simpan saat input kehilangan fokus
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveChanges();
    }
  });
}

/**
 * Menangani perubahan filter.
 */
function handleFilter(event) {
  if (event.target.tagName === "BUTTON") {
    // Hapus kelas 'active' dari semua tombol
    filterButtons
      .querySelectorAll("button")
      .forEach((btn) => btn.classList.remove("active"));
    // Tambahkan kelas 'active' ke tombol yang diklik
    event.target.classList.add("active");
    currentFilter = event.target.dataset.filter;
    renderTodos();
  }
}

/**
 * Menangani input pencarian.
 */
function handleSearch(event) {
  searchTerm = event.target.value;
  renderTodos();
}

/**
 * Menyimpan state dan merender ulang UI.
 */
function saveAndRender() {
  saveTodos();
  renderTodos();
}

// === Drag and Drop Handlers ===
function handleDragStart(e) {
  draggedItem = this;
  setTimeout(() => {
    this.classList.add("dragging");
  }, 0);
}

function handleDragEnd() {
  this.classList.remove("dragging");
  draggedItem = null;

  // Update urutan array 'todos' berdasarkan urutan DOM
  const newOrderIds = [...todoList.querySelectorAll("li")].map(
    (li) => li.dataset.id
  );
  todos.sort(
    (a, b) =>
      newOrderIds.indexOf(String(a.id)) - newOrderIds.indexOf(String(b.id))
  );
  saveTodos(); // Simpan urutan baru
}

function handleDragOver(e) {
  e.preventDefault();
  const afterElement = getDragAfterElement(todoList, e.clientY);
  if (afterElement == null) {
    todoList.appendChild(draggedItem);
  } else {
    todoList.insertBefore(draggedItem, afterElement);
  }
}

function handleDragLeave() {
  // Tidak perlu aksi khusus di sini
}

function handleDrop(e) {
  e.preventDefault();
}

function getDragAfterElement(container, y) {
  const draggableElements = [
    ...container.querySelectorAll("li:not(.dragging)"),
  ];

  return draggableElements.reduce(
    (closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    },
    { offset: Number.NEGATIVE_INFINITY }
  ).element;
}

// === Event Listeners ===
document.addEventListener("DOMContentLoaded", loadTodos);
form.addEventListener("submit", addTodo);
filterButtons.addEventListener("click", handleFilter);
searchInput.addEventListener("input", handleSearch);
