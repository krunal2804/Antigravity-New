import { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import {
    HiOutlineViewGrid,
    HiOutlineOfficeBuilding,
    HiOutlineCollection,
    HiOutlineClipboardList,
    HiOutlineLogout,
    HiOutlineMenu,
    HiOutlineX,
    HiOutlineUsers,
    HiOutlineCog,
    HiOutlineTemplate,
    HiOutlineChevronDown,
    HiOutlineChevronRight,
    HiOutlineBell,
} from 'react-icons/hi';
import { formatWorkflowStatus } from '../utils/workflowStatus';

// Nav items — consulting roles no longer have /my-projects as a flat link;
// they navigate via the accordion labels instead.
const allNavItems = [
    { path: '/', label: 'Dashboard', icon: HiOutlineViewGrid, roles: ['Director', 'Manager', 'Senior Consultant', 'Consultant'] },
    { path: '/services', label: 'Services Builder', icon: HiOutlineTemplate, roles: ['Director', 'Manager'] },
    { path: '/clients', label: 'Clients', icon: HiOutlineOfficeBuilding, roles: ['Director', 'Manager'] },
    { path: '/assignments', label: 'Assignments', icon: HiOutlineCollection, roles: ['Director', 'Manager'] },
    { path: '/projects', label: 'Projects', icon: HiOutlineClipboardList, roles: ['Director', 'Manager'] },
    { path: '/users', label: 'Users', icon: HiOutlineUsers, roles: ['Director', 'Manager'] },
    { path: '/settings', label: 'Settings', icon: HiOutlineCog, roles: ['Director', 'Manager', 'Senior Consultant', 'Consultant'] },
];

const pageTitles = {
    '/': 'Dashboard',
    '/services': 'Services Builder',
    '/clients': 'Clients',
    '/assignments': 'Assignments',
    '/projects': 'Projects',
    '/my-assignments': 'My Assignments',
    '/my-projects': 'My Projects',
    '/users': 'Users',
    '/settings': 'Settings',
    '/announcements': 'Announcements',
};

const CONSULTING_ROLES = ['Consultant', 'Senior Consultant'];
const SIDEBAR_VISIBLE_STATUSES = new Set(['not_started', 'active']);

/**
 * Accordion section.
 * - Clicking the label / icon navigates to `linkTo`.
 * - Clicking the chevron button alone toggles the body open/closed.
 */
function SidebarAccordion({ icon: Icon, label, linkTo, children, defaultOpen = false, onNavigate }) {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <div className="sidebar-accordion">
            {/* Trigger row */}
            <div className="sidebar-accordion-trigger-row">
                {/* Clickable label — navigates to the list page */}
                <NavLink
                    to={linkTo}
                    end
                    className={({ isActive }) =>
                        `sidebar-accordion-nav-label nav-link ${isActive ? 'active' : ''}`
                    }
                    onClick={onNavigate}
                >
                    <span className="icon"><Icon /></span>
                    <span style={{ flex: 1 }}>{label}</span>
                </NavLink>

                {/* Chevron — only toggles the accordion */}
                <button
                    className="sidebar-accordion-chevron-btn"
                    onClick={() => setOpen(o => !o)}
                    title={open ? 'Collapse' : 'Expand'}
                    aria-expanded={open}
                >
                    {open ? <HiOutlineChevronDown /> : <HiOutlineChevronRight />}
                </button>
            </div>

            {open && (
                <div className="sidebar-accordion-body">
                    {children}
                </div>
            )}
        </div>
    );
}

