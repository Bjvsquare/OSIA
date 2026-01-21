import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface TimeRockerProps {
    value: string; // "HH:mm" format (24h)
    onChange: (value: string) => void;
}

export const TimeRocker: React.FC<TimeRockerProps> = ({ value, onChange }) => {
    // Parse "HH:mm" to 12h format
    const [hours, setHours] = useState('12');
    const [minutes, setMinutes] = useState('00');
    const [period, setPeriod] = useState<'AM' | 'PM'>('AM');

    useEffect(() => {
        if (value) {
            const [h, m] = value.split(':');
            let hr = parseInt(h);
            const prd = hr >= 12 ? 'PM' : 'AM';
            hr = hr % 12;
            hr = hr ? hr : 12; // the hour '0' should be '12'
            setHours(hr.toString().padStart(2, '0'));
            setMinutes(m);
            setPeriod(prd);
        }
    }, [value]);

    const updateValue = (h: string, m: string, p: 'AM' | 'PM') => {
        let hr = parseInt(h);
        if (p === 'PM' && hr < 12) hr += 12;
        if (p === 'AM' && hr === 12) hr = 0;
        const formattedH = hr.toString().padStart(2, '0');
        onChange(`${formattedH}:${m}`);
    };

    const handleHourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value.replace(/\D/g, '');
        if (val.length > 2) val = val.slice(0, 2);
        const hr = parseInt(val);
        if (hr > 12) val = '12';
        setHours(val);
        if (val && parseInt(val) > 0 && parseInt(val) <= 12) {
            updateValue(val.padStart(2, '0'), minutes, period);
        }
    };

    const handleMinuteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value.replace(/\D/g, '');
        if (val.length > 2) val = val.slice(0, 2);
        const mn = parseInt(val);
        if (mn > 59) val = '59';
        setMinutes(val);
        if (val && val.length === 2) {
            updateValue(hours, val, period);
        }
    };

    const togglePeriod = () => {
        const newPeriod = period === 'AM' ? 'PM' : 'AM';
        setPeriod(newPeriod);
        updateValue(hours, minutes, newPeriod);
    };

    return (
        <div className="flex items-center gap-3">
            <div className="flex items-center bg-black/40 border border-white/10 rounded-xl overflow-hidden focus-within:border-osia-teal-500/50 transition-colors">
                <input
                    type="text"
                    value={hours}
                    onChange={handleHourChange}
                    onBlur={() => setHours(hours.padStart(2, '0'))}
                    className="w-12 h-10 bg-transparent text-center text-white text-lg font-bold focus:outline-none"
                    placeholder="12"
                />
                <span className="text-osia-neutral-500 font-bold">:</span>
                <input
                    type="text"
                    value={minutes}
                    onChange={handleMinuteChange}
                    onBlur={() => setMinutes(minutes.padStart(2, '0'))}
                    className="w-12 h-10 bg-transparent text-center text-white text-lg font-bold focus:outline-none"
                    placeholder="00"
                />
            </div>

            <div
                onClick={togglePeriod}
                className="relative h-10 w-24 bg-black/40 border border-white/10 rounded-xl p-1 cursor-pointer select-none"
            >
                <div className="absolute inset-0 flex">
                    <div className="flex-1 flex items-center justify-center text-[10px] font-black text-osia-neutral-500">AM</div>
                    <div className="flex-1 flex items-center justify-center text-[10px] font-black text-osia-neutral-500">PM</div>
                </div>

                <motion.div
                    animate={{ x: period === 'AM' ? 0 : 44 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className="w-[46px] h-full bg-osia-teal-500 rounded-lg flex items-center justify-center text-[10px] font-black text-white shadow-[0_0_15px_rgba(56,163,165,0.4)] relative z-10"
                >
                    {period}
                </motion.div>
            </div>
        </div>
    );
};
