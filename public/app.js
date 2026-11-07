const API = "/api/tasks";

let tasks = [];
let editingId = null;

const taskList = document.getElementById("taskList");
const modal = document.getElementById("taskModal");
const form = document.getElementById("taskForm");

document.getElementById("today").textContent =
    new Date().toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric"
    });

async function request(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...options.headers
        }
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "Something went wrong.");
    }

    return data;
}

async function loadTasks() {
    try {
        tasks = await request(API);
        updateDashboard();
        displayTasks();
    } catch (error) {
        taskList.innerHTML =
            `<p class="empty">${error.message}</p>`;
    }
}

function updateDashboard() {
    document.getElementById("totalTasks").textContent =
        tasks.length;

    document.getElementById("pendingTasks").textContent =
        tasks.filter(t => t.status === "Pending").length;

    document.getElementById("completedTasks").textContent =
        tasks.filter(t => t.status === "Completed").length;
}

function escapeHTML(value = "") {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

function displayTasks() {
    const search = document.getElementById("searchInput")
        .value.toLowerCase();

    const filter = document.getElementById("filterStatus").value;

    const filtered = tasks.filter(task => {
        const matchesSearch =
            task.title.toLowerCase().includes(search) ||
            (task.description || "").toLowerCase().includes(search);

        const matchesFilter =
            filter === "All" || task.status === filter;

        return matchesSearch && matchesFilter;
    });

    if (filtered.length === 0) {
        taskList.innerHTML =
            `<p class="empty">No tasks found. Add your first task!</p>`;
        return;
    }

    taskList.innerHTML = filtered.map(task => `
        <div class="task-item">

            <div class="task-info">
                <h3>${escapeHTML(task.title)}</h3>

                <p>${escapeHTML(task.description || "No description")}</p>

                <p>Deadline: ${escapeHTML(task.deadline || "No deadline")}</p>

                <span class="badge ${task.status === "Completed" ? "completed" : ""}">
                    ${escapeHTML(task.status)}
                </span>
            </div>

            <div class="task-actions">

                ${task.status === "Pending" ? `
                    <button class="complete-btn"
                        onclick="changeStatus(${task.id}, 'Completed')">
                        Complete
                    </button>
                ` : `
                    <button class="complete-btn"
                        onclick="changeStatus(${task.id}, 'Pending')">
                        Undo
                    </button>
                `}

                <button class="edit-btn"
                    onclick="editTask(${task.id})">
                    Edit
                </button>

                <button class="delete-btn"
                    onclick="deleteTask(${task.id})">
                    Delete
                </button>

            </div>
        </div>
    `).join("");
}

function openForm() {
    editingId = null;
    form.reset();

    document.getElementById("formTitle").textContent =
        "Add New Task";

    document.getElementById("saveBtn").textContent =
        "Save Task";

    modal.style.display = "flex";
}

function closeForm() {
    modal.style.display = "none";
    editingId = null;
}

function editTask(id) {
    const task = tasks.find(t => t.id === id);

    if (!task) return;

    editingId = id;

    document.getElementById("title").value = task.title;
    document.getElementById("description").value =
        task.description || "";
    document.getElementById("deadline").value =
        task.deadline || "";

    document.getElementById("formTitle").textContent =
        "Edit Task";

    document.getElementById("saveBtn").textContent =
        "Update Task";

    modal.style.display = "flex";
}

form.addEventListener("submit", async function(event) {
    event.preventDefault();

    const title = document.getElementById("title").value.trim();
    const description =
        document.getElementById("description").value.trim();
    const deadline = document.getElementById("deadline").value;

    if (!title) {
        alert("Please enter a task title.");
        return;
    }

    const existing = tasks.find(t => t.id === editingId);

    const taskData = {
        title,
        description,
        deadline,
        status: existing ? existing.status : "Pending"
    };

    try {
        if (editingId) {
            await request(`${API}/${editingId}`, {
                method: "PUT",
                body: JSON.stringify(taskData)
            });

            alert("Task updated successfully!");
        } else {
            await request(API, {
                method: "POST",
                body: JSON.stringify(taskData)
            });

            alert("Task added successfully!");
        }

        closeForm();
        await loadTasks();

    } catch (error) {
        alert(error.message);
    }
});

async function changeStatus(id, status) {
    const task = tasks.find(t => t.id === id);

    if (!task) return;

    try {
        await request(`${API}/${id}`, {
            method: "PUT",
            body: JSON.stringify({
                title: task.title,
                description: task.description,
                deadline: task.deadline,
                status
            })
        });

        await loadTasks();

    } catch (error) {
        alert(error.message);
    }
}

async function deleteTask(id) {
    if (!confirm("Are you sure you want to delete this task?")) {
        return;
    }

    try {
        await request(`${API}/${id}`, {
            method: "DELETE"
        });

        alert("Task deleted successfully!");
        await loadTasks();

    } catch (error) {
        alert(error.message);
    }
}

document.getElementById("searchInput")
    .addEventListener("input", displayTasks);

document.getElementById("filterStatus")
    .addEventListener("change", displayTasks);

loadTasks();