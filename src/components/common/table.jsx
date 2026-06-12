export function Table({ children, className = "", containerClassName = "" }) {
  return (
    <div className={`overflow-x-auto ${containerClassName}`}>
      <table className={`w-full table-fixed ${className}`}>{children}</table>
    </div>
  );
}

export function TableEmpty({ colSpan, message = "Không có dữ liệu." }) {
  return (
    <tr>
      <td colSpan={colSpan} className="py-16 text-center text-sm text-muted-foreground">
        {message}
      </td>
    </tr>
  );
}
