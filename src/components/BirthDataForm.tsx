import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface BirthDataFormProps {
  onSubmit: (data: { name: string; date: string; time: string; location: string }) => void;
  isLoading?: boolean;
}

function parseDate(raw: string): string | null {
  const cleaned = raw.trim();
  if (!cleaned) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) return cleaned;
  const mdy = cleaned.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
  if (mdy) { const [, m, d, y] = mdy; return `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`; }
  const dmy = cleaned.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/);
  if (dmy) { const [, d, m, y] = dmy; const fullY = y.length === 2 ? `19${y}` : y; return `${fullY}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`; }
  const months: Record<string,string> = { january:'01',february:'02',march:'03',april:'04',may:'05',june:'06',july:'07',august:'08',september:'09',october:'10',november:'11',december:'12',jan:'01',feb:'02',mar:'03',apr:'04',jun:'06',jul:'07',aug:'08',sep:'09',oct:'10',nov:'11',dec:'12' };
  const named = cleaned.match(/^(\w+)\s+(\d{1,2})[,\s]+(\d{4})$/i) || cleaned.match(/^(\d{1,2})\s+(\w+)[,\s]+(\d{4})$/i);
  if (named) {
    const [, a, b, c] = named;
    const aMonth = months[a.toLowerCase()];
    if (aMonth) return `${c}-${aMonth}-${b.padStart(2,'0')}`;
    const bMonth = months[b.toLowerCase()];
    if (bMonth) return `${c}-${bMonth}-${a.padStart(2,'0')}`;
  }
  return null;
}

function parseTime(raw: string): string | null {
  const cleaned = raw.trim();
  if (!cleaned) return null;
  if (/^\d{2}:\d{2}$/.test(cleaned)) return cleaned;
  const hm = cleaned.match(/^(\d{1,2}):(\d{2})\s*(am|pm)?$/i);
  if (hm) {
    let h = parseInt(hm[1]);
    const m = hm[2];
    const ampm = (hm[3] || '').toLowerCase();
    if (ampm === 'pm' && h < 12) h += 12;
    if (ampm === 'am' && h === 12) h = 0;
    return `${String(h).padStart(2,'0')}:${m}`;
  }
  const digits = cleaned.match(/^(\d{3,4})$/);
  if (digits) { const d = digits[1].padStart(4,'0'); return `${d.slice(0,2)}:${d.slice(2)}`; }
  return null;
}

