import { ExternalLink, Calendar, User, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { SearchResult } from '@/types/search';
import { format } from 'date-fns';

interface ResultCardProps {
    result: SearchResult;
    onViewDetails?: (result: SearchResult) => void;
}

export const ResultCard = ({ result, onViewDetails }: ResultCardProps) => {
    const handleClick = () => {
        window.open(result.url, '_blank', 'noopener,noreferrer');
    };

    const formattedDate = format(new Date(result.publishedAt), 'MMM dd, yyyy');

    return (
        <Card className='hover:shadow-md transition-shadow duration-200 border-l-4 border-l-primary/20 hover:border-l-primary'>
            <CardContent className='p-4'>
                <div className='flex items-start justify-between gap-4'>
                    <div className='flex-1 space-y-2'>
                        {/* Title and Domain */}
                        <div className='space-y-1'>
                            <button
                                onClick={handleClick}
                                className='text-left group'
                            >
                                <h3 className='text-lg font-medium text-primary group-hover:underline line-clamp-2'>
                                    {result.title}
                                </h3>
                            </button>
                            <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                                <span className='text-green-600'>{result.domain}</span>
                                <Badge
                                    variant='secondary'
                                    className='text-xs'
                                >
                                    {result.contentType}
                                </Badge>
                            </div>
                        </div>

                        {/* Snippet */}
                        <p className='text-sm text-foreground/80 line-clamp-3 leading-relaxed'>{result.snippet}</p>

                        {/* Metadata */}
                        <div className='flex items-center gap-4 text-xs text-muted-foreground'>
                            <div className='flex items-center gap-1'>
                                <Calendar className='h-3 w-3' />
                                <span>{formattedDate}</span>
                            </div>

                            {result.metadata?.author && (
                                <div className='flex items-center gap-1'>
                                    <User className='h-3 w-3' />
                                    <span>{result.metadata.author}</span>
                                </div>
                            )}

                            {result.metadata?.wordCount && (
                                <div className='flex items-center gap-1'>
                                    <FileText className='h-3 w-3' />
                                    <span>{result.metadata.wordCount.toLocaleString()} words</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className='flex flex-col gap-2'>
                        <Button
                            variant='outline'
                            size='sm'
                            onClick={handleClick}
                            className='flex items-center gap-1'
                        >
                            <ExternalLink className='h-3 w-3' />
                            <span>Visit</span>
                        </Button>

                        {onViewDetails && (
                            <Button
                                variant='ghost'
                                size='sm'
                                onClick={() => onViewDetails(result)}
                                className='text-xs'
                            >
                                Details
                            </Button>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
