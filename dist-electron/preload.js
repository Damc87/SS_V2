"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const invoke = (channel, ...args) => electron_1.ipcRenderer.invoke(channel, ...args);
const api = {
    projects: {
        list: () => invoke('projects:list'),
        create: (data) => invoke('projects:create', data),
        update: (id, data) => invoke('projects:update', id, data),
        remove: (id) => invoke('projects:delete', id),
        setActive: (id) => invoke('projects:setActive', id),
        getActive: () => invoke('projects:getActive'),
    },
    phases: {
        list: () => invoke('phases:list'),
        create: (payload) => invoke('phases:create', payload),
        update: (id, payload) => invoke('phases:update', id, payload),
        remove: (id) => invoke('phases:delete', id),
        reorder: (order) => invoke('phases:reorder', order),
        importCsv: (csv, projectId) => invoke('phases:importCsv', csv, projectId),
        subphases: {
            list: (phaseId) => invoke('subphases:list', phaseId),
            create: (phaseId, payload) => invoke('subphases:create', phaseId, payload),
            update: (id, payload) => invoke('subphases:update', id, payload),
            remove: (id) => invoke('subphases:delete', id),
        },
    },
    contractors: {
        list: (filters) => invoke('contractors:list', filters),
        create: (data) => invoke('contractors:create', data),
        update: (id, data) => invoke('contractors:update', id, data),
        remove: (id) => invoke('contractors:delete', id),
        archive: (id, archived) => invoke('contractors:archive', id, archived),
    },
    costs: {
        list: (filters) => invoke('costs:list', filters),
        create: (data) => invoke('costs:create', data),
        update: (id, data) => invoke('costs:update', id, data),
        remove: (id) => invoke('costs:delete', id),
        duplicate: (id) => invoke('costs:duplicate', id),
        bulkCreate: (entries) => invoke('costs:bulkCreate', entries),
        planVsActual: (projectId) => invoke('costs:planVsActual', projectId),
        setArchived: (id, archived) => invoke('costs:setArchived', id, archived),
        attachPdf: (costId, filePath) => invoke('costs:attachPdf', costId, filePath),
        openPdf: (storedPath) => invoke('costs:openPdf', storedPath),
    },
    documents: {
        attach: (payload) => invoke('documents:attach', payload),
        listByProject: (projectId) => invoke('documents:listByProject', projectId),
        open: (storedPath) => invoke('documents:open', storedPath),
        remove: (id) => invoke('documents:delete', id),
        update: (id, data) => invoke('documents:update', id, data),
        replace: (id, filePath) => invoke('documents:replace', id, filePath),
    },
    export: {
        csv: (projectId, filters) => invoke('export:csv', projectId, filters),
        backup: () => invoke('export:backup'),
    },
    import: {
        csv: (csv, projectId) => invoke('import:csv', csv, projectId),
        backup: () => invoke('import:backup'),
    },
    paths: {
        userData: () => invoke('paths:userData'),
    },
    app: {
        openPath: (targetPath) => invoke('app:openPath', targetPath),
    },
    on: (channel, listener) => electron_1.ipcRenderer.on(channel, listener),
    removeListener: (channel, listener) => electron_1.ipcRenderer.removeListener(channel, listener),
};
electron_1.contextBridge.exposeInMainWorld('api', api);
