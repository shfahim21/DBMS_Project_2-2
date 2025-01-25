// src/components/Common/DataTable.jsx
export function DataTable({ columns, data }) {
    return (
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.accessor} className="data-table-header">
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr key={item[columns[0].accessor]} className="data-table-row">
                {columns.map((column) => (
                  <td key={column.accessor} className="data-table-cell">
                    {column.render ? column.render(item) : item[column.accessor]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }