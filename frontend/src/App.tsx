import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import Home from './pages/Home';
import Recommendations from './pages/Recommendations';
import Search from './pages/Search';
import BookDetail from './pages/BookDetail';
import './App.css';

const App: React.FC = () => {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#722ed1',
          borderRadius: 8,
        },
      }}
    >
      <Router>
        <div className="app">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/home" element={<Navigate to="/" replace />} />
            <Route path="/recommendations" element={<Recommendations />} />
            <Route path="/search" element={<Search />} />
            <Route path="/book/:isbn" element={<BookDetail />} />
            {/* <Route path="/login" element={<Login />} /> */}
            {/* <Route path="*" element={<NotFound />} /> */}
          </Routes>
        </div>
      </Router>
    </ConfigProvider>
  );
};

export default App;
