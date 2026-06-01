import '@fontsource/public-sans';
import '@uswds/uswds/dist/css/uswds.min.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import HRSpecialist from './hr-specialist';

const root = document.getElementById('root');
root && createRoot(root).render(<HRSpecialist />);
