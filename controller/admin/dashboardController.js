import catchAsync from "../../utilities/catchAsync.js";
import UserModel from "../../model/user/Model.js";
import LoanRequest from "../../model/user/loanRequestModel.js";
import { successHelper } from "../../utilities/helpers.js";
import InstallmentModel from "../../model/loanManagement/repaymentSlip.js";

const getDashboardData = catchAsync(async (req, res) => {
  var date = new Date();
  var firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  var lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  firstDay.setHours(0, 0, 0, 0);
  lastDay.setHours(23, 59, 59, 999);

  const [
    totalUsers,
    activeUsers,
    inactiveUsers,
    totalLoans,
    pendingLoans,
    rejectedLoans,
    approvedLoans,
    completedLoans,
    totalLoansAmount,
    totalBursedAmount,
    currentMonthRepayments,
    monthlyStats,
  ] = await Promise.all([
    UserModel.countDocuments(),
    UserModel.countDocuments({ status: true }),
    UserModel.countDocuments({ status: false }),
    LoanRequest.countDocuments(),
    LoanRequest.countDocuments({ status: "pending" }),
    LoanRequest.countDocuments({ status: "rejected" }),
    LoanRequest.countDocuments({ status: "approved" }),
    LoanRequest.countDocuments({ status: "completed" }),
    LoanRequest.aggregate([
      { $match: { status: { $in: ["approved", "completed"] } } },
      { $group: { _id: null, total: { $sum: "$requestedAmount" } } },
    ]),
    InstallmentModel.aggregate([
      { $match: { status: "paid" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    InstallmentModel.aggregate([
      {
        $match: {
          status: "pending",
          dueDate: { $gte: firstDay, $lte: lastDay },
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    InstallmentModel.aggregate([
      {
        $group: {
          _id: { month: { $month: "$dueDate" }, status: "$status" },
          total: { $sum: "$amount" },
        },
      },
      {
        $group: {
          _id: "$_id.month",
          paid: {
            $sum: {
              $cond: [{ $eq: ["$_id.status", "paid"] }, "$total", 0],
            },
          },
          pending: {
            $sum: {
              $cond: [{ $eq: ["$_id.status", "pending"] }, "$total", 0],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          month: "$_id",
          paid: 1,
          pending: 1,
        },
      },
      { $sort: { month: 1 } },
    ]),
  ]);

  console.log(monthlyStats, "monthlyStats");

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const chartData = {
    categories: [],
    received: [],
    pending: [],
  };

  monthlyStats.forEach((item) => {
    chartData.categories.push(monthNames[item.month - 1]);
    chartData.received.push(item.paid);
    chartData.pending.push(item.pending);
  });

  const finalData = {
    totalUsers,
    activeUsers,
    inactiveUsers,
    totalLoans,
    pendingLoans,
    rejectedLoans,
    approvedLoans,
    completedLoans,
    totalLoansAmount: totalLoansAmount[0]?.total || 0,
    totalBursedAmount: totalBursedAmount[0]?.total || 0,
    currentMonthRepayments: currentMonthRepayments[0]?.total || 0,
    barChartData: chartData,
  };

  return successHelper(res, finalData, "Dashboard data fetched successfully");
});

export default getDashboardData;
