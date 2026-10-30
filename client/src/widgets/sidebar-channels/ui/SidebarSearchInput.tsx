import * as React from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/shared/ui/input';

export interface SidebarSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  placeholder?: string;
}

export const SidebarSearchInput: React.FC<SidebarSearchInputProps> = ({
  value,
  onChange,
  onClear,
  placeholder = 'Jump to or search...',
}) => {
  return (
    <div className="relative px-1">
      <Search className="absolute inset-y-0 left-0 my-auto ml-3.5 h-3.5 w-3.5 text-sidebar-foreground/50" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-8 pl-8 pr-7 text-xs bg-sidebar-accent/50 border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-foreground/50 rounded-lg focus-visible:ring-1"
      />
      {value && (
        <button
          type="button"
          onClick={onClear}
          title="Clear search"
          className="absolute inset-y-0 right-0 my-auto mr-3 flex items-center text-sidebar-foreground/50 hover:text-sidebar-foreground cursor-pointer"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
};
