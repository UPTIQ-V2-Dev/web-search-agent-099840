import { Search, History, Settings, Moon, Sun } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList
} from '@/components/ui/navigation-menu';
import { cn } from '@/lib/utils';

export const Header = () => {
    const location = useLocation();
    const { theme, setTheme } = useTheme();

    const navigation = [
        { name: 'Search', href: '/', icon: Search },
        { name: 'History', href: '/history', icon: History },
        { name: 'Settings', href: '/settings', icon: Settings }
    ];

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    return (
        <header className='sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
            <div className='container flex h-14 items-center'>
                <div className='mr-4 flex'>
                    <Link
                        to='/'
                        className='mr-6 flex items-center space-x-2'
                    >
                        <Search className='h-6 w-6' />
                        <span className='font-bold'>Search Agent</span>
                    </Link>
                </div>

                <NavigationMenu className='flex flex-1'>
                    <NavigationMenuList>
                        {navigation.map(item => (
                            <NavigationMenuItem key={item.name}>
                                <NavigationMenuLink asChild>
                                    <Link
                                        to={item.href}
                                        className={cn(
                                            'group inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50',
                                            location.pathname === item.href && 'bg-accent text-accent-foreground'
                                        )}
                                    >
                                        <item.icon className='mr-2 h-4 w-4' />
                                        {item.name}
                                    </Link>
                                </NavigationMenuLink>
                            </NavigationMenuItem>
                        ))}
                    </NavigationMenuList>
                </NavigationMenu>

                <div className='flex items-center space-x-2'>
                    <Button
                        variant='ghost'
                        size='sm'
                        onClick={toggleTheme}
                        className='h-9 w-9 px-0'
                    >
                        <Sun className='h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0' />
                        <Moon className='absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100' />
                        <span className='sr-only'>Toggle theme</span>
                    </Button>
                </div>
            </div>
        </header>
    );
};
