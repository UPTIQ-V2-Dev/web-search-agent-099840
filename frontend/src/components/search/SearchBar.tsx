import { useState, useRef, useEffect } from 'react';
import { Search, X, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useDebounce } from '@/hooks/useDebounce';
import { useQuery } from '@tanstack/react-query';
import { getSearchSuggestions } from '@/services/searchApi';

interface SearchBarProps {
    value: string;
    onChange: (value: string) => void;
    onSearch: (query: string) => void;
    placeholder?: string;
    isLoading?: boolean;
}

export const SearchBar = ({
    value,
    onChange,
    onSearch,
    placeholder = 'Search the web...',
    isLoading = false
}: SearchBarProps) => {
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);
    const suggestionsRef = useRef<HTMLDivElement>(null);

    const debouncedValue = useDebounce(value, 300);

    const { data: suggestionData } = useQuery({
        queryKey: ['suggestions', debouncedValue],
        queryFn: () => getSearchSuggestions(debouncedValue),
        enabled: debouncedValue.length >= 2,
        staleTime: 5 * 60 * 1000 // 5 minutes
    });

    useEffect(() => {
        if (suggestionData && debouncedValue.length >= 2) {
            setSuggestions(suggestionData);
            setShowSuggestions(true);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    }, [suggestionData, debouncedValue]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                suggestionsRef.current &&
                !suggestionsRef.current.contains(event.target as Node) &&
                !inputRef.current?.contains(event.target as Node)
            ) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (value.trim()) {
            onSearch(value.trim());
            setShowSuggestions(false);
        }
    };

    const handleSuggestionClick = (suggestion: string) => {
        onChange(suggestion);
        onSearch(suggestion);
        setShowSuggestions(false);
        inputRef.current?.blur();
    };

    const handleClear = () => {
        onChange('');
        inputRef.current?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            setShowSuggestions(false);
            inputRef.current?.blur();
        }
    };

    return (
        <div className='relative w-full max-w-2xl mx-auto'>
            <form
                onSubmit={handleSubmit}
                className='relative'
            >
                <div className='relative'>
                    <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                    <Input
                        ref={inputRef}
                        type='text'
                        value={value}
                        onChange={e => onChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onFocus={() => {
                            if (suggestions.length > 0 && debouncedValue.length >= 2) {
                                setShowSuggestions(true);
                            }
                        }}
                        placeholder={placeholder}
                        className='pl-10 pr-20 py-3 text-base rounded-lg border-2 focus:border-primary'
                        disabled={isLoading}
                    />
                    <div className='absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1'>
                        {value && !isLoading && (
                            <Button
                                type='button'
                                variant='ghost'
                                size='sm'
                                onClick={handleClear}
                                className='h-7 w-7 p-0 hover:bg-muted'
                            >
                                <X className='h-3 w-3' />
                            </Button>
                        )}
                        <Button
                            type='submit'
                            size='sm'
                            disabled={isLoading || !value.trim()}
                            className='px-4'
                        >
                            {isLoading ? 'Searching...' : 'Search'}
                        </Button>
                    </div>
                </div>
            </form>

            {/* Search Suggestions */}
            {showSuggestions && suggestions.length > 0 && (
                <div
                    ref={suggestionsRef}
                    className='absolute top-full left-0 right-0 z-50 mt-1 bg-popover border rounded-lg shadow-lg max-h-60 overflow-y-auto'
                >
                    <div className='p-2 space-y-1'>
                        {suggestions.map((suggestion, index) => (
                            <button
                                key={`${suggestion}-${index}`}
                                onClick={() => handleSuggestionClick(suggestion)}
                                className='w-full text-left px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors text-sm flex items-center gap-2'
                            >
                                <Clock className='h-3 w-3 text-muted-foreground flex-shrink-0' />
                                <span>{suggestion}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
