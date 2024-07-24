import React from 'react';
import '../styles/FileList.css';
import ComboBox from './ComboBox';

const FileList = () => {
  return (
    <div className="file-list-container" style={{ position: 'relative', zIndex: 1 }}>
      <h2>Projects</h2>
      <ComboBox />
    </div>
  );
}

export default FileList;