import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface BirthDataFormProps {
  onSubmit: (data: { name: string; date: string; time: string; location: string }) => void;
  isLoading?: boolean;
}

// Parse free-form date text → YYYY-MM-DD
function parseDate(raw: string): string | null {
  const cleaned = raw.trim();
  if (!cleaned) return null;

  // Already ISO: 1985-04-24
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) return cleaned;

  // MM/DD/YYYY or M/D/YYYY
  const mdy = cleaned.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
  if (mdy) {
    const [, m, d, y] = mdy;
    return `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;
  }

  // DD/MM/YYYY (if month > 12, assume D/M/Y)
  const dmy = cleaned.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/);
  if (dmy) {
    const [, d, m, y] = dmy;
    const fullY = y.length === 2 ? `19${y}` : y;
    return `${fullY}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;
  }

  // Month name: April 24 1985 / 24 April 1985
  const months: Record<string,string> = {
    january:'01',february:'02',march:'03',april:'04',may:'05',june:'06',
    july:'07',august:'08',september:'09',october:'10',november:'11',december:'12',
    jan:'01',feb:'02',mar:'03',apr:'04',jun:'06',jul:'07',aug:'08',
    sep:'09',oct:'10',nov:'11',dec:'12',
  };
  const named = cleaned.match(/^(\w+)\s+(\d{1,2})[,\s]+(\d{4})$/i)
    || cleaned.match(/^(\d{1,2})\s+(\w+)[,\s]+(\d{4})$/i);
  if (named) {
    const [, a, b, c] = named;
    // Determine which token is the month name
    const aMonth = months[a.toLowerCase()];
    if (aMonth) return `${c}-${aMonth}-${b.padStart(2,'0')}`;
    const bMonth = months[b.toLowerCase()];
    if (bMonth) return `${c}-${bMonth}-${a.padStart(2,'0')}`;
  }

  return null;
}

// Parse free-form time text → HH:MM (24h)
function parseTime(raw: string): string | null {
  const cleaned = raw.trim();
  if (!cleaned) return null;

  // HH:MM already
  if (/^\d{2}:\d{2}$/.test(cleaned)) return cleaned;

  // H:MM or HH:MM with optional AM/PM
  const hm = cleaned.match(/^(\d{1,2}):(\d{2})\s*(am|pm)?$/i);
  if (hm) {
    let h = parseInt(hm[1]);
    const m = hm[2];
    const ampm = (hm[3] || '').toLowerCase();
    if (ampm === 'pm' && h < 12) h += 12;
    if (ampm === 'am' && h === 12) h = 0;
    return `${String(h).padStart(2,'0')}:${m}`;
  }

  // Plain digits: 1955 → 19:55, 755 → 07:55
  const digits = cleaned.match(/^(\d{3,4})$/);
  if (digits) {
    const d = digits[1].padStart(4,'0');
    return `${d.slice(0,2)}:${d.slice(2)}`;
  }

  return null;
}

export const BirthDataForm = ({ onSubmit, isLoading }: BirthDataFormProps) => {
  const [formData, setFormData] = useState({ name: '', date: '', time: '', location: '' });
  const [dateError, setDateError] = useState('');
  const [timeError, setTimeError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const parsedDate = parseDate(formData.date);
    if (!parsedDate) {
      setDateError('Enter date as MM/DD/YYYY or April 24 1985');
      return;
    }
    setDateError('');

    const parsedTime = formData.time ? parseTime(formData.time) : '12:00';
    if (formData.time && !parsedTime) {
      setTimeError('Enter time as HH:MM or 7:55 PM');
      return;
    }
    setTimeError('');

    onSubmit({
      name: formData.name,
      date: parsedDate,
      time: parsedTime || '12:00',
      location: formData.location,
    });
  };

  const inputClasses = `
    w-full px-5 py-4
    bg-muted/20 backdrop-blur-xl
    border border-border/30 
    rounded-xl
    text-foreground text-sm tracking-wide
    placeholder:text-muted-foreground/60 placeholder:text-sm
    focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40
    transition-all duration-500 ease-out
  `;

  const errorClasses = 'text-xs text-red-400/80 mt-1 pl-1';

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="w-full max-w-sm space-y-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
        <input
          type="text"
          placeholder="Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className={inputClasses}
          required
        />
      </motion.div>

      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
        <input
          type="text"
          placeholder="Date of Birth (MM/DD/YYYY)"
          value={formData.date}
          onChange={(e) => { setFormData({ ...formData, date: e.target.value }); setDateError(''); }}
          className={`${inputClasses} ${dateError ? 'border-red-400/50' : ''}`}
          required
        />
        {dateError && <p className={errorClasses}>{dateError}</p>}
      </motion.div>

      <motion.div
        className="grid grid-cols-2 gap-3"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.6 }}
      >
        <div>
          <input
            type="text"
            placeholder="Time (HH:MM or 7:55 PM)"
            value={formData.time}
            onChange={(e) => { setFormData({ ...formData, time: e.target.value }); setTimeError(''); }}
            className={`${inputClasses} ${timeError ? 'border-red-400/50' : ''}`}
          />
          {timeError && <p className={errorClasses}>{timeError}</p>}
        </div>
        <div className="flex items-center justify-center text-muted-foreground/50 text-xs tracking-wide italic">
          optional
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 }}>
        <input
          type="text"
          placeholder="Location (City, Country)"
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          className={inputClasses}
          required
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="pt-2"
      >
        <Button
          type="submit"
          variant="cosmic"
          size="lg"
          className="w-full"
          disabled={isLoading || !formData.name || !formData.date || !formData.location}
        >
          {isLoading ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
              className="w-4 h-4 border border-primary-foreground/80 border-t-transparent rounded-full"
            />
          ) : (
            <span className="flex items-center gap-2 text-sm tracking-wide">
              Generate Symphony
              <span className="text-lg opacity-80">›</span>
            </span>
          )}
        </Button>
      </motion.div>
    </motion.form>
  );
};
