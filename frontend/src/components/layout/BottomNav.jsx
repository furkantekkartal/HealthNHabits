import { NavLink } from 'react-router-dom';

const navItems = [
    { to: '/', icon: 'home', label: 'Home' },
    { to: '/catalog', icon: 'restaurant_menu', label: 'Catalog' },
    { to: '/log', icon: 'bar_chart', label: 'Insights' },
    { to: '/profile', icon: 'person', label: 'Profile' },
];

export default function BottomNav() {
    return (
        <nav className="fixed bottom-0 w-full max-w-md z-30 border-t border-gray-200 dark:border-gray-800 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-lg">
            <div className="flex justify-between items-center px-6 py-3">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) =>
                            `flex flex-col items-center gap-1 min-w-[60px] transition-colors ${isActive
                                ? 'text-primary'
                                : 'text-gray-400 dark:text-gray-500 hover:text-primary'
                            }`
                        }
                    >
                        <span className="material-symbols-outlined text-[28px]">{item.icon}</span>
                        <span className="text-[10px] font-medium">{item.label}</span>
                    </NavLink>
                ))}
            </div>
            {/* Safe area padding for iPhones */}
            <div className="h-5"></div>
        </nav>
    );
}
