// controller/user/supportController.js
import SupportTicket from "../../model/user/supportModel.js";
import Admin from "../../model/admin/Model.js";
import sendEmail from "../../utilities/email.js";
import { successHelper, errorHelper } from "../../utilities/helpers.js";

const createSupportTicket = async (req, res) => {
  try {
    const { subject, message, category } = req.body;

    if (!subject || !message) {
      return errorHelper(res, null, "Subject and message are required", 400);
    }

    const ticket = await SupportTicket.create({
      userId: req.user._id,
      subject,
      message,
      category: category || ""
    });

    const populatedTicket = await SupportTicket.findById(ticket._id)
      .populate("userId", "name email");

    const response = successHelper(
      res, 
      populatedTicket, 
      "Support ticket created successfully", 
      201
    );

    setTimeout(async () => {
      try {
        const admins = await Admin.find({ role: "admin" });
        const emailPromises = admins.map(admin => 
          sendEmail(
            admin.email,
            "New Support Ticket",
            `User ${req.user.name} created a new support ticket: ${subject}`
          ).catch(err => console.log("Email failed for", admin.email, err.message))
        );
        
        Promise.allSettled(emailPromises);
      } catch (emailError) {
        console.log("Background email error:", emailError.message);
      }
    }, 100);

    return response;
  } catch (error) {
    console.log("Support ticket error:", error);
    return errorHelper(res, error, "Failed to create support ticket");
  }
};

// Get user's OPEN support tickets only
const getMySupportTickets = async (req, res) => {
  try {
    const tickets = await SupportTicket.find({ 
      userId: req.user._id,
    })
      .sort({ createdAt: -1 })
      .populate("userId", "name email status");

    return successHelper(res, tickets, "Support tickets fetched successfully");
  } catch (error) {
    return errorHelper(res, error, "Failed to fetch support tickets");
  }
};

const getSupportTicketById = async (req, res) => {
  try {
    const { id } = req.params;

    const ticket = await SupportTicket.findOne({
      _id: id,
      userId: req.user._id
    }).populate("userId", "name email");

    if (!ticket) {
      return errorHelper(res, null, "Support ticket not found", 404);
    }

    return successHelper(res, ticket, "Support ticket fetched successfully");
  } catch (error) {
    return errorHelper(res, error, "Failed to fetch support ticket");
  }
};

export {
  createSupportTicket,
  getMySupportTickets,
  getSupportTicketById,
};  