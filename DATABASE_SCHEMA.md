# Current Database Schema

## Table: `assignments`

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | `integer` | NO | `nextval('assignments_id_seq'::` |
| `organization_id` | `integer` | NO | `` |
| `name` | `character varying` | NO | `` |
| `location` | `character varying` | YES | `` |
| `description` | `text` | YES | `` |
| `start_date` | `date` | YES | `` |
| `end_date` | `date` | YES | `` |
| `status` | `text` | YES | `'active'::text` |
| `is_active` | `boolean` | YES | `true` |
| `created_at` | `timestamp with time zone` | NO | `CURRENT_TIMESTAMP` |
| `updated_at` | `timestamp with time zone` | NO | `CURRENT_TIMESTAMP` |
| `faber_poc_id` | `integer` | YES | `` |
| `top_management_name` | `character varying` | YES | `` |
| `top_management_designation` | `character varying` | YES | `` |
| `top_management_mobile` | `character varying` | YES | `` |
| `top_management_email` | `character varying` | YES | `` |
| `client_poc_name` | `character varying` | YES | `` |
| `client_poc_designation` | `character varying` | YES | `` |
| `client_poc_mobile` | `character varying` | YES | `` |
| `client_poc_email` | `character varying` | YES | `` |

## Table: `audit_logs`

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | `bigint` | NO | `nextval('audit_logs_id_seq'::r` |
| `user_id` | `integer` | YES | `` |
| `action` | `character varying` | NO | `` |
| `entity_type` | `character varying` | NO | `` |
| `entity_id` | `integer` | YES | `` |
| `old_values` | `jsonb` | YES | `` |
| `new_values` | `jsonb` | YES | `` |
| `ip_address` | `character varying` | YES | `` |
| `created_at` | `timestamp with time zone` | YES | `CURRENT_TIMESTAMP` |

## Table: `documents`

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | `integer` | NO | `nextval('documents_id_seq'::re` |
| `project_id` | `integer` | YES | `` |
| `project_task_id` | `integer` | YES | `` |
| `uploaded_by` | `integer` | NO | `` |
| `file_name` | `character varying` | NO | `` |
| `file_path` | `character varying` | NO | `` |
| `file_type` | `character varying` | YES | `` |
| `file_size` | `bigint` | YES | `` |
| `created_at` | `timestamp with time zone` | YES | `CURRENT_TIMESTAMP` |

## Table: `notifications`

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | `integer` | NO | `nextval('notifications_id_seq'` |
| `user_id` | `integer` | NO | `` |
| `title` | `character varying` | NO | `` |
| `message` | `text` | NO | `` |
| `type` | `text` | NO | `` |
| `reference_type` | `character varying` | YES | `` |
| `reference_id` | `integer` | YES | `` |
| `is_read` | `boolean` | YES | `false` |
| `created_at` | `timestamp with time zone` | YES | `CURRENT_TIMESTAMP` |

## Table: `organizations`

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | `integer` | NO | `nextval('organizations_id_seq'` |
| `name` | `character varying` | NO | `` |
| `industry` | `character varying` | YES | `` |
| `website` | `character varying` | YES | `` |
| `address` | `text` | YES | `` |
| `city` | `character varying` | YES | `` |
| `state` | `character varying` | YES | `` |
| `country` | `character varying` | YES | `` |
| `pincode` | `character varying` | YES | `` |
| `phone` | `character varying` | YES | `` |
| `email` | `character varying` | YES | `` |
| `logo_url` | `character varying` | YES | `` |
| `is_active` | `boolean` | YES | `true` |
| `created_at` | `timestamp with time zone` | NO | `CURRENT_TIMESTAMP` |
| `updated_at` | `timestamp with time zone` | NO | `CURRENT_TIMESTAMP` |

## Table: `permissions`

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | `integer` | NO | `nextval('permissions_id_seq'::` |
| `role_id` | `integer` | NO | `` |
| `module` | `character varying` | NO | `` |
| `can_view` | `boolean` | YES | `false` |
| `can_create` | `boolean` | YES | `false` |
| `can_edit` | `boolean` | YES | `false` |
| `can_delete` | `boolean` | YES | `false` |
| `created_at` | `timestamp with time zone` | NO | `CURRENT_TIMESTAMP` |
| `updated_at` | `timestamp with time zone` | NO | `CURRENT_TIMESTAMP` |

