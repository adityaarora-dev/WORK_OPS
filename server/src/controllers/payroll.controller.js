const payrollService = require('../services/payroll.service');

const listPayroll = async (req, res, next) => {
  try {
    const result = await payrollService.getPayrollList({
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
    const summary = await payrollService.getPayrollSummary({
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

const getPayroll = async (req, res, next) => {
  try {
    const payroll = await payrollService.getPayrollById({
      user: req.user,
      id: req.params.id,
    });
    return res.status(200).json({
      success: true,
      data: payroll,
    });
  } catch (error) {
    next(error);
  }
};

const createPayroll = async (req, res, next) => {
  try {
    const { employee, basicSalary } = req.body;
    if (!employee || basicSalary === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Employee and basic salary are required.',
      });
    }

    const payroll = await payrollService.createPayroll({
      user: req.user,
      data: req.body,
    });
    return res.status(201).json({
      success: true,
      message: 'Payroll generated successfully',
      data: payroll,
    });
  } catch (error) {
    next(error);
  }
};

const updatePayroll = async (req, res, next) => {
  try {
    const updated = await payrollService.updatePayroll({
      user: req.user,
      id: req.params.id,
      data: req.body,
    });
    return res.status(200).json({
      success: true,
      message: 'Payroll updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listPayroll,
  getSummary,
  getPayroll,
  createPayroll,
  updatePayroll,
};
