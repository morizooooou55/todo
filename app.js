const calendarGrid = document.querySelector("#calendarGrid");
const monthLabel = document.querySelector("#monthLabel");
const selectedDateLabel = document.querySelector("#selectedDateLabel");
const dayStats = document.querySelector("#dayStats");
const taskForm = document.querySelector("#taskForm");
const taskTitle = document.querySelector("#taskTitle");
const taskDate = document.querySelector("#taskDate");
const taskPriority = document.querySelector("#taskPriority");
const taskList = document.querySelector("#taskList");
const taskPane = document.querySelector("#taskPane");
const taskTemplate = document.querySelector("#taskTemplate");
const filterButtons = [...document.querySelectorAll(".filter")];

const storageKey = "todo-calendar.tasks.v1";
const dateFormatter = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "long",
  day: "numeric",
  weekday: "short",
});
const monthFormatter = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "long",
});

let tasks = loadTasks();
let selectedDate = toDateKey(new Date());
let visibleMonth = startOfMonth(new Date());
let activeFilter = "all";

document.querySelector("#prevMonth").addEventListener("click", () => {
  visibleMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1);
  render();
});

document.querySelector("#nextMonth").addEventListener("click", () => {
  visibleMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1);
  render();
});

document.querySelector("#todayButton").addEventListener("click", () => {
  const today = new Date();
  selectedDate = toDateKey(today);
  visibleMonth = startOfMonth(today);
  render();
});

taskForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const title = taskTitle.value.trim();

  if (!title) return;

  tasks.unshift({
    id: createId(),
    title,
    date: taskDate.value,
    priority: taskPriority.value,
    done: false,
    createdAt: Date.now(),
  });

  taskTitle.value = "";
  taskPriority.value = "normal";
  saveTasks();
  render();
  taskTitle.focus();
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    filterButtons.forEach((item) => item.classList.toggle("active", item === button));
    renderTaskList();
  });
});

function render() {
  taskDate.value = selectedDate;
  monthLabel.textContent = monthFormatter.format(visibleMonth);
  selectedDateLabel.textContent = dateFormatter.format(fromDateKey(selectedDate));
  renderCalendar();
  renderTaskList();
}

function renderCalendar() {
  calendarGrid.replaceChildren();

  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay();
  const firstVisibleDate = new Date(year, month, 1 - startOffset);
  const todayKey = toDateKey(new Date());

  for (let index = 0; index < 42; index += 1) {
    const date = new Date(firstVisibleDate);
    date.setDate(firstVisibleDate.getDate() + index);

    const key = toDateKey(date);
    const dayTasks = tasks.filter((task) => task.date === key);
    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = "day-cell";
    cell.setAttribute("aria-label", `${dateFormatter.format(date)}、タスク${dayTasks.length}件`);
    cell.addEventListener("click", () => {
      selectedDate = key;
      if (date.getMonth() !== visibleMonth.getMonth()) {
        visibleMonth = startOfMonth(date);
      }
      render();
      scrollTasksIntoView();
    });

    cell.classList.toggle("is-muted", date.getMonth() !== month);
    cell.classList.toggle("is-today", key === todayKey);
    cell.classList.toggle("is-selected", key === selectedDate);

    const number = document.createElement("span");
    number.className = "day-number";
    number.textContent = date.getDate();
    cell.append(number);

    const cellTasks = document.createElement("div");
    cellTasks.className = "cell-tasks";

    dayTasks.slice(0, 3).forEach((task) => {
      const item = document.createElement("span");
      item.className = `cell-task ${task.priority}`;
      item.textContent = task.done ? `✓ ${task.title}` : task.title;
      cellTasks.append(item);
    });

    if (dayTasks.length > 3) {
      const more = document.createElement("span");
      more.className = "cell-more";
      more.textContent = `+${dayTasks.length - 3}`;
      cellTasks.append(more);
    } else if (dayTasks.length > 0) {
      const dot = document.createElement("span");
      dot.className = "cell-more";
      dot.textContent = `${dayTasks.length}`;
      cellTasks.append(dot);
    }

    cell.append(cellTasks);
    calendarGrid.append(cell);
  }
}

function renderTaskList() {
  const dayTasks = tasks
    .filter((task) => task.date === selectedDate)
    .sort((a, b) => Number(a.done) - Number(b.done) || priorityRank(b.priority) - priorityRank(a.priority));
  const openCount = dayTasks.filter((task) => !task.done).length;
  dayStats.textContent = `${dayTasks.length - openCount}/${dayTasks.length}`;

  const visibleTasks = dayTasks.filter((task) => {
    if (activeFilter === "open") return !task.done;
    if (activeFilter === "done") return task.done;
    return true;
  });

  taskList.replaceChildren();

  if (visibleTasks.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "この日のタスクはありません";
    taskList.append(empty);
    return;
  }

  visibleTasks.forEach((task) => {
    const node = taskTemplate.content.firstElementChild.cloneNode(true);
    const title = node.querySelector("strong");
    const meta = node.querySelector("span");
    const checkButton = node.querySelector(".check-button");
    const deleteButton = node.querySelector(".delete-button");

    node.classList.toggle("done", task.done);
    title.textContent = task.title;
    meta.textContent = priorityLabel(task.priority);

    checkButton.addEventListener("click", () => {
      task.done = !task.done;
      saveTasks();
      render();
    });

    deleteButton.addEventListener("click", () => {
      tasks = tasks.filter((item) => item.id !== task.id);
      saveTasks();
      render();
    });

    taskList.append(node);
  });
}

function scrollTasksIntoView() {
  if (window.matchMedia("(max-width: 700px)").matches) {
    taskPane.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function loadTasks() {
  try {
    return JSON.parse(localStorage.getItem(storageKey)) ?? seedTasks();
  } catch {
    return seedTasks();
  }
}

function saveTasks() {
  localStorage.setItem(storageKey, JSON.stringify(tasks));
}

function seedTasks() {
  const today = toDateKey(new Date());
  return [
    {
      id: createId(),
      title: "カレンダーから日付を選ぶ",
      date: today,
      priority: "normal",
      done: false,
      createdAt: Date.now(),
    },
    {
      id: createId(),
      title: "今日のタスクを追加する",
      date: today,
      priority: "high",
      done: false,
      createdAt: Date.now() + 1,
    },
  ];
}

function createId() {
  if (globalThis.crypto?.randomUUID) {
    return crypto.randomUUID();
  }

  return `task-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function fromDateKey(key) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function priorityRank(priority) {
  return { high: 3, normal: 2, low: 1 }[priority] ?? 2;
}

function priorityLabel(priority) {
  return { high: "優先度: 高", normal: "優先度: 通常", low: "優先度: 低" }[priority] ?? "優先度: 通常";
}

render();