// The consulting-role My Work sidebar panel
function ConsultingSidebar({ onNavigate }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchUnreadCount = () => {
        api.get('/notifications/unread-count')
            .then(res => setUnreadCount(res.data.count))
            .catch(console.error);
    };

    useEffect(() => {
        api.get('/dashboard/my-portal')
            .then(res => setData(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));

        fetchUnreadCount();

        const handleSeen = () => fetchUnreadCount();
        window.addEventListener('announcements_seen', handleSeen);
        return () => window.removeEventListener('announcements_seen', handleSeen);
    }, []);

    const assignments = data?.assignments || [];
    const visibleAssignments = assignments.filter((assignment) => SIDEBAR_VISIBLE_STATUSES.has(assignment.status));
    const allProjects = assignments.flatMap(a =>
        (a.projects || []).map(p => ({ ...p, assignment_name: a.name }))
    );
    const visibleProjects = allProjects.filter((project) => SIDEBAR_VISIBLE_STATUSES.has(project.status));

    if (loading) {
        return (
            <div style={{ padding: '8px 12px', fontSize: '12px', color: 'var(--text-muted)' }}>
                Loading…
            </div>
        );
    }

    return (
        <>
            <NavLink
                to="/announcements"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={onNavigate}
                style={{ position: 'relative', marginBottom: '8px' }}
            >
                <span className="icon"><HiOutlineBell /></span>
                Announcements
                {unreadCount > 0 && (
                    <span style={{
                        position: 'absolute',
                        top: '10px',
                        left: '26px',
                        width: '8px',
                        height: '8px',
                        background: 'var(--danger)',
                        borderRadius: '50%',
                        border: '2px solid #2d2d2d' // Matching sidebar background
                    }} />
                )}
            </NavLink>

            {/* ── MY ASSIGNMENTS ── */}
            <SidebarAccordion
                icon={HiOutlineCollection}
                label="My Assignments"
                linkTo="/my-assignments"
                defaultOpen={false}
                onNavigate={onNavigate}
            >
                {visibleAssignments.length === 0 ? (
                    <div className="sidebar-accordion-empty">No active items</div>
                ) : (
                    visibleAssignments.map(a => (
                        <NavLink
                            key={a.id}
                            to={`/assignments/${a.id}`}
                            state={{ from: '/my-assignments' }}
                            className={({ isActive }) =>
                                `sidebar-accordion-item ${isActive ? 'active' : ''}`
                            }
                            onClick={onNavigate}
                        >
                            <span className="sidebar-accordion-dot" />
                            <span className="sidebar-accordion-label">{a.name}</span>
                            {a.my_title && (
                                <span className="sidebar-accordion-badge">{a.my_title}</span>
                            )}
                        </NavLink>
                    ))
                )}
            </SidebarAccordion>

            {/* ── MY PROJECTS ── */}
            <SidebarAccordion
                icon={HiOutlineClipboardList}
                label="My Projects"
                linkTo="/my-projects"
                defaultOpen={false}
                onNavigate={onNavigate}
            >
                {visibleProjects.length === 0 ? (
                    <div className="sidebar-accordion-empty">No active items</div>
                ) : (
                    visibleProjects.map(p => (
                        <NavLink
                            key={p.id}
                            to={`/projects/${p.id}`}
                            state={{ from: '/my-projects' }}
                            className={({ isActive }) =>
                                `sidebar-accordion-item ${isActive ? 'active' : ''}`
                            }
                            onClick={onNavigate}
                        >
                            <span className="sidebar-accordion-dot" />
                            <span className="sidebar-accordion-label">{p.name}</span>
                            <span
                                className="sidebar-accordion-status"
                                data-status={p.status}
                            >
                                {formatWorkflowStatus(p.status)}
                            </span>
                        </NavLink>
                    ))
                )}
            </SidebarAccordion>
        </>
    );
}

export default function Layout() {
    const { user, logout } = useAuth();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const roleName = user?.role_name || '';
    const isConsultingRole = CONSULTING_ROLES.includes(roleName);
    const navItems = allNavItems.filter((item) => item.roles.includes(roleName));

    const getPageTitle = () => {
        for (const [path, title] of Object.entries(pageTitles)) {
            if (location.pathname === path) return title;
        }
        if (location.pathname.startsWith('/projects/')) return 'Project Details';
        if (location.pathname.startsWith('/assignments/')) return 'Assignment Details';
        if (location.pathname.startsWith('/clients/')) return 'Client Details';
        return 'Dashboard';
    };

    const initials = user ? `${user.first_name[0]}${user.last_name[0]}`.toUpperCase() : 'U';
    const closeSidebar = () => setSidebarOpen(false);

    return (
        <div className="app-layout">
            {sidebarOpen && <div className="sidebar-overlay" onClick={closeSidebar} />}

            <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-brand">
                    <img src="/logo.png" alt="Logo" className="logo" style={{ width: '36px', height: '36px', background: 'transparent', color: 'transparent', flexShrink: 0, objectFit: 'contain', padding: 0, borderRadius: 0, boxShadow: 'none' }} />
                    <div>
                        <h2>GovernX</h2>
                        <span>Project Governance</span>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    {/* ── MAIN MENU ── */}
                    <div className="sidebar-section">
                        <div className="sidebar-section-title">Main Menu</div>
                        {navItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                end={item.path === '/'}
                                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                                onClick={closeSidebar}
                            >
                                <span className="icon"><item.icon /></span>
                                {item.label}
                            </NavLink>
                        ))}
                    </div>

                    {/* ── MY WORK (consulting roles only) ── */}
                    {isConsultingRole && (
                        <div className="sidebar-section">
                            <div className="sidebar-section-title">My Work</div>
                            <ConsultingSidebar onNavigate={closeSidebar} />
                        </div>
                    )}
                </nav>

                <div className="sidebar-user">
                    <div className="avatar">{initials}</div>
                    <div className="user-info">
                        <div className="name">{user?.first_name} {user?.last_name}</div>
                        <div className="role">{user?.role_name}</div>
                    </div>
                    <button className="logout-btn" onClick={logout} title="Logout">
                        <HiOutlineLogout />
                    </button>
                </div>
            </aside>

            <div className="main-area">
                <header className="topbar">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button className="hamburger" onClick={() => setSidebarOpen(!sidebarOpen)}>
                            {sidebarOpen ? <HiOutlineX /> : <HiOutlineMenu />}
                        </button>
                        <h1>{getPageTitle()}</h1>
                    </div>
                </header>

                <main className="content-area">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
