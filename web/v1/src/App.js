import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainWeb from './components/main/main.js';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<MainWeb />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;