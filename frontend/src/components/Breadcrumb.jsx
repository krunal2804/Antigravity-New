import { Link, useNavigate } from 'react-router-dom';
import { HiOutlineArrowLeft, HiOutlineChevronRight, HiOutlineHome } from 'react-icons/hi';

export default function Breadcrumb({ items }) {
    const navigate = useNavigate();

    if (!items || items.length === 0) return null;

    // The parent path is usually the second to last item
    const parentPath = items.length > 1 ? items[items.length - 2].path : '/';
    const parentState = items.length > 1 ? items[items.length - 2].state : undefined;

    return (
        <div className="breadcrumb-wrapper">
            {items.length > 1 && (
                <button 
                    className="btn btn-secondary btn-sm breadcrumb-back-btn" 
                    onClick={() => navigate(parentPath, { state: parentState })}
                    title="Go back"
                >
                    <HiOutlineArrowLeft /> Back
                </button>
            )}
            
            <nav className="breadcrumb-path">
                {items.map((item, index) => {
                    const isLast = index === items.length - 1;
                    const isHome = item.label === 'Home';
                    
                    return (
                        <div key={index} className="breadcrumb-item-container">
                            {isLast ? (
                                <span className="breadcrumb-item active" title={item.label}>
                                    {isHome && <HiOutlineHome style={{ marginRight: '4px', verticalAlign: 'text-bottom' }} />}
                                    <span className="truncate-text">{item.label}</span>
                                </span>
                            ) : (
                                <Link to={item.path} state={item.state} className="breadcrumb-item link" title={item.label}>
                                    {isHome && <HiOutlineHome style={{ marginRight: '4px', verticalAlign: 'text-bottom' }} />}
                                    <span className="truncate-text">{item.label}</span>
                                </Link>
                            )}
                            
                            {!isLast && (
                                <HiOutlineChevronRight className="breadcrumb-separator" />
                            )}
                        </div>
                    );
                })}
            </nav>
        </div>
    );
}
