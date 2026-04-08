import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { HiOutlineBell, HiOutlineArrowLeft, HiOutlineUser, HiOutlineBadgeCheck, HiOutlineOfficeBuilding } from 'react-icons/hi';
import Breadcrumb from '../components/Breadcrumb';

export default function AnnouncementDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch the specific assignment details
        api.get(`/assignments/${id}`)
            .then(res => {
                setData(res.data);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;
    if (!data) return <div className="empty-state"><h3>Announcement not found</h3></div>;

    return (
        <div className="fade-in">
            <Breadcrumb items={[
                { label: 'Home', path: '/' },
                { label: 'Announcements', path: '/announcements' },
                { label: data.name, path: `/announcements/${id}` }
            ]} />

            <div style={{ marginBottom: '20px' }}>
                <button
                    onClick={() => navigate('/announcements')}
                    className="btn btn-secondary"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}
                >
                    <HiOutlineArrowLeft /> Back to Announcements
                </button>
            </div>

            <div className="card" style={{ maxWidth: '800px' }}>
                <div className="card-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            background: 'var(--bg-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--accent)',
                            fontSize: '20px'
                        }}>
                            <HiOutlineBell />
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>New Assignment Notification</h2>
                            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '14px' }}>You have been added to a new assignment.</p>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
                    <div className="detail-item">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', fontSize: '13px', marginBottom: '6px' }}>
                            <HiOutlineOfficeBuilding /> Assignment Name
                        </div>
                        <div style={{ fontSize: '16px', fontWeight: 600 }}>{data.name}</div>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>{data.organization_name}</div>
                    </div>

                    <div className="detail-item">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', fontSize: '13px', marginBottom: '6px' }}>
                            <HiOutlineUser /> Created By
                        </div>
                        <div style={{ fontSize: '16px', fontWeight: 600 }}>{data.created_by_name || 'System Admin'}</div>
                    </div>

                    <div className="detail-item">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', fontSize: '13px', marginBottom: '6px' }}>
                            <HiOutlineBadgeCheck /> Your Role
                        </div>
                        <div>
                            <span style={{
                                background: 'linear-gradient(135deg, var(--accent), #7c3aed)',
                                color: '#fff',
                                fontSize: '12px',
                                fontWeight: 700,
                                padding: '4px 12px',
                                borderRadius: '999px',
                                display: 'inline-block'
                            }}>
                                {data.my_title || 'Consultant'}
                            </span>
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: '32px', padding: '20px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: 700 }}>Next Steps</h4>
                    <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        You can now view this assignment in your <a href={`/assignments/${data.id}`} style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>Project Workspace</a>. 
                        Review the project requirements and connect with the Faber POC if you have any questions.
                    </p>
                </div>
            </div>
        </div>
    );
}
