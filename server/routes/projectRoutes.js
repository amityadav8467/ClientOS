const express = require("express");
const router = express.Router();
const { getProjects, createProject, getProjectById, updateProject, deleteProject, updateTasks } = require("../controllers/projectController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

router.use(protect, adminOnly);
router.route("/").get(getProjects).post(createProject);
router.route("/:id").get(getProjectById).put(updateProject).delete(deleteProject);
router.put("/:id/tasks", updateTasks);

module.exports = router;
