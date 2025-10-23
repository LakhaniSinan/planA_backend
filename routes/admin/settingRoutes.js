import express from "express";
import {
  createSetting,
  getSettings,
  updateSetting,
} from "../../controller/admin/settingController.js";

const router = express.Router();

router.post("/create", createSetting);
router.get("/fetch", getSettings);
router.put("/fetch/:id", updateSetting);

export default router;
