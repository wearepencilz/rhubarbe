const Table = ({ children, className = '' }) => {
  return (
    <div className={`overflow-hidden border border-gray-200 rounded-lg ${className}`}>
      <table className="min-w-full divide-y divide-gray-200">
        {children}
      </table>
    </div>
  )
}

const TableHeader = ({ children }) => {
  return (
    <thead className="bg-gray-50">
      {children}
    </thead>
  )
}

const TableBody = ({ children }) => {
  return (
    <tbody className="bg-white divide-y divide-gray-200">
      {children}
    </tbody>
  )
}

const TableRow = ({ children, onClick, className = '' }) => {
  return (
    <tr 
      onClick={onClick}
      className={`
        ${onClick ? 'cursor-pointer hover:bg-gray-50' : ''}
        transition-colors
        ${className}
      `}
    >
      {children}
    </tr>
  )
}

const TableHead = ({ children, className = '' }) => {
  return (
    <th 
      className={`
        px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider
        ${className}
      `}
    >
      {children}
    </th>
  )
}

const TableCell = ({ children, className = '' }) => {
  return (
    <td className={`px-6 py-4 whitespace-nowrap text-sm ${className}`}>
      {children}
    </td>
  )
}

Table.Header = TableHeader
Table.Body = TableBody
Table.Row = TableRow
Table.Head = TableHead
Table.Cell = TableCell

export default Table
