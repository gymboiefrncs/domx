export const NotFoundPage = () => {
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-slate-50 px-6 text-center md:px-8">
      <div className="w-full max-w-md md:max-w-xl xl:max-w-2xl">
        <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 text-orange-600 md:h-20 md:w-20">
          <span className="text-2xl font-bold">!</span>
        </div>

        <h1 className="mb-10 text-6xl font-black tracking-tighter text-text-disabled md:mb-12 md:text-7xl lg:text-8xl">
          404
        </h1>

        <div className="-mt-8 relative">
          <h2 className="mb-4 text-base font-extrabold text-text md:text-xl lg:text-2xl">
            You've reached the end of the internet.
          </h2>
          <p className="mb-8 text-sm leading-relaxed text-text-muted md:text-base">
            Our developers are currently arguing over whose fault this is. It's
            probably Dave's
          </p>
        </div>
      </div>
    </div>
  );
};