## Table: `project_members`

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | `integer` | NO | `nextval('project_members_id_se` |
| `project_id` | `integer` | NO | `` |
| `user_id` | `integer` | NO | `` |
| `role_id` | `integer` | NO | `` |
| `is_primary` | `boolean` | YES | `false` |
| `joined_at` | `timestamp with time zone` | YES | `CURRENT_TIMESTAMP` |
| `left_at` | `timestamp with time zone` | YES | `` |
| `created_at` | `timestamp with time zone` | NO | `CURRENT_TIMESTAMP` |
| `updated_at` | `timestamp with time zone` | NO | `CURRENT_TIMESTAMP` |

## Table: `project_reports`

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | `integer` | NO | `nextval('project_reports_id_se` |
| `project_id` | `integer` | NO | `` |
| `report_type` | `text` | NO | `` |
| `title` | `character varying` | NO | `` |
| `summary` | `text` | YES | `` |
| `health_status` | `text` | NO | `` |
| `tasks_completed` | `integer` | YES | `0` |
| `tasks_total` | `integer` | YES | `0` |
| `tasks_overdue` | `integer` | YES | `0` |
| `generated_by` | `integer` | YES | `` |
| `report_date` | `date` | NO | `` |
| `created_at` | `timestamp with time zone` | YES | `CURRENT_TIMESTAMP` |

## Table: `project_tasks`

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | `integer` | NO | `nextval('project_tasks_id_seq'` |
| `project_id` | `integer` | NO | `` |
| `service_task_id` | `integer` | YES | `` |
| `name` | `character varying` | NO | `` |
| `description` | `text` | YES | `` |
| `assigned_to` | `integer` | YES | `` |
| `sequence_order` | `integer` | NO | `` |
| `start_date` | `date` | YES | `` |
| `due_date` | `date` | YES | `` |
| `actual_start_date` | `date` | YES | `` |
| `actual_end_date` | `date` | YES | `` |
| `status` | `text` | YES | `'not_started'::text` |
| `is_mandatory` | `boolean` | YES | `true` |
| `remarks` | `text` | YES | `` |
| `created_at` | `timestamp with time zone` | NO | `CURRENT_TIMESTAMP` |
| `updated_at` | `timestamp with time zone` | NO | `CURRENT_TIMESTAMP` |
| `step_name` | `character varying` | YES | `` |

## Table: `project_timeline_events`

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | `integer` | NO | `nextval('project_timeline_even` |
| `project_id` | `integer` | NO | `` |
| `event_type` | `text` | NO | `` |
| `title` | `character varying` | NO | `` |
| `description` | `text` | YES | `` |
| `event_date` | `timestamp with time zone` | YES | `CURRENT_TIMESTAMP` |
| `created_by` | `integer` | YES | `` |
| `created_at` | `timestamp with time zone` | YES | `CURRENT_TIMESTAMP` |

## Table: `projects`

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | `integer` | NO | `nextval('projects_id_seq'::reg` |
| `assignment_id` | `integer` | NO | `` |
| `service_id` | `integer` | NO | `` |
| `name` | `character varying` | NO | `` |
| `description` | `text` | YES | `` |
| `project_code` | `character varying` | YES | `` |
| `start_date` | `date` | YES | `` |
| `end_date` | `date` | YES | `` |
| `actual_end_date` | `date` | YES | `` |
| `status` | `text` | YES | `'not_started'::text` |
| `progress_percentage` | `numeric` | YES | `'0'::numeric` |
| `is_active` | `boolean` | YES | `true` |
| `created_by` | `integer` | YES | `` |
| `created_at` | `timestamp with time zone` | NO | `CURRENT_TIMESTAMP` |
| `updated_at` | `timestamp with time zone` | NO | `CURRENT_TIMESTAMP` |

## Table: `reference_documents`

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | `integer` | NO | `nextval('reference_documents_i` |
| `name` | `character varying` | NO | `` |
| `file_url` | `character varying` | NO | `` |
| `description` | `text` | YES | `` |
| `created_at` | `timestamp with time zone` | NO | `CURRENT_TIMESTAMP` |
| `updated_at` | `timestamp with time zone` | NO | `CURRENT_TIMESTAMP` |
| `service_id` | `integer` | YES | `` |

