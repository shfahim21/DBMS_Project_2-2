// import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
// import Customers from './components/Customers';
// import Authors from './components/Authors';
// import Categories from './components/Categories';
// import './App.css';

// function App() {
//   return (
//     <Router>
//       <div className="App">
//         <nav className="tabs">
//           <NavLink 
//             to="/customers" 
//             className={({ isActive }) => isActive ? 'active' : ''}
//           >
//             Customers
//           </NavLink>
//           <NavLink 
//             to="/authors"
//             className={({ isActive }) => isActive ? 'active' : ''}
//           >
//             Authors
//           </NavLink>
//           <NavLink 
//             to="/categories"
//             className={({ isActive }) => isActive ? 'active' : ''}
//           >
//             Categories
//           </NavLink>
//         </nav>

//         <Routes>
//           <Route path="/customers" element={<Customers />} />
//           <Route path="/authors" element={<Authors />} />
//           <Route path="/categories" element={<Categories />} />
//           <Route path="/" element={<Customers />} />
//         </Routes>
//       </div>
//     </Router>
//   );
// }

// export default App;

// App.jsx
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import Customers from './components/Customers';
import Authors from './components/Authors';
import Categories from './components/Categories';
import Publishers from './components/Publishers';
import Orders from './components/Orders';
import Books from './components/Books';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <header className="app-header">
          <div className="header-content">
            <svg className="logo" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
            </svg>
            <h1>BookStore Management System</h1>
          </div>
        </header>

        <nav className="tabs">
          
          <NavLink 
            to="/customers" 
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            Customers
          </NavLink>
          <NavLink 
            to="/authors"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            Authors
          </NavLink>
          <NavLink 
            to="/categories"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            Categories
          </NavLink>

          <NavLink
            to="/publishers"
            className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}
          >
            Publishers
          </NavLink>
          <NavLink
          to={"/orders"}
          className={({isActive}) => `nav-link ${isActive ? 'active' :' '}`}
          >
            Orders
          </NavLink>
          <NavLink
            to="/books"
            className={({isActive}) => `nav-link ${isActive? 'active' : ''}`}
          >
            Books
          </NavLink>
        </nav>

        <main className="main-content">
          <Routes>
            
            <Route path="/customers" element={<Customers />} />
            <Route path="/authors" element={<Authors />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/publishers" element={<Publishers />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/" element={<Customers />} />
            <Route path="/books" element={<Books />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;