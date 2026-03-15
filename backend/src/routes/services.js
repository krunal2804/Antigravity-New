const express = require('express');
const db = require('../database/db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

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
        const steps = await db('service_steps').where({ service_id: service.id, is_active: true }).orderBy('sequence_order');

        // Fetch Tasks for each Step
        for (let step of steps) {
            step.tasks = await db('service_tasks').where({ service_step_id: step.id, is_active: true }).orderBy('sequence_order');
            
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

// DELETE /api/services/:id (Hard delete)
router.delete('/:id', authenticate, async (req, res) => {
    try {
        await db('services').where({ id: req.params.id }).delete();
        res.json({ message: 'Service deleted.' });
    } catch (err) {
        if (err.code === '23503') {
            return res.status(400).json({ error: 'Cannot delete this service because it is currently used by one or more projects.' });
        }
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

        const [step] = await db('service_steps').where({ id: req.params.stepId }).update({
            name, description, sequence_order, updated_at: db.fn.now()
        }).returning('*');
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

        await db('service_steps').where({ id: req.params.stepId }).delete();

        // Cascade reorder remaining steps
        await db('service_steps')
            .where({ service_id: step.service_id })
            .andWhere('sequence_order', '>', step.sequence_order)
            .decrement('sequence_order', 1);

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

        const [task] = await db('service_tasks').where({ id: req.params.taskId }).update({
            name, description, default_duration_days, sequence_order, updated_at: db.fn.now()
        }).returning('*');
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

        await db('service_tasks').where({ id: req.params.taskId }).delete();

        // Cascade reorder remaining tasks
        await db('service_tasks')
            .where({ service_step_id: task.service_step_id })
            .andWhere('sequence_order', '>', task.sequence_order)
            .decrement('sequence_order', 1);

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
        const docs = await db('reference_documents').orderBy('name');
        res.json(docs);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch documents.' });
    }
});

// POST /api/services/reference_documents
router.post('/reference_documents', authenticate, async (req, res) => {
    try {
        const { name, file_url, description } = req.body;
        if (!name || !file_url) return res.status(400).json({ error: 'Name and file_url are required.' });

        const [doc] = await db('reference_documents').insert({ name, file_url, description }).returning('*');
        res.status(201).json(doc);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create reference document.' });
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
