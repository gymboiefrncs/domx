export const HomePage = () => {
  return (
    <div className="flex flex-col space-y-6 py-4 px-8 overflow-y-auto flex-1 min-h-0">
      {Array.from({ length: 20 }, (_, i) => (
        <div key={i} className="shrink-0">
          <h3>Test Group</h3>
          <p className="text-sm text-black/60 font-bold">
            3 new posts • 7:23 PM
          </p>
        </div>
      ))}
    </div>
  );
};
