export const Header = () => {
  return (
    <div className="flex items-center justify-between px-8 py-4 border-b border-black/20">
      <div className="flex flex-col">
        <h1 className="text-3xl font-bold custom-font">My Groups</h1>
        <p className="text-sm text-black/50">4 groups</p>
      </div>

      <button className="flex items-center justify-center w-9 h-9 rounded-full bg-black/20 text-white text-lg font-semibold transition">
        +
      </button>
    </div>
  );
};
