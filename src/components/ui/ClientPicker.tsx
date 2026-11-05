import { useMemo, useState, type KeyboardEvent } from 'react';
import { ChevronDown } from 'lucide-react';
import { inputClassName } from '@/components/ui/FormField';
import type { Client } from '@/types/directory';

interface ClientPickerProps {
  id: string;
  clients: Client[];
  value: string | null;
  onChange: (clientId: string) => void;
  disabled?: boolean;
}

export default function ClientPicker({ id, clients, value, onChange, disabled = false }: ClientPickerProps) {
  const listId = `${id}-options`;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlight, setHighlight] = useState(0);

  const selectedName = clients.find((client) => client.id === value)?.name ?? '';

  const matches = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return clients.filter((client) => client.name.toLowerCase().includes(normalized));
  }, [clients, query]);

  const activeIndex = Math.min(highlight, Math.max(matches.length - 1, 0));

  const selectClient = (client: Client) => {
    onChange(client.id);
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
      selectClient(matches[activeIndex]);
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
        value={open ? query : selectedName}
        placeholder="Начните вводить название клиента"
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
            <li className="px-3 py-2 text-sm text-slate-500">Клиент не найден</li>
          ) : (
            matches.map((client, index) => {
              const active = index === activeIndex;
              const selected = client.id === value;
              return (
                <li
                  key={client.id}
                  id={`${listId}-${index}`}
                  role="option"
                  aria-selected={selected}
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setHighlight(index)}
                  onClick={() => selectClient(client)}
                  className={`cursor-pointer px-3 py-2 text-sm transition-colors ${
                    active ? 'bg-blue-50 text-blue-900' : 'text-slate-900'
                  } ${selected ? 'font-semibold' : ''}`}
                >
                  {client.name}
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}
