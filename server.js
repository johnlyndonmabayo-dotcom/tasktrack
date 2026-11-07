
const express = require("express");
const Database = require("better-sqlite3");
const path = require("path");

const app = express();
const dbPath = process.env.DATABASE_PATH ||
    path.join(__dirname, "tasktrack.db");

const db = new Database(dbPath);
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    deadline TEXT,
    status TEXT DEFAULT 'Pending',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

app.get("/api/tasks", (req, res) => {
  const tasks = db.prepare(
    "SELECT * FROM tasks ORDER BY id DESC"
  ).all();

  res.json(tasks);
});

app.post("/api/tasks", (req, res) => {
  const { title, description, deadline } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({
      error: "Task title is required"
    });
  }

  const result = db.prepare(`
    INSERT INTO tasks (title, description, deadline)
    VALUES (?, ?, ?)
  `).run(title.trim(), description || "", deadline || "");

  res.status(201).json({
    id: result.lastInsertRowid,
    message: "Task created successfully"
  });
});

app.put("/api/tasks/:id", (req, res) => {
  const { title, description, deadline, status } = req.body;

  const result = db.prepare(`
    UPDATE tasks
    SET title = ?, description = ?, deadline = ?, status = ?
    WHERE id = ?
  `).run(
    title,
    description || "",
    deadline || "",
    status,
    req.params.id
  );

  if (!result.changes) {
    return res.status(404).json({
      error: "Task not found"
    });
  }

  res.json({ message: "Task updated successfully" });
});

app.delete("/api/tasks/:id", (req, res) => {
  const result = db.prepare(
    "DELETE FROM tasks WHERE id = ?"
  ).run(req.params.id);

  if (!result.changes) {
    return res.status(404).json({
      error: "Task not found"
    });
  }

  res.json({ message: "Task deleted successfully" });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`TaskTrack running on port ${PORT}`);
});
