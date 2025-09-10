const validationOptions = {
    abortEarly: true,
    allowUnknown: false,
    stripUnknown: true,
  };
  
  const schemaValidator = (body, schema, useJoiError = true, customError) => {
    if (!schema) return ["Schema not found", null];
  
    const { error, value } = schema.validate(body, validationOptions);
  
    if (error) {
      const joiError = {
        status: "failed",
        error: {
          original: error._original,
          details: error.details.map(({ message, type }) => ({
            message: message.replace(/['"]/g, ""),
            type,
          })),
        },
      };
  
      return [
        useJoiError ? joiError.error.details[0].message : customError,
        null,
      ];
    } else {
      return [null, value];
    }
  };
  
  module.exports = { schemaValidator };
  