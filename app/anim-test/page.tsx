'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const tabs = ['Buffet', 'Lunch', 'Dînatoire'];
const products: Record<string, string[]> = {
  Buffet: ['Croissants', 'Fruit Platter', 'Yogurt Parfait', 'Granola Bowl', 'Smoked Salmon', 'Pastry Box'],
  Lunch: ['Club Sandwich', 'Caesar Salad', 'Soup du Jour', 'Quiche Lorraine'],
  Dînatoire: ['Bruschetta', 'Mini Tartare', 'Cheese Board', 'Charcuterie', 'Crostini', 'Arancini', 'Deviled Eggs', 'Spring Rolls'],
};

export default function AnimTestPage() {
  const [active, setActive] = useState('Buffet');

  return (
    <main className="pt-24 px-8 max-w-[1200px] mx-auto space-y-12 pb-24">
      <h1 className="text-4xl" style={{ color: '#1A3821' }}>Animation Test</h1>

      {/* Tabs */}
      <div className="flex gap-4">
        {tabs.map((t) => (
          <button key={t} onClick={() => setActive(t)}
            className="text-[32px] transition-colors"
            style={{ color: active === t ? '#1A3821' : 'rgba(26,56,33,0.3)' }}>
            {t}
          </button>
        ))}
      </div>

      {/* Grid with scroll-triggered stagger — Lobster style */}
      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {products[active].map((name, i) => (
            <motion.div
              key={name}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1], delay: i * 0.08 }}
            >
              <div className="aspect-[4/5] bg-[#dad5bb] rounded-sm mb-3" />
              <p className="text-[16px]" style={{ color: '#1A3821' }}>{name}</p>
              <p className="text-[14px] text-gray-400">$12.00</p>
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>
    </main>
  );
}
