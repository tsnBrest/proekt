import { useMemo, useState, type KeyboardEvent } from 'react';
import { ChevronDown } from 'lucide-react';
import { inputClassName } from '@/components/ui/FormField';
import type { EquipmentModel } from '@/types/directory';

interface ModelPickerProps {
  id: string;
  models: EquipmentModel[];
  value: string;
  onModelChange: (model: string) => void;
  onSoftwareVersionChange: (softwareVersion: string) => void;
  disabled?: boolean;
}

export default function ModelPicker({
  id,
  models,
  value,
  onModelChange,
  onSoftwareVersionChange,
  disabled = false,
}: ModelPickerProps) {
  const listId = `${id}-options`;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlight, setHighlight] = useState(0);

  const matches = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return models.filter((model) => model.model.toLowerCase().includes(normalized));
  }, [models, query]);

  const activeIndex = Math.min(highlight, Math.max(matches.length - 1, 0));

  const selectModel = (model: EquipmentModel) => {
    onModelChange(model.model);
    onSoftwareVersionChange(model.software_version);
    setOpen(false);
    setQuery('');
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setOpen(true);
      setHighlight(Math.min(activeIndex + 1, matches.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlight(Math.max(activeIndex - 1, 0));
    } else if (event.key === 'Enter' && open && matches[activeIndex]) {
      event.preventDefault();
      selectModel(matches[activeIndex]);
    } else if (event.key === 'Escape') {
      setOpen(false);
      setQuery('');
    }
  };

  return (
    <div className="relative">
      <input
        id={id}
        type="text"
        role="combobox"
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open && matches[activeIndex] ? `${listId}-${activeIndex}` : undefined}
        value={open ? query : value}
        placeholder="Начните вводить модель"
        disabled={disabled}
        onFocus={() => {
          setOpen(true);
          setQuery('');
          setHighlight(0);
        }}
        onBlur={() => {
          setOpen(false);
          setQuery('');
        }}
        onChange={(event) => {
          setQuery(event.target.value);
          setHighlight(0);
          setOpen(true);
          onModelChange(event.target.value);
        }}
        onKeyDown={handleKeyDown}
        className={`${inputClassName} pr-10`}
      />
      <ChevronDown
        className={`pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
      />

      {open && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
        >
          {matches.length === 0 ? (
            <li className="px-3 py-2 text-sm text-slate-500">Модель не найдена</li>
          ) : (
            matches.map((model, index) => {
              const active = index === activeIndex;
              const selected = model.model === value;
              return (
                <li
                  key={model.id}
                  id={`${listId}-${index}`}
                  role="option"
                  aria-selected={selected}
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setHighlight(index)}
                  onClick={() => selectModel(model)}
                  className={`cursor-pointer px-3 py-2 text-sm transition-colors ${
                    active ? 'bg-blue-50 text-blue-900' : 'text-slate-900'
                  } ${selected ? 'font-semibold' : ''}`}
                >
                  {model.model}
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}
