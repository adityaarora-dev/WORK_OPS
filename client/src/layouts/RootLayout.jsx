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
        <p>Enterprise HRMS &copy; {new Date().getFullYear()} • All Rights Reserved</p>
      </footer>
    </div>
  );
};

export default RootLayout;
