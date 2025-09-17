"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const adminController_1 = require("../controllers/adminController");
const router = (0, express_1.Router)();
router.get('/', adminController_1.listarAdmins);
router.post('/', adminController_1.criarAdmin);
router.post('/login', adminController_1.loginAdmin);
exports.default = router;
