import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    HiOutlineViewGrid,
    HiOutlineOfficeBuilding,
    HiOutlineCollection,
    HiOutlineClipboardList,
    HiOutlineLogout,
    HiOutlineMenu,
    HiOutlineX,
    HiOutlineUsers,
    HiOutlineClipboardCheck,
    HiOutlineCog,
} from 'react-icons/hi';

const allNavItems = [
    { path: '/', label: 'Dashboard', icon: HiOutlineViewGrid, roles: ['Director', 'Manager', 'CEM', 'Senior Consultant', 'Consultant'] },
    { path: '/clients', label: 'Clients', icon: HiOutlineOfficeBuilding, roles: ['Director', 'Manager'] },
    { path: '/assignments', label: 'Assignments', icon: HiOutlineCollection, roles: ['Director', 'Manager'] },
    { path: '/projects', label: 'Projects', icon: HiOutlineClipboardList, roles: ['Director', 'Manager'] },
    { path: '/my-projects', label: 'My Projects', icon: HiOutlineClipboardList, roles: ['Senior Consultant'] },
    { path: '/my-tasks', label: 'My Tasks', icon: HiOutlineClipboardCheck, roles: ['Consultant'] },
    { path: '/users', label: 'Users', icon: HiOutlineUsers, roles: ['Director', 'Manager'] },
    { path: '/settings', label: 'Settings', icon: HiOutlineCog, roles: ['Director', 'Manager', 'CEM', 'Senior Consultant', 'Consultant'] },
];

const pageTitles = {
    '/': 'Dashboard',
    '/clients': 'Clients',
    '/assignments': 'Assignments',
    '/projects': 'Projects',
    '/my-projects': 'My Projects',
    '/my-tasks': 'My Tasks',
    '/users': 'Users',
    '/settings': 'Settings',
};

export default function Layout() {
    const { user, logout } = useAuth();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const roleName = user?.role_name || '';
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

    return (
        <div className="app-layout">
            {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

            <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-brand">
                    <div className="logo">PG</div>
                    <div>
                        <h2>GovernX</h2>
                        <span>Project Governance</span>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <div className="sidebar-section">
                        <div className="sidebar-section-title">Main Menu</div>
                        {navItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                end={item.path === '/'}
                                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                                onClick={() => setSidebarOpen(false)}
                            >
                                <span className="icon"><item.icon /></span>
                                {item.label}
                            </NavLink>
                        ))}
                    </div>
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
