"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("@/middleware/auth");
const router = (0, express_1.Router)();
/**
 * GET /api/reports
 */
router.get('/', auth_1.authenticate, async (req, res) => {
    res.json({ success: true, data: [] });
});
/**
 * POST /api/reports
 */
router.post('/', auth_1.authenticate, async (req, res) => {
    res.status(201).json({ success: true, data: { id: 'new-id', ...req.body } });
});
/**
 * GET /api/reports/:id
 */
router.get('/:id', auth_1.authenticate, async (req, res) => {
    res.json({ success: true, data: { id: req.params.id } });
});
/**
 * PATCH /api/reports/:id
 */
router.patch('/:id', auth_1.authenticate, async (req, res) => {
    res.json({ success: true, data: { id: req.params.id, ...req.body } });
});
/**
 * DELETE /api/reports/:id
 */
router.delete('/:id', auth_1.authenticate, async (req, res) => {
    res.json({ success: true, message: 'Deleted successfully' });
});
exports.default = router;
//# sourceMappingURL=reports.js.map