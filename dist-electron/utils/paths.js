"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureDataDirectories = exports.getUploadsPath = exports.getDataFilePath = exports.getDataRoot = void 0;
const electron_1 = require("electron");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const getDataRoot = () => {
    const base = electron_1.app.getPath('userData');
    return path_1.default.join(base, 'GradnjaStroski');
};
exports.getDataRoot = getDataRoot;
const getDataFilePath = () => {
    return path_1.default.join((0, exports.getDataRoot)(), 'data.json');
};
exports.getDataFilePath = getDataFilePath;
const getUploadsPath = () => {
    return path_1.default.join((0, exports.getDataRoot)(), 'uploads');
};
exports.getUploadsPath = getUploadsPath;
const ensureDataDirectories = () => {
    const root = (0, exports.getDataRoot)();
    const uploadsDir = (0, exports.getUploadsPath)();
    [root, uploadsDir].forEach((dir) => {
        if (!fs_1.default.existsSync(dir)) {
            fs_1.default.mkdirSync(dir, { recursive: true });
        }
    });
};
exports.ensureDataDirectories = ensureDataDirectories;
