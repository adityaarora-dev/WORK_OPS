import React from 'react';

export const Header = () => {
  return (
    <header className="app-header">
      <div className="header-container">
        <div className="logo-group">
          <div className="logo-icon">🏢</div>
          <div>
            <h1 className="logo-title">HR Management System</h1>
            <p className="logo-subtitle">Stage 1 — Foundation & Full-Stack Integration</p>
          </div>
        </div>
        <div className="header-tag">MERN Stack</div>
      </div>
    </header>
  );
};

export default Header;
