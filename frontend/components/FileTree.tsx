export default function FileTree({ files, onSelect, active }) {
  return (
    <div className="p-2 text-sm border-r">
      {Object.keys(files).map((path) => (
        <div
          key={path}
          className={`cursor-pointer py-1 px-2 rounded ${path === active ? "bg-blue-100" : ""}`}
          onClick={() => onSelect(path)}
        >
          {path}
        </div>
      ))}
    </div>
  );
}
