import Link from "next/link";
import { Camera, Sparkles, Heart } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-r from-purple-500 via-pink-400 to-purple-600 text-white flex flex-col items-center px-4 py-6">
      <nav className="w-full max-w-7xl flex justify-between items-center mb-12 p-6">
        <Link href="/" className="text-2xl font-bold cursor-pointer">
          PhotoBooth
        </Link>
        <div className="flex items-center gap-6">
          <Link href="/about" className="text-lg font-medium text-white hover:text-white/80 transition-colors">
            About Us
          </Link>
          <Link href="/contact" className="text-lg font-medium text-white hover:text-white/80 transition-colors">
            Contact Us
          </Link>
        </div>
      </nav>

      <main className="w-full max-w-4xl flex flex-col items-center text-center space-y-12 pb-20">
        <div className="space-y-6">
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight">
            Capturing Memories, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-pink-200">
              One Snap at a Time
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto">
            PhotoBooth is your digital companion for creating, customizing, and sharing unforgettable moments with friends and family.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full mt-12">
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 flex flex-col items-center shadow-xl border border-white/20 hover:scale-105 transition-transform">
            <div className="bg-white/20 p-4 rounded-full mb-6">
              <Camera size={40} className="text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-3">Instant Capture</h3>
            <p className="text-white/80">
              High-quality photos taken instantly. Perfect for events, parties, or just a fun day out.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 flex flex-col items-center shadow-xl border border-white/20 hover:scale-105 transition-transform">
            <div className="bg-white/20 p-4 rounded-full mb-6">
              <Sparkles size={40} className="text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-3">Beautiful Layouts</h3>
            <p className="text-white/80">
              Choose from a variety of stunning templates and layouts to make your photos pop.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 flex flex-col items-center shadow-xl border border-white/20 hover:scale-105 transition-transform">
            <div className="bg-white/20 p-4 rounded-full mb-6">
              <Heart size={40} className="text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-3">Made with Love</h3>
            <p className="text-white/80">
              Designed to bring joy and capture the essence of your most cherished memories.
            </p>
          </div>
        </div>

        <div className="bg-white/20 backdrop-blur-lg rounded-3xl p-10 w-full mt-16 text-left shadow-2xl border border-white/20">
          <h2 className="text-3xl font-bold mb-6">Our Story</h2>
          <div className="space-y-4 text-white/90 text-lg">
            <p>
              It all started with a simple idea: everyone deserves a beautiful way to capture memories without the hassle of professional setups or expensive equipment.
            </p>
            <p>
              Our team built PhotoBooth to bridge the gap between high-end studio photography and everyday fun. By providing customizable templates, easy-to-use digital tools, and a seamless checkout experience, we ensure that you can focus entirely on what matters most—making the memory.
            </p>
            <p>
              Whether you are creating a simple GIF with friends, setting up a personalized grid layout, or just snapping some cool filtered shots, we've got you covered.
            </p>
          </div>
        </div>

        <div className="mt-16">
          <Link href="/">
            <button className="px-10 cursor-pointer py-4 bg-white text-purple-600 rounded-full font-bold text-xl shadow-2xl hover:scale-105 transition-transform">
              Start Snapping Now
            </button>
          </Link>
        </div>
      </main>
    </div>
  );
}
