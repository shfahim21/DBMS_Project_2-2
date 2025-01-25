// src/components/Common/SearchBar.jsx
export function SearchBar({ value, onChange }) {
    return (
      <div className="search-container">
        <input
          type="text"
          placeholder="Search..."
          className="search-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    );
  }