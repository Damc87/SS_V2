"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const db_1 = require("../db");
const db = (0, db_1.getDb)();
electron_1.ipcMain.handle('projects:list', () => db.listProjects());
electron_1.ipcMain.handle('projects:create', (_e, data) => db.createProject(data));
electron_1.ipcMain.handle('projects:update', (_e, id, data) => db.updateProject(id, data));
electron_1.ipcMain.handle('projects:delete', (_e, id) => db.deleteProject(id));
electron_1.ipcMain.handle('projects:setActive', (_e, id) => db.setActiveProject(id));
electron_1.ipcMain.handle('projects:getActive', () => db.getActiveProject());
electron_1.ipcMain.handle('phases:list', () => db.listPhases());
electron_1.ipcMain.handle('phases:create', (_e, payload) => db.createPhase(payload));
electron_1.ipcMain.handle('phases:update', (_e, id, payload) => db.updatePhase(id, payload));
electron_1.ipcMain.handle('phases:delete', (_e, id) => db.deletePhase(id));
electron_1.ipcMain.handle('phases:reorder', (_e, order) => db.reorderPhases(order));
electron_1.ipcMain.handle('phases:importCsv', (_e, csv, projectId) => db.importPhasesCsv(csv, projectId));
electron_1.ipcMain.handle('subphases:create', (_e, phaseId, payload) => db.createSubphase(phaseId, payload));
electron_1.ipcMain.handle('subphases:update', (_e, id, payload) => db.updateSubphase(id, payload));
electron_1.ipcMain.handle('subphases:delete', (_e, id) => db.deleteSubphase(id));
electron_1.ipcMain.handle('subphases:list', (_e, phaseId) => db.listSubphases(phaseId));
electron_1.ipcMain.handle('contractors:list', (_e, filters) => db.listContractors(filters?.projectId, filters?.includeArchived));
electron_1.ipcMain.handle('contractors:create', (_e, data) => db.createContractor(data));
electron_1.ipcMain.handle('contractors:update', (_e, id, data) => db.updateContractor(id, data));
electron_1.ipcMain.handle('contractors:delete', (_e, id) => db.deleteContractor(id));
electron_1.ipcMain.handle('contractors:archive', (_e, id, archived) => db.archiveContractor(id, archived));
electron_1.ipcMain.handle('costs:list', (_e, filters) => db.listCosts(filters));
electron_1.ipcMain.handle('costs:create', (_e, data) => db.createCost(data));
electron_1.ipcMain.handle('costs:update', (_e, id, data) => db.updateCost(id, data));
electron_1.ipcMain.handle('costs:delete', (_e, id) => db.deleteCost(id));
electron_1.ipcMain.handle('costs:duplicate', (_e, id) => db.duplicateCost(id));
electron_1.ipcMain.handle('costs:bulkCreate', (_e, list) => db.bulkCreateCosts(list));
electron_1.ipcMain.handle('costs:planVsActual', (_e, projectId) => db.phasePlanVsActual(projectId));
electron_1.ipcMain.handle('costs:setArchived', (_e, id, archived) => db.setCostArchived(id, archived));
electron_1.ipcMain.handle('costs:attachPdf', (_e, costId, filePath) => db.attachPdfToCost(costId, filePath));
electron_1.ipcMain.handle('costs:openPdf', (_e, storedPath) => electron_1.shell.openPath(storedPath));
electron_1.ipcMain.handle('documents:attach', async (_e, { projectId, costId, filePath }) => {
    const { storedName, targetPath, size } = await db.saveDocumentFile(filePath);
    const doc = await db.attachDocument({
        project_id: projectId,
        cost_id: costId,
        original_name: path_1.default.basename(filePath),
        stored_name: storedName,
        stored_path: targetPath,
        mime: 'application/pdf',
        size,
    });
    return doc;
});
electron_1.ipcMain.handle('documents:update', (_e, id, data) => db.updateDocument(id, data));
electron_1.ipcMain.handle('documents:replace', (_e, id, filePath) => db.replaceDocument(id, filePath));
electron_1.ipcMain.handle('documents:listByProject', (_e, projectId) => db.listDocuments(projectId));
electron_1.ipcMain.handle('documents:open', (_e, storedPath) => electron_1.shell.openPath(storedPath));
electron_1.ipcMain.handle('documents:delete', (_e, id) => db.deleteDocument(id));
electron_1.ipcMain.handle('export:csv', (_e, projectId, filters) => db.exportCostsCsv(projectId, filters));
electron_1.ipcMain.handle('import:csv', (_e, csv, projectId) => db.importCostsCsv(csv, projectId));
electron_1.ipcMain.handle('export:backup', async () => {
    const { filePath } = await electron_1.dialog.showSaveDialog({
        title: 'Shrani varnostno kopijo',
        defaultPath: path_1.default.join(electron_1.app.getPath('documents'), 'gradnja-backup.zip'),
        filters: [{ name: 'ZIP', extensions: ['zip'] }],
    });
    if (!filePath)
        return null;
    return db.exportBackup(filePath);
});
electron_1.ipcMain.handle('import:backup', async () => {
    const { filePaths } = await electron_1.dialog.showOpenDialog({
        title: 'Uvozi varnostno kopijo',
        filters: [{ name: 'ZIP', extensions: ['zip'] }],
        properties: ['openFile'],
    });
    if (!filePaths?.length)
        return null;
    await db.importBackup(filePaths[0]);
    return true;
});
