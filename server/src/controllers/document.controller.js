const fs = require('fs');
const documentService = require('../services/document.service');

const listDocuments = async (req, res, next) => {
  try {
    const result = await documentService.getDocumentsList({
      user: req.user,
      query: req.query,
    });
    return res.status(200).json({
      success: true,
      data: result.documents,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

const getDocument = async (req, res, next) => {
  try {
    const doc = await documentService.getDocumentById({
      user: req.user,
      id: req.params.id,
    });
    return res.status(200).json({
      success: true,
      data: doc,
    });
  } catch (error) {
    next(error);
  }
};

const downloadDocument = async (req, res, next) => {
  try {
    const doc = await documentService.getDocumentById({
      user: req.user,
      id: req.params.id,
    });

    if (!fs.existsSync(doc.filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found on storage server.',
      });
    }

    return res.download(doc.filePath, doc.fileName);
  } catch (error) {
    next(error);
  }
};

const uploadDocument = async (req, res, next) => {
  try {
    const doc = await documentService.createDocument({
      user: req.user,
      file: req.file,
      data: req.body,
    });
    return res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      data: doc,
    });
  } catch (error) {
    next(error);
  }
};

const archiveDocument = async (req, res, next) => {
  try {
    const doc = await documentService.archiveDocument({
      user: req.user,
      id: req.params.id,
    });
    return res.status(200).json({
      success: true,
      message: 'Document archived successfully',
      data: doc,
    });
  } catch (error) {
    next(error);
  }
};

const deleteDocument = async (req, res, next) => {
  try {
    const result = await documentService.deleteDocument({
      user: req.user,
      id: req.params.id,
    });
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listDocuments,
  getDocument,
  downloadDocument,
  uploadDocument,
  archiveDocument,
  deleteDocument,
};
