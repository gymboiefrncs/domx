export const NotFoundPage = () => {
  return (
    <div className="flex flex-col justify-center items-center h-screen bg-slate-50 px-6 text-center">
      <div className="max-w-md">
        <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-100 text-orange-600">
          <span className="text-2xl font-bold">!</span>
        </div>

        <h1 className="text-6xl font-black text-text-disabled tracking-tighter mb-12">
          404
        </h1>

        <div className="-mt-8 relative">
          <h2 className="text-md font-extrabold text-text mb-4">
            You've reached the end of the internet.
          </h2>
          <p className="text-text-muted text-xs leading-relaxed mb-8">
            Our developers are currently arguing over whose fault this is. It's
            probably Dave's
          </p>
        </div>
      </div>
    </div>
  );
};
