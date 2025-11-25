import React, { useState } from 'react';
import LandingPage from './components/LandingPage';
import HandDetector from './components/HandDetector';

const App: React.FC = () => {
  const [hasStarted, setHasStarted] = useState(false);

  return (
    <>
      {hasStarted ? (
        <HandDetector />
      ) : (
        <LandingPage onStart={() => setHasStarted(true)} />
      )}
    </>
  );
};

export default App;