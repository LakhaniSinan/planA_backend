import catchAsync from "../../utilities/catchAsync.js";
import SettingModel from "../../model/admin/settingModel.js";
import { schemaValidator } from "../../middleware/schemaMiddleware.js";
import { errorHelper, successHelper } from "../../utilities/helpers.js";
import { AppError } from "../../middleware/errorMiddleware.js";
import { updateSettingSchema } from "../../utilities/validation.js";

const createSetting = catchAsync(async (req, res, next) => {
  const setting = await SettingModel.create(req.body);
  successHelper(res, setting, "Settings created successfully");
});

const updateSetting = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const [error, validatedData] = schemaValidator(req.body, updateSettingSchema);
  if (error) return next(new AppError(error, 400));
  const setting = await SettingModel.findByIdAndUpdate(id, validatedData, {
    new: true,
  });
  if (!setting) return next(new AppError("Setting not found", 404));
  successHelper(res, setting, "Settings updated successfully");
});

const getSettings = catchAsync(async (req, res) => {
  try {
    const select = req.query.select || "";
    const settings = await SettingModel.findOne()
    successHelper(res, settings, "Settings fetched successfully");
  }
  catch (error) {
    errorHelper(res, error, error);
  }
});

export { createSetting, updateSetting, getSettings };
