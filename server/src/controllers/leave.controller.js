const leaveService = require('../services/leave.service');

const listLeaves = async (req, res, next) => {
  try {
    const result = await leaveService.getLeavesList({
      user: req.user,
      query: req.query,
    });
    return res.status(200).json({
      success: true,
      data: result.leaves,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

const getSummary = async (req, res, next) => {
  try {
    const summary = await leaveService.getLeaveSummary({
      user: req.user,
    });
    return res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};

const getLeave = async (req, res, next) => {
  try {
    const leave = await leaveService.getLeaveById({
      user: req.user,
      id: req.params.id,
    });
    return res.status(200).json({
      success: true,
      data: leave,
    });
  } catch (error) {
    next(error);
  }
};

const applyLeave = async (req, res, next) => {
  try {
    const { startDate, endDate, reason } = req.body;
    if (!startDate || !endDate || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Start date, end date, and reason are required.',
      });
    }

    const leave = await leaveService.applyLeave({
      user: req.user,
      data: req.body,
    });
    return res.status(201).json({
      success: true,
      message: 'Leave application submitted successfully',
      data: leave,
    });
  } catch (error) {
    next(error);
  }
};

const reviewLeave = async (req, res, next) => {
  try {
    const { status, comment } = req.body;
    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be either "approved" or "rejected".',
      });
    }

    const leave = await leaveService.reviewLeave({
      user: req.user,
      id: req.params.id,
      status,
      comment,
    });
    return res.status(200).json({
      success: true,
      message: `Leave request ${status} successfully`,
      data: leave,
    });
  } catch (error) {
    next(error);
  }
};

const cancelLeave = async (req, res, next) => {
  try {
    const leave = await leaveService.cancelLeave({
      user: req.user,
      id: req.params.id,
    });
    return res.status(200).json({
      success: true,
      message: 'Leave request cancelled successfully',
      data: leave,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listLeaves,
  getSummary,
  getLeave,
  applyLeave,
  reviewLeave,
  cancelLeave,
};
