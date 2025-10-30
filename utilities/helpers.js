import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../model/user/Model.js"
// Standard success response
const successHelper = (res, data, message, status = 200) => {
  res.status(status).json({
    data,
    status: "success",
    message,
  });
};

const hashPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};

// Standard error response
const errorHelper = (res, error, message, status = 400) => {
  console.error("Error:", error);
  res.status(status).json({
    error,
    status: "error",
    message: message || "Something went wrong",
  });
};

// JWT token generation
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id }, // payload
    process.env.JWT_SECRET // secret key
    // no expiresIn option
  );
};

const signToken = (data) => {
  return jwt.sign(data, process.env.JWT_SECRET, {
    expiresIn: '30m',
  });
};


function calculateDueDate(startDate, i, tenureType) {
  const date = new Date(startDate);

  if (tenureType === "months") {
    date.setMonth(date.getMonth() + i);
  } else if (tenureType === "years") {
    date.setFullYear(date.getFullYear() + i);
  } else if (tenureType === "days") {
    date.setDate(date.getDate() + i);
  }

  return date;
}

// Round a number to given decimals (defaults to 2 for currency)
function roundNumber(value, decimals = 2) {
  if (typeof value !== 'number' || !isFinite(value)) return value;
  return Number(value.toFixed(decimals));
}

const addLoanHistoryEntry = async (userId, loanId, amount, status) => {
  try {
    const historyData = {
      approved: {
        title: "Loan Approved",
        message: `₦${amount.toLocaleString()} was approved`,
      },
      rejected: {
        title: "Loan Declined",
        message: `We're sorry your loan was declined`,
      },
      disbursed: {
        title: "Loan Disbursed",
        message: `₦${amount.toLocaleString()} was disbursed to your bank`,
      },
      received: {
        title: "Loan Received",
        message: `Loan of ₦${amount.toLocaleString()} was received`,
      },
      completed: {
        title: "Loan Completed",
        message: `Loan of ₦${amount.toLocaleString()} was completed`,
      },
    };

    const { title, message } = historyData[status] || {
      title: "Loan Update",
      message: `Loan status updated to ${status}`,
    };

    await User.findByIdAndUpdate(
      userId,
      {
        $push: {
          history: {
            title,
            message,
            amount,
            loanId,
            status,
            createdAt: new Date(),
          },
        },
      },
      { new: true }
    );
  } catch (error) {
    console.error("Error adding loan history entry:", error);
  }
};


export {
  successHelper,
  errorHelper,
  generateToken,
  hashPassword,
  signToken,
  calculateDueDate,
  roundNumber,
  addLoanHistoryEntry
};
