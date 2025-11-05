export default function Console({ logs }: { logs: string[] }) {
  return (
    <div className="bg-black text-green-400 font-mono p-3 rounded-md h-48 overflow-y-auto">
      {logs.map((line, i) => (
        <div key={i}>{line}</div>
      ))}
    </div>
  );
}
