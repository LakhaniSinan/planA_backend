import express from "express";
import {
  createSetting,
  getSettings,
  updateSetting,
} from "../../controller/admin/settingController.js";

const router = express.Router();

router.post("/setting", createSetting);
router.get("/setting", getSettings);
router.put("/setting/:id", updateSetting);

export default router;
