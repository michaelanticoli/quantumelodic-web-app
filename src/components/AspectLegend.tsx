import { motion } from 'framer-motion';
import { aspects } from './ZodiacWheel';

export const AspectLegend = () => {
  return (
    <motion.div
      className="flex flex-wrap justify-center gap-3 text-xs"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      {aspects.map((aspect) => (
        <div key={aspect.name} className="flex items-center gap-1.5">
          <div 
            className="w-4 h-0.5" 
            style={{ 
              backgroundColor: aspect.color,
              backgroundImage: aspect.dash ? 'none' : undefined,
            }}
          >
            {aspect.dash && (
              <svg width="16" height="2" className="block">
                <line
                  x1="0"
                  y1="1"
                  x2="16"
                  y2="1"
                  stroke={aspect.color}
                  strokeWidth="2"
                  strokeDasharray={aspect.dash}
                />
              </svg>
            )}
          </div>
          <span className="text-muted-foreground">
            {aspect.symbol} {aspect.name}
          </span>
        </div>
      ))}
    </motion.div>
  );
};
