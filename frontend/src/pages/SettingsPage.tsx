import { Settings, Palette, Search, Database } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const SettingsPage = () => {
    return (
        <div className='min-h-screen bg-background'>
            <div className='max-w-4xl mx-auto px-4 py-8'>
                <div className='mb-8'>
                    <div className='flex items-center gap-3 mb-4'>
                        <Settings className='h-6 w-6 text-primary' />
                        <h1 className='text-2xl font-bold'>Settings</h1>
                    </div>
                    <p className='text-muted-foreground'>Configure your search preferences and application settings</p>
                </div>

                <div className='grid gap-6 md:grid-cols-2'>
                    <Card className='border-dashed'>
                        <CardContent className='flex flex-col items-center justify-center py-8'>
                            <div className='rounded-full bg-muted p-3 mb-3'>
                                <Search className='h-6 w-6 text-muted-foreground' />
                            </div>
                            <div className='text-center space-y-1 mb-3'>
                                <h3 className='font-medium'>Search Preferences</h3>
                                <p className='text-sm text-muted-foreground'>
                                    Default filters, results per page, and more
                                </p>
                            </div>
                            <Badge
                                variant='outline'
                                className='text-xs'
                            >
                                Coming Soon
                            </Badge>
                        </CardContent>
                    </Card>

                    <Card className='border-dashed'>
                        <CardContent className='flex flex-col items-center justify-center py-8'>
                            <div className='rounded-full bg-muted p-3 mb-3'>
                                <Palette className='h-6 w-6 text-muted-foreground' />
                            </div>
                            <div className='text-center space-y-1 mb-3'>
                                <h3 className='font-medium'>Theme Settings</h3>
                                <p className='text-sm text-muted-foreground'>
                                    Customize appearance and theme preferences
                                </p>
                            </div>
                            <Badge
                                variant='outline'
                                className='text-xs'
                            >
                                Coming Soon
                            </Badge>
                        </CardContent>
                    </Card>

                    <Card className='border-dashed md:col-span-2'>
                        <CardContent className='flex flex-col items-center justify-center py-8'>
                            <div className='rounded-full bg-muted p-3 mb-3'>
                                <Database className='h-6 w-6 text-muted-foreground' />
                            </div>
                            <div className='text-center space-y-1 mb-3'>
                                <h3 className='font-medium'>Data Management</h3>
                                <p className='text-sm text-muted-foreground'>
                                    Manage search history, export data, and privacy settings
                                </p>
                            </div>
                            <Badge
                                variant='outline'
                                className='text-xs'
                            >
                                Coming Soon
                            </Badge>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};
