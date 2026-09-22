
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;

const MONGO_URL =
  process.env.MONGO_URL || "mongodb://localhost:27017/todos";

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

mongoose
  .connect(MONGO_URL)
  .then(() => console.log("Connected to MongoDB at", MONGO_URL))
  .catch((err) => console.error("MongoDB connection error:", err.message));

const todoSchema = new mongoose.Schema({
  text: { type: String, required: true },
  done: { type: Boolean, default: false },
});

const Todo = mongoose.model("Todo", todoSchema);

app.get("/todos", async (req, res) => {
  const todos = await Todo.find().sort({ _id: -1 });
  res.json(todos);
});

app.post("/todos", async (req, res) => {
  const todo = await Todo.create({ text: req.body.text });
  res.json(todo);
});

app.delete("/todos/:id", async (req, res) => {
  await Todo.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

app.listen(PORT, () =>
  console.log(`To-do app listening on port ${PORT}`)
);