import { useCallback, useMemo, useState } from 'react';
import { Avatar } from './Avatar';

type Props = {
  members: Member[];
  onSelect: (id: string) => void;
};

export function MemberList({ members, onSelect }: Props) {
  const [query, setQuery] = useState('');

  const visible = useMemo(
    () => members.filter((m) => m.email.toLowerCase().includes(query)),
    [members, query],
  );

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value.trim().toLowerCase());
  }, []);

  return (
    <section className="member-list">
      <input value={query} onChange={handleChange} placeholder="Filter…" />
      {visible.length === 0 ? (
        <p className="empty">No members match “{query}”.</p>
      ) : (
        <ul>
          {visible.map((member) => (
            <li key={member.id} onClick={() => onSelect(member.id)}>
              <Avatar email={member.email} size={24} />
              <span>{member.email}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
