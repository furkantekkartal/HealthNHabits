import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';

export default function Layout() {
    return (
        <div className="mx-auto w-full max-w-md min-h-screen bg-[#f6f8f6] text-[#102210] shadow-xl relative flex flex-col overflow-hidden">
            <Outlet />
            <BottomNav />
        </div>
    );
}