## Table: `roles`

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | `integer` | NO | `nextval('roles_id_seq'::regcla` |
| `name` | `character varying` | NO | `` |
| `side` | `text` | NO | `` |
| `hierarchy_level` | `integer` | NO | `` |
| `description` | `text` | YES | `` |
| `is_active` | `boolean` | YES | `true` |
| `created_at` | `timestamp with time zone` | NO | `CURRENT_TIMESTAMP` |
| `updated_at` | `timestamp with time zone` | NO | `CURRENT_TIMESTAMP` |

## Table: `service_steps`

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | `integer` | NO | `nextval('service_tasks_id_seq'` |
| `service_id` | `integer` | NO | `` |
| `name` | `character varying` | YES | `` |
| `description` | `text` | YES | `` |
| `sequence_order` | `integer` | NO | `` |
| `is_active` | `boolean` | YES | `true` |
| `created_at` | `timestamp with time zone` | NO | `CURRENT_TIMESTAMP` |
| `updated_at` | `timestamp with time zone` | NO | `CURRENT_TIMESTAMP` |

## Table: `service_task_documents`

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | `integer` | NO | `nextval('service_task_document` |
| `service_task_id` | `integer` | NO | `` |
| `document_id` | `integer` | NO | `` |

## Table: `service_tasks`

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | `integer` | NO | `nextval('service_tasks_id_seq1` |
| `service_step_id` | `integer` | NO | `` |
| `name` | `character varying` | NO | `` |
| `description` | `text` | YES | `` |
| `default_duration_days` | `integer` | YES | `` |
| `sequence_order` | `integer` | NO | `0` |
| `is_mandatory` | `boolean` | YES | `true` |
| `is_active` | `boolean` | YES | `true` |
| `created_at` | `timestamp with time zone` | NO | `CURRENT_TIMESTAMP` |
| `updated_at` | `timestamp with time zone` | NO | `CURRENT_TIMESTAMP` |

## Table: `services`

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | `integer` | NO | `nextval('services_id_seq'::reg` |
| `name` | `character varying` | NO | `` |
| `code` | `character varying` | NO | `` |
| `description` | `text` | YES | `` |
| `is_active` | `boolean` | YES | `true` |
| `created_at` | `timestamp with time zone` | NO | `CURRENT_TIMESTAMP` |
| `updated_at` | `timestamp with time zone` | NO | `CURRENT_TIMESTAMP` |

## Table: `settings`

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | `integer` | NO | `nextval('settings_id_seq'::reg` |
| `key` | `character varying` | NO | `` |
| `value` | `text` | YES | `` |
| `description` | `character varying` | YES | `` |
| `created_at` | `timestamp with time zone` | NO | `CURRENT_TIMESTAMP` |
| `updated_at` | `timestamp with time zone` | NO | `CURRENT_TIMESTAMP` |

## Table: `task_comments`

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | `integer` | NO | `nextval('task_comments_id_seq'` |
| `project_task_id` | `integer` | NO | `` |
| `user_id` | `integer` | NO | `` |
| `comment` | `text` | NO | `` |
| `created_at` | `timestamp with time zone` | NO | `CURRENT_TIMESTAMP` |
| `updated_at` | `timestamp with time zone` | NO | `CURRENT_TIMESTAMP` |

## Table: `users`

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | `integer` | NO | `nextval('users_id_seq'::regcla` |
| `first_name` | `character varying` | NO | `` |
| `last_name` | `character varying` | NO | `` |
| `email` | `character varying` | NO | `` |
| `password_hash` | `character varying` | NO | `` |
| `phone` | `character varying` | YES | `` |
| `role_id` | `integer` | NO | `` |
| `organization_id` | `integer` | YES | `` |
| `is_active` | `boolean` | YES | `true` |
| `avatar_url` | `character varying` | YES | `` |
| `last_login_at` | `timestamp with time zone` | YES | `` |
| `created_at` | `timestamp with time zone` | NO | `CURRENT_TIMESTAMP` |
| `updated_at` | `timestamp with time zone` | NO | `CURRENT_TIMESTAMP` |

