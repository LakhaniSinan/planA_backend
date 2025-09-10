import Joi from "joi";
import { Types } from "mongoose";


const validateMongoDbId = (value, helpers) => {
    if (!Types.ObjectId.isValid(value)) {
        return helpers.message("Invalid MongoDB ObjectId");
    }
    return value;
};

const loanRequestSchema = Joi.object({
    userId: Joi.string().custom(validateMongoDbId).required(),
    amount: Joi.number().required(),
    tenureType: Joi.string().valid("days", "months", "years").required(),
    tenureValue: Joi.number().required(),
}).unknown(false);


export { loanRequestSchema };