import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';

interface BirthDataFormProps {
  onSubmit: (data: { name: string; date: string; time: string; location: string }) => void;
  isLoading?: boolean;
}

export const BirthDataForm = ({ onSubmit, isLoading }: BirthDataFormProps) => {
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    time: '',
    location: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const inputClasses = `
    w-full px-4 py-3.5
    bg-muted/30 backdrop-blur-md
    border border-border/40 
    rounded-xl
    text-foreground placeholder:text-muted-foreground
    focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50
    transition-all duration-300
    [color-scheme:dark]
  `;

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="w-full max-w-sm space-y-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.4 }}
      >
        <input
          type="text"
          placeholder="Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className={inputClasses}
          required
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5 }}
      >
        <input
          type="date"
          placeholder="Date of Birth"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          className={inputClasses}
          required
        />
      </motion.div>

      <motion.div
        className="grid grid-cols-2 gap-3"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.6 }}
      >
        <input
          type="time"
          placeholder="Time"
          value={formData.time}
          onChange={(e) => setFormData({ ...formData, time: e.target.value })}
          className={inputClasses}
        />
        <div className="flex items-center justify-center text-muted-foreground text-sm">
          (optional)
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.7 }}
      >
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
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full"
            />
          ) : (
            <>
              Generate My Cosmic Symphony
              <Play className="w-4 h-4 ml-1" />
            </>
          )}
        </Button>
      </motion.div>
    </motion.form>
  );
};
