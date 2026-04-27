const authShell = document.querySelector("#authShell");
const appShell = document.querySelector("#appShell");
const authForm = document.querySelector("#authForm");
const authEmail = document.querySelector("#authEmail");
const authPassword = document.querySelector("#authPassword");
const authMessage = document.querySelector("#authMessage");
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
const logoutButton = document.querySelector("#logoutButton");

const config = window.SUPABASE_CONFIG ?? {};
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

let supabaseClient;
let currentUser = null;
let tasks = [];
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

authForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const action = event.submitter?.dataset.authAction;
  const email = authEmail.value.trim();
  const password = authPassword.value;

  setAuthMessage("処理しています...");

  const result =
    action === "signup"
      ? await supabaseClient.auth.signUp({ email, password })
      : await supabaseClient.auth.signInWithPassword({ email, password });

  if (result.error) {
    setAuthMessage(toJapaneseAuthError(result.error.message));
    return;
  }

  if (action === "signup" && !result.data.session) {
    setAuthMessage("登録メールを確認してください。確認後にログインできます。");
    return;
  }

  setAuthMessage("");
});

logoutButton.addEventListener("click", async () => {
  await supabaseClient.auth.signOut();
});

taskForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const title = taskTitle.value.trim();

  if (!title || !currentUser) return;

  setTaskFormEnabled(false);
  const { data, error } = await supabaseClient
    .from("tasks")
    .insert({
      user_id: currentUser.id,
      title,
      task_date: taskDate.value,
      priority: taskPriority.value,
      done: false,
    })
    .select()
    .single();

  setTaskFormEnabled(true);

  if (error) {
    showTaskMessage("タスクを追加できませんでした。Supabaseの設定を確認してください。");
    return;
  }

  tasks.unshift(fromDatabaseTask(data));
  taskTitle.value = "";
  taskPriority.value = "normal";
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

init();

async function init() {
  if (!isConfigured()) {
    setAuthMessage("SupabaseのURLとanon keyを supabase-config.js に入れてください。");
    authForm.classList.add("is-hidden");
    return;
  }

  supabaseClient = window.supabase.createClient(config.url, config.anonKey);
  const { data } = await supabaseClient.auth.getSession();
  await handleSession(data.session);

  supabaseClient.auth.onAuthStateChange((_event, session) => {
    handleSession(session);
  });
}

async function handleSession(session) {
  currentUser = session?.user ?? null;

  if (!currentUser) {
    tasks = [];
    authShell.classList.remove("is-hidden");
    appShell.classList.add("is-hidden");
    render();
    return;
  }

  authShell.classList.add("is-hidden");
  appShell.classList.remove("is-hidden");
  await loadTasks();
  render();
}

async function loadTasks() {
  const { data, error } = await supabaseClient
    .from("tasks")
    .select("id,title,task_date,priority,done,created_at")
    .eq("user_id", currentUser.id)
    .order("created_at", { ascending: false });

  if (error) {
    tasks = [];
    showTaskMessage("タスクを読み込めませんでした。SupabaseのSQL設定を確認してください。");
    return;
  }

  tasks = data.map(fromDatabaseTask);
}

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
    showTaskMessage("この日のタスクはありません");
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

    checkButton.addEventListener("click", () => toggleTask(task));
    deleteButton.addEventListener("click", () => deleteTask(task));

    taskList.append(node);
  });
}

async function toggleTask(task) {
  const nextDone = !task.done;
  const { error } = await supabaseClient
    .from("tasks")
    .update({ done: nextDone })
    .eq("id", task.id)
    .eq("user_id", currentUser.id);

  if (error) {
    showTaskMessage("タスクを更新できませんでした。");
    return;
  }

  task.done = nextDone;
  render();
}

async function deleteTask(task) {
  const { error } = await supabaseClient.from("tasks").delete().eq("id", task.id).eq("user_id", currentUser.id);

  if (error) {
    showTaskMessage("タスクを削除できませんでした。");
    return;
  }

  tasks = tasks.filter((item) => item.id !== task.id);
  render();
}

function showTaskMessage(message) {
  taskList.replaceChildren();
  const empty = document.createElement("div");
  empty.className = "empty-state";
  empty.textContent = message;
  taskList.append(empty);
}

function setTaskFormEnabled(enabled) {
  [...taskForm.elements].forEach((element) => {
    element.disabled = !enabled;
  });
}

function scrollTasksIntoView() {
  if (window.matchMedia("(max-width: 700px)").matches) {
    taskPane.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function fromDatabaseTask(task) {
  return {
    id: task.id,
    title: task.title,
    date: task.task_date,
    priority: task.priority,
    done: task.done,
    createdAt: task.created_at,
  };
}

function isConfigured() {
  return (
    typeof window.supabase !== "undefined" &&
    config.url &&
    config.anonKey &&
    !config.url.includes("YOUR_SUPABASE") &&
    !config.anonKey.includes("YOUR_SUPABASE")
  );
}

function setAuthMessage(message) {
  authMessage.textContent = message;
}

function toJapaneseAuthError(message) {
  if (message.includes("Invalid login credentials")) return "メールアドレスかパスワードが違います。";
  if (message.includes("Password should be at least")) return "パスワードは6文字以上にしてください。";
  if (message.includes("User already registered")) return "このメールアドレスはすでに登録されています。";
  return `エラー: ${message}`;
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