export const BirthDataForm = ({ onSubmit, isLoading }: BirthDataFormProps) => {
  const [formData, setFormData] = useState({ name: '', date: '', time: '', location: '' });
  const [dateError, setDateError] = useState('');
  const [timeError, setTimeError] = useState('');
  const [focused, setFocused] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedDate = parseDate(formData.date);
    if (!parsedDate) { setDateError('Enter date as MM/DD/YYYY or April 24 1985'); return; }
    setDateError('');
    const parsedTime = formData.time ? parseTime(formData.time) : '12:00';
    if (formData.time && !parsedTime) { setTimeError('Enter time as HH:MM or 7:55 PM'); return; }
    setTimeError('');
    onSubmit({ name: formData.name, date: parsedDate, time: parsedTime || '12:00', location: formData.location });
  };

  const fields = [
    { key: 'name', placeholder: 'Your Name', type: 'text', required: true, colSpan: 'full' as const },
    { key: 'date', placeholder: 'Date of Birth · MM/DD/YYYY', type: 'text', required: true, error: dateError, colSpan: 'full' as const },
    { key: 'time', placeholder: 'Birth Time · optional · HH:MM', type: 'text', required: false, error: timeError, colSpan: 'half' as const },
    { key: 'location', placeholder: 'City, Country', type: 'text', required: true, colSpan: 'half' as const },
  ];

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="w-full space-y-2.5"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.6 }}
    >
      {/* Full-width fields */}
      {fields.filter(f => f.colSpan === 'full').map((field, i) => (
        <motion.div
          key={field.key}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.35 + i * 0.07 }}
        >
          <div className="relative">
            <input
              type={field.type}
              placeholder={field.placeholder}
              value={(formData as any)[field.key]}
              onChange={(e) => {
                setFormData({ ...formData, [field.key]: e.target.value });
                if (field.key === 'date') setDateError('');
                if (field.key === 'time') setTimeError('');
              }}
              onFocus={() => setFocused(field.key)}
              onBlur={() => setFocused(null)}
              className="w-full px-4 py-3.5 rounded-xl text-sm text-foreground placeholder:text-muted-foreground/45 placeholder:text-xs focus:outline-none transition-all duration-300"
              style={{
                background: focused === field.key ? 'hsl(228 30% 9% / 0.85)' : 'hsl(228 30% 7% / 0.7)',
                border: field.error
                  ? '1px solid hsl(0 84% 62% / 0.4)'
                  : focused === field.key
                  ? '1px solid hsl(43 88% 58% / 0.45)'
                  : '1px solid hsl(255 25% 22% / 0.6)',
                backdropFilter: 'blur(12px)',
                boxShadow: focused === field.key ? '0 0 0 3px hsl(43 88% 58% / 0.06), inset 0 1px 0 hsl(255 25% 40% / 0.08)' : 'inset 0 1px 0 hsl(255 25% 30% / 0.05)',
              }}
              required={field.required}
            />
          </div>
          {field.error && (
            <p className="text-[10px] text-destructive/70 mt-1 pl-1 tracking-wide">{field.error}</p>
          )}
        </motion.div>
      ))}

      {/* Half-width row: time + location */}
      <motion.div
        className="grid grid-cols-2 gap-2.5"
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.49 }}
      >
        {fields.filter(f => f.colSpan === 'half').map((field) => (
          <div key={field.key}>
            <input
              type={field.type}
              placeholder={field.placeholder}
              value={(formData as any)[field.key]}
              onChange={(e) => {
                setFormData({ ...formData, [field.key]: e.target.value });
                if (field.key === 'time') setTimeError('');
              }}
              onFocus={() => setFocused(field.key)}
              onBlur={() => setFocused(null)}
              className="w-full px-4 py-3.5 rounded-xl text-sm text-foreground placeholder:text-muted-foreground/45 placeholder:text-[11px] focus:outline-none transition-all duration-300"
              style={{
                background: focused === field.key ? 'hsl(228 30% 9% / 0.85)' : 'hsl(228 30% 7% / 0.7)',
                border: field.error
                  ? '1px solid hsl(0 84% 62% / 0.4)'
                  : focused === field.key
                  ? '1px solid hsl(43 88% 58% / 0.45)'
                  : '1px solid hsl(255 25% 22% / 0.6)',
                backdropFilter: 'blur(12px)',
                boxShadow: focused === field.key ? '0 0 0 3px hsl(43 88% 58% / 0.06)' : 'none',
              }}
              required={field.required}
            />
            {field.error && <p className="text-[10px] text-destructive/70 mt-1 pl-1">{field.error}</p>}
          </div>
        ))}
      </motion.div>

      {/* Submit */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.56 }}
        className="pt-1"
      >
        <motion.button
          type="submit"
          disabled={isLoading || !formData.name || !formData.date || !formData.location}
          className="w-full py-4 rounded-xl font-display font-semibold text-sm tracking-wider uppercase transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: 'linear-gradient(135deg, hsl(43 88% 58%), hsl(35 90% 50%))',
            color: 'hsl(228 35% 5%)',
            boxShadow: '0 4px 24px hsl(43 88% 58% / 0.28), 0 1px 4px hsl(43 88% 58% / 0.2)',
          }}
          whileHover={{ scale: 1.01, boxShadow: '0 6px 30px hsl(43 88% 58% / 0.45)' }}
          whileTap={{ scale: 0.98 }}
        >
          {isLoading ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
              className="w-4 h-4 border-2 border-current border-t-transparent rounded-full mx-auto"
            />
          ) : (
            <span className="flex items-center justify-center gap-2">
              Generate Symphony
              <span className="opacity-70 text-base">›</span>
            </span>
          )}
        </motion.button>
      </motion.div>
    </motion.form>
  );
};
