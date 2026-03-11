import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    HiOutlineViewGrid,
    HiOutlineOfficeBuilding,
    HiOutlineCollection,
    HiOutlineClipboardList,
    HiOutlineCog,
    HiOutlineLogout,
    HiOutlineMenu,
    HiOutlineX,
    HiOutlineUsers,
} from 'react-icons/hi';

const navItems = [
    { path: '/', label: 'Dashboard', icon: HiOutlineViewGrid },
    { path: '/organizations', label: 'Organizations', icon: HiOutlineOfficeBuilding },
    { path: '/assignments', label: 'Assignments', icon: HiOutlineCollection },
    { path: '/projects', label: 'Projects', icon: HiOutlineClipboardList },
    { path: '/users', label: 'Team', icon: HiOutlineUsers },
];

const pageTitles = {
    '/': 'Dashboard',
    '/organizations': 'Organizations',
    '/assignments': 'Assignments',
    '/projects': 'Projects',
    '/users': 'Team',
};

export default function Layout() {
    const { user, logout } = useAuth();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const getPageTitle = () => {
        for (const [path, title] of Object.entries(pageTitles)) {
            if (location.pathname === path) return title;
        }
        if (location.pathname.startsWith('/projects/')) return 'Project Details';
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
