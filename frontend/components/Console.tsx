export default function Console({ logs }: { logs: string[] }) {
  return (
    <div className="bg-black text-green-400 font-mono p-3 rounded-md flex-1 overflow-y-auto min-h-0">
      {logs.map((line, i) => (
        <div key={i}>{line}</div>
      ))}
    </div>
  );
}
