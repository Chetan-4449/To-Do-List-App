let tasks = JSON.parse(localStorage.getItem("tasks") || "[]");
let editIndex = null;
let currentFilter = "all";

const taskInput = document.getElementById("taskInput");
const dueDateInput = document.getElementById("dueDateInput");
const addBtn = document.getElementById("addBtn");
const taskList = document.getElementById("taskList");
const themeToggle = document.getElementById("themeToggle");
const setReminderCheckbox = document.getElementById("setReminderCheckbox");

// Initialize dueDate input visibility based on checkbox
dueDateInput.style.display = setReminderCheckbox.checked ? "inline-block" : "none";

setReminderCheckbox.addEventListener("change", () => {
  dueDateInput.style.display = setReminderCheckbox.checked ? "inline-block" : "none";
  if(!setReminderCheckbox.checked){
    dueDateInput.value = "";
  }
});

// Load theme preference
if(localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark");
  themeToggle.textContent = "☀️";
}

themeToggle.onclick = () => {
  document.body.classList.toggle("dark");
  if(document.body.classList.contains("dark")){
    themeToggle.textContent = "☀️";
    localStorage.setItem("theme", "dark");
  } else {
    themeToggle.textContent = "🌙";
    localStorage.setItem("theme", "light");
  }
};

// Permission for notifications
if ("Notification" in window && Notification.permission === "default") {
  Notification.requestPermission();
}

