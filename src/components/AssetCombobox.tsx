import React, { useState, useMemo } from 'react';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ASSET_CATEGORIES } from '@/data/assets';
import { useLanguage } from '@/contexts/LanguageContext';

interface AssetComboboxProps {
  value: string;
  onValueChange: (value: string) => void;
  customValue?: string;
  onCustomChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  showCustomInput?: boolean;
}

const AssetCombobox: React.FC<AssetComboboxProps> = ({
  value,
  onValueChange,
  customValue = '',
  onCustomChange,
  placeholder,
  className,
  showCustomInput = false,
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const { t, language } = useLanguage();

  // Flatten all assets for search
  const allAssets = useMemo(() => {
    const assets: { value: string; category: string }[] = [];
    for (const [category, categoryAssets] of Object.entries(ASSET_CATEGORIES)) {
      for (const asset of categoryAssets) {
        assets.push({ value: asset, category });
      }
    }
    return assets;
  }, []);

  // Filter assets based on search
  const filteredAssets = useMemo(() => {
    if (!search) return ASSET_CATEGORIES;
    const searchLower = search.toLowerCase();
    const result: { [key: string]: string[] } = {};
    
    for (const [category, assets] of Object.entries(ASSET_CATEGORIES)) {
      const filtered = assets.filter(asset => 
        asset.toLowerCase().includes(searchLower)
      );
      if (filtered.length > 0) {
        result[category] = filtered;
      }
    }
    return result;
  }, [search]);

  const displayValue = customValue || value || (language === 'fr' ? 'Sélectionner...' : 'Select...');

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between font-normal h-9 text-sm", className)}
        >
          <span className="truncate">{displayValue}</span>
          <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0 bg-popover border-border" align="start">
        <Command shouldFilter={false}>
          <div className="flex items-center border-b border-border px-3">
            <Search className="mr-2 h-3.5 w-3.5 shrink-0 opacity-50" />
            <input
              placeholder={placeholder || (language === 'fr' ? 'Rechercher un actif...' : 'Search asset...')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex h-9 w-full bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <CommandList className="max-h-[250px]">
            <CommandEmpty className="py-3 text-center text-sm text-muted-foreground">
              {language === 'fr' ? 'Aucun actif trouvé' : 'No asset found'}
            </CommandEmpty>
            {showCustomInput && search && !allAssets.some(a => a.value.toLowerCase() === search.toLowerCase()) && (
              <CommandItem
                value={`custom-${search}`}
                onSelect={() => {
                  onCustomChange?.(search.toUpperCase());
                  onValueChange('');
                  setOpen(false);
                  setSearch('');
                }}
                className="cursor-pointer"
              >
                <span className="text-primary">+ </span>
                {language === 'fr' ? 'Ajouter' : 'Add'} "{search.toUpperCase()}"
              </CommandItem>
            )}
            {Object.entries(filteredAssets).map(([category, assets]) => (
              <CommandGroup key={category} heading={category} className="px-1">
                {assets.map((asset) => (
                  <CommandItem
                    key={asset}
                    value={asset}
                    onSelect={() => {
                      onValueChange(asset);
                      onCustomChange?.('');
                      setOpen(false);
                      setSearch('');
                    }}
                    className="cursor-pointer text-sm py-1.5"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-3 w-3",
                        value === asset ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {asset}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default AssetCombobox;
