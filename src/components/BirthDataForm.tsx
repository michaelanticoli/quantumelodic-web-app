import { useState } from 'react';
import { motion } from 'framer-motion';

interface BirthDataFormProps {
  onSubmit: (data: { name: string; date: string; time: string; location: string }) => void;
  isLoading?: boolean;
}

function parseDate(raw: string): string | null {
  const cleaned = raw.trim();
  if (!cleaned) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) return cleaned;
  const mdy = cleaned.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  if (mdy) { const [, m, d, y] = mdy; return `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`; }
  const dmy = cleaned.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);
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

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  type?: string;
  autoComplete?: string;
}

const UnderlineField = ({ label, value, onChange, placeholder, error, required, type = 'text', autoComplete }: FieldProps) => (
  <div className="relative pt-5">
    <label className="absolute top-0 left-0 label-micro">{label}{required && <span className="text-accent ml-1">*</span>}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoComplete={autoComplete}
      required={required}
      className={`w-full bg-transparent border-0 border-b border-foreground/15 px-0 py-2 text-base text-foreground placeholder:text-foreground/25 focus:outline-none focus:border-accent transition-colors min-h-[44px] ${error ? 'border-destructive/70' : ''}`}
    />
    {error && <p className="text-[11px] text-destructive/80 mt-1 tracking-wide">{error}</p>}
  </div>
);

export const BirthDataForm = ({ onSubmit, isLoading }: BirthDataFormProps) => {
  const [formData, setFormData] = useState({ name: '', date: '', time: '', location: '' });
  const [dateError, setDateError] = useState('');
  const [timeError, setTimeError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedDate = parseDate(formData.date);
    if (!parsedDate) { setDateError('Use MM/DD/YYYY or April 24 1985'); return; }
    setDateError('');
    const parsedTime = formData.time ? parseTime(formData.time) : '12:00';
    if (formData.time && !parsedTime) { setTimeError('Use HH:MM or 7:55 PM'); return; }
    setTimeError('');
    onSubmit({ name: formData.name, date: parsedDate, time: parsedTime || '12:00', location: formData.location });
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="w-full space-y-6"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <UnderlineField
        label="Name"
        value={formData.name}
        onChange={(v) => setFormData({ ...formData, name: v })}
        placeholder="Your full name"
        required
        autoComplete="name"
      />
      <UnderlineField
        label="Date of Birth"
        value={formData.date}
        onChange={(v) => { setFormData({ ...formData, date: v }); setDateError(''); }}
        placeholder="MM / DD / YYYY"
        error={dateError}
        required
        autoComplete="bday"
      />
      <div className="grid grid-cols-2 gap-6">
        <UnderlineField
          label="Time"
          value={formData.time}
          onChange={(v) => { setFormData({ ...formData, time: v }); setTimeError(''); }}
          placeholder="HH:MM"
          error={timeError}
        />
        <UnderlineField
          label="Place"
          value={formData.location}
          onChange={(v) => setFormData({ ...formData, location: v })}
          placeholder="City, Country"
          required
        />
      </div>

      <div className="pt-4">
        <button
          type="submit"
          disabled={isLoading || !formData.name || !formData.date || !formData.location}
          className="group w-full min-h-[52px] py-4 rounded-full font-sans text-sm tracking-[0.2em] uppercase transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed bg-foreground text-background hover:bg-accent hover:text-accent-foreground"
        >
          {isLoading ? (
            <span className="inline-flex items-center justify-center gap-3">
              <span className="w-1 h-1 rounded-full bg-current animate-pulse" />
              <span>Generating</span>
            </span>
          ) : (
            <span className="inline-flex items-center justify-center gap-3">
              Generate Symphony
              <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
            </span>
          )}
        </button>
      </div>
    </motion.form>
  );
};