function formatDateTime(dateStr) {
  if(!dateStr) return "";
  const d = new Date(dateStr);
  if(isNaN(d)) return "";
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

function renderTasks() {
  taskList.innerHTML = "";

  let filteredTasks = [];
  if(currentFilter === "all") filteredTasks = tasks;
  else if(currentFilter === "completed") filteredTasks = tasks.filter(t => t.completed);
  else filteredTasks = tasks.filter(t => !t.completed);

  if(filteredTasks.length === 0) {
    const emptyMsg = document.createElement("p");
    emptyMsg.textContent = "No tasks to show.";
    emptyMsg.style.textAlign = "center";
    emptyMsg.style.color = "gray";
    taskList.appendChild(emptyMsg);
    return;
  }

  filteredTasks.forEach((task, index) => {
    const taskEl = document.createElement("div");
    taskEl.className = "task";
    if(task.completed) taskEl.classList.add("completed");
    taskEl.draggable = true;
    taskEl.setAttribute("data-index", index);
    taskEl.setAttribute("aria-label", `Task: ${task.text}, ${task.completed ? "completed" : "pending"}`);
    taskEl.tabIndex = 0;

    // Drag and Drop events
    taskEl.addEventListener("dragstart", dragStart);
    taskEl.addEventListener("dragover", dragOver);
    taskEl.addEventListener("drop", drop);
    taskEl.addEventListener("dragend", dragEnd);

    const header = document.createElement("div");
    header.className = "task-header";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "complete-checkbox";
    checkbox.checked = task.completed;
    checkbox.setAttribute("aria-label", task.completed ? "Mark task as pending" : "Mark task as completed");
    checkbox.onchange = () => toggleComplete(index);

    const taskText = document.createElement("span");
    taskText.className = "task-text";
    taskText.textContent = task.text;
    taskText.addEventListener("click", () => editTask(index));

    const actions = document.createElement("div");
    actions.className = "actions";

    const editBtn = document.createElement("button");
    editBtn.innerHTML = "✏️";
    editBtn.title = "Edit task";
    editBtn.ariaLabel = "Edit task";
    editBtn.onclick = () => editTask(index);

    const deleteBtn = document.createElement("button");
    deleteBtn.innerHTML = "🗑️";
    deleteBtn.title = "Delete task";
    deleteBtn.ariaLabel = "Delete task";
    deleteBtn.onclick = () => deleteTask(index);

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    header.appendChild(checkbox);
    header.appendChild(taskText);
    header.appendChild(actions);

    const datesDiv = document.createElement("div");
    datesDiv.className = "task-dates";

    datesDiv.innerHTML = `
      <span>➕ Added: ${formatDateTime(task.addedDate)}</span>
      ${task.completedDate ? `<span>✅ Completed: ${formatDateTime(task.completedDate)}</span>` : ""}
      ${task.dueDate ? `<span>⏰ Due: ${formatDateTime(task.dueDate)}</span>` : ""}
    `;

    taskEl.appendChild(header);
    taskEl.appendChild(datesDiv);

    taskList.appendChild(taskEl);
  });
}

addBtn.onclick = () => {
  const text = taskInput.value.trim();
  const reminderSet = setReminderCheckbox.checked;
  const due = reminderSet ? dueDateInput.value : null;

  if(!text) {
    alert("Please enter a task description.");
    return;
  }

  if(reminderSet && !due) {
    alert("Please select a due date and time for the reminder.");
    return;
  }

  if(editIndex !== null) {
    tasks[editIndex].text = text;
    tasks[editIndex].dueDate = due || null;

    // Reset completedDate if marking incomplete?
    if(tasks[editIndex].completed && !tasks[editIndex].dueDate) {
      tasks[editIndex].completedDate = tasks[editIndex].completedDate || null;
    }

    editIndex = null;
    addBtn.textContent = "➕ Add Task";
    setReminderCheckbox.checked = false;
    dueDateInput.style.display = "none";
    dueDateInput.value = "";
  } else {
    tasks.push({
      text,
      completed: false,
      addedDate: new Date().toISOString(),
      completedDate: null,
      dueDate: due || null,
      notified: false
    });
  }

  saveTasks();
  renderTasks();

  taskInput.value = "";
  setReminderCheckbox.checked = false;
  dueDateInput.style.display = "none";
  dueDateInput.value = "";
};

function editTask(index) {
  const task = tasks[index];
  taskInput.value = task.text;
  if(task.dueDate){
    setReminderCheckbox.checked = true;
    dueDateInput.style.display = "inline-block";
    dueDateInput.value = task.dueDate;
  } else {
    setReminderCheckbox.checked = false;
    dueDateInput.style.display = "none";
    dueDateInput.value = "";
  }
  addBtn.textContent = "💾 Save";
  editIndex = index;
}

function deleteTask(index) {
  if(confirm("Are you sure you want to delete this task?")) {
    tasks.splice(index, 1);
    saveTasks();
    renderTasks();
    if(editIndex === index) {
      editIndex = null;
      addBtn.textContent = "➕ Add Task";
      taskInput.value = "";
      setReminderCheckbox.checked = false;
      dueDateInput.style.display = "none";
      dueDateInput.value = "";
    }
  }
}

function toggleComplete(index) {
  tasks[index].completed = !tasks[index].completed;
  tasks[index].completedDate = tasks[index].completed ? new Date().toISOString() : null;
  saveTasks();
  renderTasks();
}

// Filters
document.querySelectorAll(".filters button").forEach(button => {
  button.onclick = () => {
    document.querySelectorAll(".filters button").forEach(btn => {
      btn.classList.remove("active");
      btn.setAttribute("aria-pressed", "false");
    });
    button.classList.add("active");
    button.setAttribute("aria-pressed", "true");

    currentFilter = button.id.replace("filter-", "");
    renderTasks();
  };
});

// Drag and Drop logic
let dragSrcIndex = null;

function dragStart(e) {
  dragSrcIndex = Number(e.currentTarget.getAttribute("data-index"));
  e.dataTransfer.effectAllowed = "move";
  e.dataTransfer.setData("text/plain", dragSrcIndex);
  e.currentTarget.style.opacity = "0.4";
}

function dragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = "move";
}

function drop(e) {
  e.preventDefault();
  const dragTargetIndex = Number(e.currentTarget.getAttribute("data-index"));
  if(dragSrcIndex === null || dragTargetIndex === dragSrcIndex) return;

  // Swap tasks
  const draggedTask = tasks.splice(dragSrcIndex, 1)[0];
  tasks.splice(dragTargetIndex, 0, draggedTask);
  saveTasks();
  renderTasks();
}

function dragEnd(e) {
  e.currentTarget.style.opacity = "1";
  dragSrcIndex = null;
}

// Reminder notifications checker every minute
function checkReminders() {
  if(Notification.permission !== "granted") return;
  const now = new Date();

  tasks.forEach(task => {
    if(task.dueDate && !task.completed) {
      const dueDate = new Date(task.dueDate);
      const diffMs = dueDate - now;

      // Notify if due date is within next 1 minute or overdue but not notified yet
      if(diffMs <= 60000 && diffMs > -60000 && !task.notified) {
        new Notification("⏰ Reminder", {
          body: `Task "${task.text}" is due now!`,
          icon: "https://cdn-icons-png.flaticon.com/512/1827/1827970.png"
        });
        task.notified = true; // mark as notified so no spam
        saveTasks();
      }
    }
  });
}

setInterval(checkReminders, 60000);

renderTasks();
