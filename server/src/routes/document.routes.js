const express = require('express');
const documentController = require('../controllers/document.controller');
const { authenticateUser } = require('../middlewares/auth');
const { upload } = require('../services/storage.service');

const router = express.Router();

router.use(authenticateUser);

/**
 * @route   GET /api/documents
 * @desc    List documents with role scoping
 * @access  Private (All Authenticated)
 */
router.get('/', documentController.listDocuments);

/**
 * @route   POST /api/documents
 * @desc    Upload document file with multipart data
 * @access  Private (All Authenticated)
 */
router.post('/', upload.single('file'), documentController.uploadDocument);

/**
 * @route   GET /api/documents/:id/download
 * @desc    Download / Stream file (resource authorization)
 * @access  Private (Authorized User)
 */
router.get('/:id/download', documentController.downloadDocument);

/**
 * @route   GET /api/documents/:id
 * @desc    Get document metadata
 * @access  Private (Authorized User)
 */
router.get('/:id', documentController.getDocument);

/**
 * @route   PATCH /api/documents/:id
 * @desc    Archive document
 * @access  Private (Owner or Admin/HR)
 */
router.patch('/:id', documentController.archiveDocument);

/**
 * @route   DELETE /api/documents/:id
 * @desc    Delete document permanently
 * @access  Private (Admin, HR)
 */
router.delete('/:id', documentController.deleteDocument);

module.exports = router;
