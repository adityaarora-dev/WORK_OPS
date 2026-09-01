const employeeService = require('../services/employee.service');

/**
 * Controller to list employees with pagination, search, and filtering.
 * Enforces role-based data scoping automatically in the service.
 *
 * @route GET /api/employees
 */
const listEmployees = async (req, res, next) => {
  try {
    const result = await employeeService.getEmployees({
      user: req.user,
      query: req.query,
    });

    return res.status(200).json({
      success: true,
      message: 'Employees retrieved successfully',
      data: result.employees,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to get a single employee record.
 * Enforces resource-level access control.
 *
 * @route GET /api/employees/:id
 */
const getEmployee = async (req, res, next) => {
  try {
    const employee = await employeeService.getEmployeeById({
      user: req.user,
      id: req.params.id,
    });

    return res.status(200).json({
      success: true,
      message: 'Employee retrieved successfully',
      data: employee,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to create an employee record.
 * Allowed for ADMIN and HR only.
 *
 * @route POST /api/employees
 */
const createEmployee = async (req, res, next) => {
  try {
    const { firstName, lastName, email, department, designation } = req.body;

    if (!firstName || !lastName || !email || !department || !designation) {
      return res.status(400).json({
        success: false,
        message: 'Required fields missing: firstName, lastName, email, department, and designation are mandatory.',
      });
    }

    const employee = await employeeService.createEmployee({
      user: req.user,
      data: req.body,
    });

    return res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      data: employee,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to update an existing employee record.
 * Allowed for ADMIN and HR only.
 *
 * @route PATCH /api/employees/:id
 */
const updateEmployee = async (req, res, next) => {
  try {
    const updated = await employeeService.updateEmployee({
      user: req.user,
      id: req.params.id,
      data: req.body,
    });

    return res.status(200).json({
      success: true,
      message: 'Employee updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to soft-deactivate an employee record.
 * Allowed for ADMIN and HR only.
 *
 * @route DELETE /api/employees/:id
 */
const deactivateEmployee = async (req, res, next) => {
  try {
    const deactivated = await employeeService.deactivateEmployee({
      user: req.user,
      id: req.params.id,
    });

    return res.status(200).json({
      success: true,
      message: 'Employee deactivated successfully',
      data: deactivated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to get list of distinct departments.
 *
 * @route GET /api/employees/meta/departments
 */
const getDepartments = async (req, res, next) => {
  try {
    const departments = await employeeService.getDistinctDepartments();
    return res.status(200).json({
      success: true,
      data: departments,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deactivateEmployee,
  getDepartments,
};
