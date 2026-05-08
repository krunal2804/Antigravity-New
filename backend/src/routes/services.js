const express = require('express');
const db = require('../database/db');
const { authenticate, authorize } = require('../middleware/auth');
const { resequenceProjectsForService } = require('../utils/projectTaskOrder');
const multer = require('multer');
const XLSX = require('xlsx');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } });

const BULK_COLUMNS = {
    STEP_ORDER: 'Step Order',
    STEP_NAME: 'Step Name(optional)',
    TASK_ORDER: 'Task Order',
    TASK_NAME: 'Task Name',
    DURATION: 'Default Duration Days(optional)',
    DOC_NAME: 'Reference Doc Name(optional)',
    DOC_LINK: 'Reference Doc Link(optional)',
};

function isValidHttpUrl(value) {
    if (!value) return true;
    try {
        const parsed = new URL(value);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch (err) {
        return false;
    }
}

function normalizeServiceUploadRows(rows) {
    const normalized = [];
    let currentStepOrder = null;
    let currentStepName = '';

    rows.forEach((rawRow, index) => {
        const rowNumber = index + 2;
        const stepOrderRaw = String(rawRow[BULK_COLUMNS.STEP_ORDER] ?? '').trim();
        const stepName = String(rawRow[BULK_COLUMNS.STEP_NAME] ?? '').trim();
        const taskOrderRaw = String(rawRow[BULK_COLUMNS.TASK_ORDER] ?? '').trim();
        const taskName = String(rawRow[BULK_COLUMNS.TASK_NAME] ?? '').trim();
        const durationRaw = String(rawRow[BULK_COLUMNS.DURATION] ?? '').trim();
        const docName = String(rawRow[BULK_COLUMNS.DOC_NAME] ?? '').trim();
        const docLink = String(rawRow[BULK_COLUMNS.DOC_LINK] ?? '').trim();

        const isCompletelyEmpty = !stepOrderRaw && !stepName && !taskOrderRaw && !taskName && !durationRaw && !docName && !docLink;
        if (isCompletelyEmpty) return;

        const errors = [];

        let stepOrder = currentStepOrder;
        let effectiveStepName = currentStepName;

        const startsNewStep = !!stepOrderRaw || !!stepName;
        if (startsNewStep) {
            const parsedStepOrder = Number.parseInt(stepOrderRaw, 10);
            if (!stepOrderRaw || Number.isNaN(parsedStepOrder) || parsedStepOrder < 1) {
                errors.push('Step Order must be provided (number >= 1) when starting a new step');
            } else {
                stepOrder = parsedStepOrder;
                currentStepOrder = parsedStepOrder;
            }

            effectiveStepName = stepName;
            currentStepName = stepName;
        } else if (!currentStepOrder) {
            errors.push('Step Order is required on the first row of each step block');
        }

        const taskOrder = Number.parseInt(taskOrderRaw, 10);
        if (!taskOrderRaw || Number.isNaN(taskOrder) || taskOrder < 1) {
            errors.push('Task Order must be a number >= 1');
        }

        if (!taskName) {
            errors.push('Task Name is required');
        }

        let defaultDurationDays = null;
        if (durationRaw) {
            defaultDurationDays = Number.parseInt(durationRaw, 10);
            if (Number.isNaN(defaultDurationDays) || defaultDurationDays < 0) {
                errors.push('Default Duration Days must be a number >= 0');
            }
        }

        if ((docName && !docLink) || (!docName && docLink)) {
            errors.push('Reference Doc Name and Link must both be filled together');
        }
        if (docLink && !isValidHttpUrl(docLink)) {
            errors.push('Reference Doc Link must start with http:// or https://');
        }

        normalized.push({
            id: Date.now() + index,
            row_number: rowNumber,
            step_order: stepOrder || '',
            step_name: effectiveStepName || '',
            task_order: Number.isNaN(taskOrder) ? '' : taskOrder,
            task_name: taskName,
            default_duration_days: defaultDurationDays === null ? '' : defaultDurationDays,
            reference_doc_name: docName,
            reference_doc_link: docLink,
            errors,
        });
    });

    return normalized;
}

// ==========================================
// SERVICES CRUD
// ==========================================

// GET /api/services
router.get('/', authenticate, async (req, res) => {
    try {
        const services = await db('services').where({ is_active: true }).orderBy('name');
        res.json(services);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch services.' });
    }
});

// GET /api/services/:id (Deep fetch of Steps, Tasks, and Documents)
router.get('/:id', authenticate, async (req, res) => {
    try {
        const service = await db('services').where({ id: req.params.id }).first();
        if (!service) return res.status(404).json({ error: 'Service not found.' });

        // Fetch Steps
        const steps = await db('service_steps')
            .where({ service_id: service.id, is_active: true })
            .orderBy('sequence_order')
            .orderBy('id');

        // Fetch Tasks for each Step
        for (let step of steps) {
            step.tasks = await db('service_tasks')
                .where({ service_step_id: step.id, is_active: true })
                .orderBy('sequence_order')
                .orderBy('id');
            
            // Fetch Shared Documents for each Task
            for (let task of step.tasks) {
                const docs = await db('reference_documents')
                    .join('service_task_documents', 'reference_documents.id', 'service_task_documents.document_id')
                    .where('service_task_documents.service_task_id', task.id)
                    .select('reference_documents.*');
                task.documents = docs;
            }
        }

        res.json({ ...service, steps });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch service details.' });
    }
});

// GET /api/services/bulk/upload-steps/sample-excel
router.get('/bulk/upload-steps/sample-excel', authenticate, (req, res) => {
    const wb = XLSX.utils.book_new();
    const data = [[
        BULK_COLUMNS.STEP_ORDER,
        BULK_COLUMNS.STEP_NAME,
        BULK_COLUMNS.TASK_ORDER,
        BULK_COLUMNS.TASK_NAME,
        BULK_COLUMNS.DURATION,
        BULK_COLUMNS.DOC_NAME,
        BULK_COLUMNS.DOC_LINK,
    ]];

    const demoSteps = [
        'Discovery & Scope',
        'Current State Mapping',
        'Gap Analysis',
        'Future State Design',
        'Implementation Planning',
    ];

    demoSteps.forEach((stepName, idx) => {
        const stepOrder = idx + 1;
        for (let taskOrder = 1; taskOrder <= 5; taskOrder += 1) {
            const isStepStart = taskOrder === 1;
            data.push([
                isStepStart ? stepOrder : '',
                isStepStart ? stepName : '',
                taskOrder,
                `Task ${taskOrder} for Step ${stepOrder}`,
                taskOrder * 2,
                taskOrder === 1 ? `${stepName} - Reference` : '',
                taskOrder === 1 ? `https://example.com/step-${stepOrder}-reference` : '',
            ]);
        }
    });

    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = [
        { wch: 12 }, { wch: 28 }, { wch: 12 }, { wch: 32 }, { wch: 24 }, { wch: 28 }, { wch: 45 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'Service Steps');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename="sample_service_steps.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Length', buffer.length);
    res.end(buffer);
});


// POST /api/services/:id/upload-steps/validate
router.post('/:id/upload-steps/validate', authenticate, upload.single('file'), async (req, res) => {
    try {
        const service = await db('services').where({ id: req.params.id }).first();
        if (!service) return res.status(404).json({ error: 'Service not found.' });
        if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });

        const wb = XLSX.read(req.file.buffer, { type: 'buffer' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
        const parsedRows = normalizeServiceUploadRows(rows);

        if (parsedRows.length === 0) {
            return res.status(400).json({ error: 'Excel has no usable rows. Please add data rows.' });
        }

        res.json({ rows: parsedRows });
    } catch (err) {
        console.error('Upload steps validate error:', err);
        res.status(500).json({ error: `Failed to validate file: ${err.message}` });
    }
});

// POST /api/services/:id/upload-steps/confirm
router.post('/:id/upload-steps/confirm', authenticate, async (req, res) => {
    try {
        const serviceId = req.params.id;
        const { rows } = req.body;
        if (!Array.isArray(rows) || rows.length === 0) {
            return res.status(400).json({ error: 'No rows provided.' });
        }

        const normalized = normalizeServiceUploadRows(rows.map((r) => ({
            [BULK_COLUMNS.STEP_ORDER]: r.step_order,
            [BULK_COLUMNS.STEP_NAME]: r.step_name,
            [BULK_COLUMNS.TASK_ORDER]: r.task_order,
            [BULK_COLUMNS.TASK_NAME]: r.task_name,
            [BULK_COLUMNS.DURATION]: r.default_duration_days,
            [BULK_COLUMNS.DOC_NAME]: r.reference_doc_name,
            [BULK_COLUMNS.DOC_LINK]: r.reference_doc_link,
        })));

        if (normalized.length === 0) {
            return res.status(400).json({ error: 'No usable rows after validation.' });
        }

        const invalidRows = normalized.filter((r) => r.errors.length > 0);
        if (invalidRows.length > 0) {
            return res.status(400).json({ error: 'Some rows are invalid. Please fix errors in preview first.', rows: normalized });
        }

        // Build step/task model. Step name can be blank for repeated rows.
        const byStep = new Map();
        normalized.forEach((row) => {
            const key = row.step_order;
            if (!byStep.has(key)) {
                byStep.set(key, { step_order: row.step_order, step_name: row.step_name || '', tasks: [] });
            } else if (!byStep.get(key).step_name && row.step_name) {
                byStep.get(key).step_name = row.step_name;
            }
            byStep.get(key).tasks.push(row);
        });

        const orderedSteps = Array.from(byStep.values()).sort((a, b) => a.step_order - b.step_order);

        await db.transaction(async (trx) => {
            const existingStepIds = (await trx('service_steps').where({ service_id: serviceId }).select('id')).map((x) => x.id);
            const existingTaskIds = existingStepIds.length > 0
                ? (await trx('service_tasks').whereIn('service_step_id', existingStepIds).select('id')).map((x) => x.id)
                : [];

            if (existingTaskIds.length > 0) {
                await trx('service_task_documents').whereIn('service_task_id', existingTaskIds).del();
            }
            if (existingStepIds.length > 0) {
                await trx('service_steps').whereIn('id', existingStepIds).del();
            }

            for (let stepIdx = 0; stepIdx < orderedSteps.length; stepIdx += 1) {
                const step = orderedSteps[stepIdx];
                const [newStep] = await trx('service_steps')
                    .insert({
                        service_id: serviceId,
                        name: step.step_name || null,
                        description: null,
                        sequence_order: stepIdx,
                    })
                    .returning('*');

                const orderedTasks = [...step.tasks].sort((a, b) => a.task_order - b.task_order);
                for (let taskIdx = 0; taskIdx < orderedTasks.length; taskIdx += 1) {
                    const task = orderedTasks[taskIdx];
                    const [newTask] = await trx('service_tasks')
                        .insert({
                            service_step_id: newStep.id,
                            name: task.task_name,
                            description: null,
                            default_duration_days: task.default_duration_days === '' ? null : Number(task.default_duration_days),
                            sequence_order: taskIdx,
                            is_mandatory: true,
                        })
                        .returning('*');

                    if (task.reference_doc_name && task.reference_doc_link) {
                        let doc = await trx('reference_documents')
                            .where({
                                service_id: serviceId,
                                name: task.reference_doc_name,
                                file_url: task.reference_doc_link,
                            })
                            .first();

                        if (!doc) {
                            [doc] = await trx('reference_documents')
                                .insert({
                                    service_id: serviceId,
                                    name: task.reference_doc_name,
                                    file_url: task.reference_doc_link,
                                    description: null,
                                })
                                .returning('*');
                        }

                        await trx('service_task_documents')
                            .insert({ service_task_id: newTask.id, document_id: doc.id })
                            .onConflict(['service_task_id', 'document_id'])
                            .ignore();
                    }
                }
            }
        });

        res.json({ message: 'Service steps replaced successfully.' });
    } catch (err) {
        console.error('Upload steps confirm error:', err);
        res.status(500).json({ error: `Failed to apply upload: ${err.message}` });
    }
});

// POST /api/services
router.post('/', authenticate, async (req, res) => {
    try {
        const { name, code, description } = req.body;
        if (!name || !code) return res.status(400).json({ error: 'Name and Code are required.' });
        
        const [service] = await db('services').insert({ name, code, description }).returning('*');
        res.status(201).json(service);
    } catch (err) {
        if (err.code === '23505') {
            if (err.detail && err.detail.includes('code')) {
                return res.status(400).json({ error: 'Service code already in use, please change the service code.' });
            }
            return res.status(400).json({ error: 'Service name already in use, please change the name.' });
        }
        res.status(500).json({ error: 'Failed to create service.' });
    }
});

// PUT /api/services/:id
router.put('/:id', authenticate, async (req, res) => {
    try {
        const { name, code, description, is_active } = req.body;
        if (!name || !code) return res.status(400).json({ error: 'Name and Code are required.' });
        
        const [service] = await db('services').where({ id: req.params.id }).update({ name, code, description, is_active, updated_at: db.fn.now() }).returning('*');
        res.json(service);
    } catch (err) {
        if (err.code === '23505') {
            if (err.detail && err.detail.includes('code')) {
                return res.status(400).json({ error: 'Service code already in use, please change the service code.' });
            }
            return res.status(400).json({ error: 'Service name already in use, please change the name.' });
        }
        res.status(500).json({ error: 'Failed to update service.' });
    }
});

// DELETE /api/services/:id (Hard delete with Deep Sync)
router.delete('/:id', authenticate, async (req, res) => {
    try {
        // Deep Sync: Cascade delete all active projects relying on this service first
        // (This naturally cleans up project_tasks and project references via DB cascade constraints)
        await db('projects').where({ service_id: req.params.id }).delete();

        // Finally, delete the service template itself
        await db('services').where({ id: req.params.id }).delete();
        res.json({ message: 'Service and all synchronized projects successfully deleted.' });
    } catch (err) {
        console.error("Service Delete Error:", err);
        res.status(500).json({ error: 'Failed to delete service.' });
    }
});

// ==========================================
// STEPS CRUD
// ==========================================

// POST /api/services/:id/steps
router.post('/:id/steps', authenticate, async (req, res) => {
    try {
        const { name, description } = req.body;
        let { sequence_order } = req.body;

        if (sequence_order === undefined || sequence_order === null) {
            const lastStep = await db('service_steps')
                .where({ service_id: req.params.id })
                .orderBy('sequence_order', 'desc')
                .first();
            sequence_order = lastStep ? lastStep.sequence_order + 1 : 0;
        }

        const [step] = await db('service_steps').insert({
            service_id: req.params.id,
            name,
            description,
            sequence_order
        }).returning('*');
        res.status(201).json(step);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create step.' });
    }
});

// PUT /api/services/steps/:stepId
router.put('/steps/:stepId', authenticate, async (req, res) => {
    try {
        const { name, description, sequence_order } = req.body;
        const updateData = { name, description, updated_at: db.fn.now() };
        if (sequence_order !== undefined) updateData.sequence_order = sequence_order;

        const [step] = await db('service_steps').where({ id: req.params.stepId }).update(updateData).returning('*');
        if (!step) return res.status(404).json({ error: 'Step not found.' });
        
        // Deep Sync: Update step_name on all project_tasks across active projects
        if (name !== undefined) {
             const templateTasks = await db('service_tasks').where({ service_step_id: step.id }).select('id');
             const taskIds = templateTasks.map(t => t.id);
             if (taskIds.length > 0) {
                 await db('project_tasks')
                     .whereIn('service_task_id', taskIds)
                     .update({ step_name: name });
             }
        }

        if (sequence_order !== undefined) {
            await resequenceProjectsForService(db, step.service_id);
        }

        res.json(step);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update step.' });
    }
});

// DELETE /api/services/steps/:stepId
router.delete('/steps/:stepId', authenticate, async (req, res) => {
    try {
        const step = await db('service_steps').where({ id: req.params.stepId }).first();
        if (!step) return res.status(404).json({ error: 'Step not found.' });

        // Deep Sync: Delete project tasks currently linked to this step
        const templateTasks = await db('service_tasks').where({ service_step_id: step.id }).select('id');
        const taskIds = templateTasks.map(t => t.id);
        if (taskIds.length > 0) {
            await db('project_tasks').whereIn('service_task_id', taskIds).delete();
        }

        await db('service_steps').where({ id: req.params.stepId }).delete();

        // Cascade reorder remaining steps
        await db('service_steps')
            .where({ service_id: step.service_id })
            .andWhere('sequence_order', '>', step.sequence_order)
            .decrement('sequence_order', 1);

        await resequenceProjectsForService(db, step.service_id);

        res.json({ message: 'Step deleted and remaining steps reordered.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete step.' });
    }
});

// ==========================================
// TASKS CRUD
// ==========================================

// POST /api/services/steps/:stepId/tasks
router.post('/steps/:stepId/tasks', authenticate, async (req, res) => {
    try {
        const { name, description } = req.body;
        let { sequence_order, default_duration_days } = req.body;
        if (!name) return res.status(400).json({ error: 'Task name is required.' });

        // allow clearing duration
        if (default_duration_days === '') default_duration_days = null;

        if (sequence_order === undefined || sequence_order === null) {
            const lastTask = await db('service_tasks')
                .where({ service_step_id: req.params.stepId })
                .orderBy('sequence_order', 'desc')
                .first();
            sequence_order = lastTask ? lastTask.sequence_order + 1 : 0;
        }

        const [task] = await db('service_tasks').insert({
            service_step_id: req.params.stepId,
            name, description, default_duration_days, sequence_order
        }).returning('*');

        // Deep Sync: Add this new task to all active projects relying on this service
        const step = await db('service_steps').where({ id: req.params.stepId }).first();
        if (step) {
            const projects = await db('projects').where({ service_id: step.service_id, is_active: true }).select('id', 'start_date');
            if (projects.length > 0) {
                const projectTasksToInsert = projects.map(p => {
                    let taskStart = null;
                    let taskDue = null;
                    if (p.start_date && task.default_duration_days) {
                        taskStart = p.start_date;
                        const due = new Date(p.start_date);
                        due.setDate(due.getDate() + task.default_duration_days);
                        taskDue = due.toISOString().split('T')[0];
                    }
                    return {
                        project_id: p.id,
                        service_task_id: task.id,
                        step_name: step.name,
                        name: task.name,
                        description: task.description,
                        sequence_order: task.sequence_order + 1,
                        is_mandatory: true,
                        start_date: taskStart,
                        due_date: taskDue
                    };
                });
                await db('project_tasks').insert(projectTasksToInsert);
                await resequenceProjectsForService(db, step.service_id);
            }
        }

        res.status(201).json(task);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create task.' });
    }
});

// PUT /api/services/tasks/:taskId
router.put('/tasks/:taskId', authenticate, async (req, res) => {
    try {
        const { name, description, sequence_order } = req.body;
        let { default_duration_days } = req.body;
        if (!name) return res.status(400).json({ error: 'Task name is required.' });

        // allow clearing duration
        if (default_duration_days === '') default_duration_days = null;

        const updateData = { name, description, default_duration_days, updated_at: db.fn.now() };
        if (sequence_order !== undefined) updateData.sequence_order = sequence_order;

        const [task] = await db('service_tasks').where({ id: req.params.taskId }).update(updateData).returning('*');
        if (!task) return res.status(404).json({ error: 'Task not found.' });

        // Deep Sync: Sync task changes down to cloned project_tasks
        const projectTaskUpdate = { name: task.name, description: task.description, updated_at: db.fn.now() };
        if (sequence_order !== undefined) projectTaskUpdate.sequence_order = task.sequence_order;
        
        await db('project_tasks').where({ service_task_id: task.id }).update(projectTaskUpdate);

        const step = await db('service_steps').where({ id: task.service_step_id }).first();
        if (step && sequence_order !== undefined) {
            await resequenceProjectsForService(db, step.service_id);
        }

        res.json(task);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update task.' });
    }
});

// DELETE /api/services/tasks/:taskId
router.delete('/tasks/:taskId', authenticate, async (req, res) => {
    try {
        const task = await db('service_tasks').where({ id: req.params.taskId }).first();
        if (!task) return res.status(404).json({ error: 'Task not found.' });

        // Deep Sync: Delete all instances of this task across active projects
        await db('project_tasks').where({ service_task_id: task.id }).delete();

        await db('service_tasks').where({ id: req.params.taskId }).delete();

        // Cascade reorder remaining tasks
        await db('service_tasks')
            .where({ service_step_id: task.service_step_id })
            .andWhere('sequence_order', '>', task.sequence_order)
            .decrement('sequence_order', 1);

        const step = await db('service_steps').where({ id: task.service_step_id }).first();
        if (step) {
            await resequenceProjectsForService(db, step.service_id);
        }

        res.json({ message: 'Task deleted and remaining tasks reordered.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete task.' });
    }
});

// ==========================================
// REFERENCE DOCUMENTS (Shared)
// ==========================================

// GET /api/services/reference_documents/all
router.get('/reference_documents/all', authenticate, async (req, res) => {
    try {
        const { service_id } = req.query;
        let query = db('reference_documents');
        if (service_id) {
            query = query.where({ service_id });
        }
        const docs = await query.orderBy('name');
        res.json(docs);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch documents.' });
    }
});

// POST /api/services/reference_documents
router.post('/reference_documents', authenticate, async (req, res) => {
    try {
        const { name, file_url, description, service_id } = req.body;
        if (!name || !file_url || !service_id) return res.status(400).json({ error: 'Name, file_url, and service_id are required.' });

        const [doc] = await db('reference_documents').insert({ name, file_url, description, service_id }).returning('*');
        res.status(201).json(doc);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create reference document.' });
    }
});

// PUT /api/services/reference_documents/:id
router.put('/reference_documents/:id', authenticate, async (req, res) => {
    try {
        const { name, file_url, description } = req.body;
        if (!name || !file_url) return res.status(400).json({ error: 'Name and file_url are required.' });

        const [doc] = await db('reference_documents')
            .where({ id: req.params.id })
            .update({ name, file_url, description, updated_at: db.fn.now() })
            .returning('*');
        res.json(doc);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update reference document.' });
    }
});

// DELETE /api/services/reference_documents/:id
router.delete('/reference_documents/:id', authenticate, async (req, res) => {
    try {
        await db('reference_documents').where({ id: req.params.id }).delete();
        res.json({ message: 'Reference document permanently deleted.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete reference document.' });
    }
});

// POST /api/services/tasks/:taskId/documents
router.post('/tasks/:taskId/documents', authenticate, async (req, res) => {
    try {
        const { document_id } = req.body;
        if (!document_id) return res.status(400).json({ error: 'document_id is required.' });

        await db('service_task_documents').insert({
            service_task_id: req.params.taskId,
            document_id
        }).onConflict(['service_task_id', 'document_id']).ignore(); // Ignore if already mapped

        res.status(201).json({ message: 'Document linked to task.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to link document.' });
    }
});

// DELETE /api/services/tasks/:taskId/documents/:docId
router.delete('/tasks/:taskId/documents/:docId', authenticate, async (req, res) => {
    try {
        await db('service_task_documents')
            .where({ service_task_id: req.params.taskId, document_id: req.params.docId })
            .delete();
        res.json({ message: 'Document unlinked from task.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to unlink document.' });
    }
});

module.exports = router;
