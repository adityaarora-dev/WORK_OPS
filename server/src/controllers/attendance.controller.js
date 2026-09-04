const attendanceService = require('../services/attendance.service');

const listAttendance = async (req, res, next) => {
  try {
    const result = await attendanceService.getAttendanceList({
      user: req.user,
      query: req.query,
    });
    return res.status(200).json({
      success: true,
      data: result.records,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

const getSummary = async (req, res, next) => {
  try {
    const summary = await attendanceService.getAttendanceSummary({
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

const getAttendance = async (req, res, next) => {
  try {
    const record = await attendanceService.getAttendanceById({
      user: req.user,
      id: req.params.id,
    });
    return res.status(200).json({
      success: true,
      data: record,
    });
  } catch (error) {
    next(error);
  }
};

const markAttendance = async (req, res, next) => {
  try {
    const record = await attendanceService.recordAttendance({
      user: req.user,
      data: req.body,
    });
    return res.status(201).json({
      success: true,
      message: 'Attendance recorded successfully',
      data: record,
    });
  } catch (error) {
    next(error);
  }
};

const updateAttendance = async (req, res, next) => {
  try {
    const record = await attendanceService.updateAttendance({
      user: req.user,
      id: req.params.id,
      data: req.body,
    });
    return res.status(200).json({
      success: true,
      message: 'Attendance updated successfully',
      data: record,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listAttendance,
  getSummary,
  getAttendance,
  markAttendance,
  updateAttendance,
};
