import Image from "next/image";
import Link from "next/link";

const Landing = () => {
  return (
    <div className="min-h-screen bg-brand-light text-slate-900">
      <nav className="flex justify-between items-center p-6 max-w-7xl mx-auto">
        <Link
          href={"/"}
          className="text-2xl font-bold text-blue-400 underline decoration-brand hover:cursor-pointer"
        >
          PhotoBooth
        </Link>
      </nav>

      <main className="max-w-7xl mx-auto px-6 pt-20 pb-32 text-center">
        <h2 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6">
          Welcome to Kuma PhotoBooth
        </h2>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-10">
          Click start to begin with your journey
        </p>

        <div className="flex flex-col sm:flex-row justify-center">
          <Link
            href={"/gridLayout"}
            className="bg-blue-300 text-white text-3xl px-8 py-4 rounded-xl font-semibold shadow-lg shadow-brand/20 hover:scale-105 transition hover:cursor-pointer"
          >
            Start
          </Link>
        </div>

        <div className="mt-20 border-8 border-blue-300 rounded-3xl shadow-2xl overflow-hidden bg-slate-200 aspect-video flex items-center justify-center relative">
          <Image
            src={"/images-2.png"}
            alt="preview"
            fill
            // className="object-cover"
          ></Image>
        </div>
      </main>
    </div>
  );
};

export default Landing;
