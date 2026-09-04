const departmentService = require('../services/department.service');

const listDepartments = async (req, res, next) => {
  try {
    const result = await departmentService.getDepartments({
      user: req.user,
      query: req.query,
    });

    return res.status(200).json({
      success: true,
      message: 'Departments retrieved successfully',
      data: result.departments,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

const getDepartment = async (req, res, next) => {
  try {
    const department = await departmentService.getDepartmentById({
      user: req.user,
      id: req.params.id,
    });

    return res.status(200).json({
      success: true,
      message: 'Department details retrieved successfully',
      data: department,
    });
  } catch (error) {
    next(error);
  }
};

const createDepartment = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Department name is required',
      });
    }

    const department = await departmentService.createDepartment({
      user: req.user,
      data: req.body,
    });

    return res.status(201).json({
      success: true,
      message: 'Department created successfully',
      data: department,
    });
  } catch (error) {
    next(error);
  }
};

const updateDepartment = async (req, res, next) => {
  try {
    const updated = await departmentService.updateDepartment({
      user: req.user,
      id: req.params.id,
      data: req.body,
    });

    return res.status(200).json({
      success: true,
      message: 'Department updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

const deactivateDepartment = async (req, res, next) => {
  try {
    const deactivated = await departmentService.deactivateDepartment({
      user: req.user,
      id: req.params.id,
    });

    return res.status(200).json({
      success: true,
      message: 'Department deactivated successfully',
      data: deactivated,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listDepartments,
  getDepartment,
  createDepartment,
  updateDepartment,
  deactivateDepartment,
};
