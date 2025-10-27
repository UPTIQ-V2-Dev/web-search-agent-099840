import { Outlet } from 'react-router-dom';
import { Header } from './Header';

export const AppLayout = () => {
    return (
        <div className='min-h-screen bg-background'>
            <Header />
            <main className='flex-1'>
                <Outlet />
            </main>
        </div>
    );
};
