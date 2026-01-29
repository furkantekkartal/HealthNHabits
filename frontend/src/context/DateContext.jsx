import { createContext, useContext, useState } from 'react';

const DateContext = createContext();

export function DateProvider({ children }) {
    const [selectedDate, setSelectedDate] = useState(new Date());

    const changeDate = (days) => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() + days);
        // Don't allow future dates
        if (newDate <= new Date()) {
            setSelectedDate(newDate);
        }
    };

    const goToToday = () => {
        setSelectedDate(new Date());
    };

    const isToday = () => {
        const today = new Date();
        return selectedDate.toDateString() === today.toDateString();
    };

    const formatDate = (date = selectedDate) => {
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    };

    const getDateString = (date = selectedDate) => {
        // Use local date components to avoid UTC conversion issues
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    return (
        <DateContext.Provider value={{
            selectedDate,
            setSelectedDate,
            changeDate,
            goToToday,
            isToday,
            formatDate,
            getDateString
        }}>
            {children}
        </DateContext.Provider>
    );
}

export function useDate() {
    const context = useContext(DateContext);
    if (!context) {
        throw new Error('useDate must be used within a DateProvider');
    }
    return context;
}
