import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../components/Header';

export const RootLayout = () => {
  return (
    <div className="layout-root">
      <Header />
      <main className="layout-main">
        <Outlet />
      </main>
      <footer className="layout-footer">
        <p>HR Management System &copy; {new Date().getFullYear()} — Stage 1 Foundation</p>
      </footer>
    </div>
  );
};

export default RootLayout;
