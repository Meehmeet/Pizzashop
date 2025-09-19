import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useState } from 'react'
import LoginForm from './components/LoginForm'
import RegisterForm from './components/RegisterForm'
import Homepage from './components/Homepage'
import { PopupContainer } from './components/Popup'

function App() {
  const [popups, setPopups] = useState([]);
  
  const addPopup = (message, type = 'success') => {
    const id = Math.random();
    const newPopup = { id, message, type };
    setPopups(prev => [...prev, newPopup]);
  };

  const removePopup = (id) => {
    setPopups(prev => prev.filter(popup => popup.id !== id));
  };

  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<LoginForm addPopup={addPopup} />} />
          <Route path="/register" element={<RegisterForm addPopup={addPopup} />} />
          <Route path="/homepage" element={<Homepage addPopup={addPopup} />} />
        </Routes>
      </div>
      <PopupContainer popups={popups} removePopup={removePopup} />
    </Router>
  )
}

export default App
