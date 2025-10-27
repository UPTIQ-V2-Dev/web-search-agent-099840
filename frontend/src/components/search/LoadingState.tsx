import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

export const LoadingState = () => {
    return (
        <div className='space-y-4'>
            {[...Array(5)].map((_, index) => (
                <Card key={index}>
                    <CardContent className='p-4'>
                        <div className='space-y-3'>
                            <div className='flex items-center gap-2'>
                                <Skeleton className='h-4 w-24' />
                                <Skeleton className='h-5 w-12 rounded' />
                            </div>
                            <Skeleton className='h-6 w-3/4' />
                            <div className='space-y-2'>
                                <Skeleton className='h-4 w-full' />
                                <Skeleton className='h-4 w-5/6' />
                                <Skeleton className='h-4 w-2/3' />
                            </div>
                            <div className='flex items-center gap-4'>
                                <Skeleton className='h-3 w-16' />
                                <Skeleton className='h-3 w-20' />
                                <Skeleton className='h-3 w-24' />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};
