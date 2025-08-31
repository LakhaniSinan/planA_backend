// controller/admin/supportController.js
import SupportTicket from "../../model/user/supportModel.js";
import Notification from "../../model/user/notificationModel.js";
import { successHelper, errorHelper } from "../../utilities/helpers.js";

// Get all support tickets
const getAllSupportTickets = async (req, res) => {
  try {
    const tickets = await SupportTicket.find()
      .sort({ createdAt: -1 })
      .populate("userId", "name email");

    return successHelper(res, tickets, "Support tickets fetched successfully");
  } catch (error) {
    return errorHelper(res, error, "Failed to fetch support tickets");
  }
};

// Reply to support ticket
const replyToTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminReply, status } = req.body;

    if (!adminReply) {
      return errorHelper(res, null, "Admin reply is required", 400);
    }

    const ticket = await SupportTicket.findByIdAndUpdate(
      id,
      {
        adminReply,
        repliedAt: new Date(),
        status: status || "in_progress"
      },
      { new: true }
    ).populate("userId", "name email");

    if (!ticket) {
      return errorHelper(res, null, "Support ticket not found", 404);
    }

    // Create notification for user
    await Notification.create({
      userId: ticket.userId._id,
      title: "Support Ticket Reply",
      message: `Admin replied to your ticket: "${ticket.subject}"`,
      type: "system"
    });

    return successHelper(res, ticket, "Reply sent successfully");
  } catch (error) {
    return errorHelper(res, error, "Failed to send reply");
  }
};

// Update ticket status
const updateTicketStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return errorHelper(res, null, "Status is required", 400);
    }

    const ticket = await SupportTicket.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate("userId", "name email");

    if (!ticket) {
      return errorHelper(res, null, "Support ticket not found", 404);
    }

    return successHelper(res, ticket, "Ticket status updated successfully");
  } catch (error) {
    return errorHelper(res, error, "Failed to update ticket status");
  }
};

export {
  getAllSupportTickets,
  replyToTicket,
  updateTicketStatus,
};