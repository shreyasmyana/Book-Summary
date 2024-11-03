import React from 'react';
import PdfUploader from './components/PdfUploader';

const App: React.FC = () => {
  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <PdfUploader />
    </div>
  );
};

export default App;
