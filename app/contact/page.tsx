"use client";

import Link from "next/link";
import { Mail, Phone, MapPin, Send, ReceiptText } from "lucide-react";

export default function ContactPage() {
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

      <main className="w-full max-w-5xl flex flex-col items-center space-y-12 pb-20">
        <div className="text-center space-y-4">
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight">
            Get in <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-pink-200">Touch</span>
          </h1>
          <p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto">
            Have questions, feedback, or need support? We'd love to hear from you.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 w-full mt-12">
          {/* Contact Info Cards */}
          <div className="flex flex-col gap-6">
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 flex items-start gap-6 shadow-xl border border-white/20 hover:scale-[1.02] transition-transform">
              <div className="bg-white/20 p-4 rounded-full">
                <Mail size={32} className="text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-2">Email Us</h3>
                <p className="text-white/80 text-lg mb-1">For general inquiries and support</p>
                <a href="mailto:support@photobooth.com" className="text-xl font-semibold hover:text-pink-200 transition-colors">
                  support@photobooth.com
                </a>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 flex items-start gap-6 shadow-xl border border-white/20 hover:scale-[1.02] transition-transform">
              <div className="bg-white/20 p-4 rounded-full">
                <Phone size={32} className="text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-2">Call Us</h3>
                <p className="text-white/80 text-lg mb-1">Mon-Fri from 8am to 5pm</p>
                <a href="tel:+1234567890" className="text-xl font-semibold hover:text-pink-200 transition-colors">
                  +1 (234) 567-890
                </a>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 flex items-start gap-6 shadow-xl border border-white/20 hover:scale-[1.02] transition-transform">
              <div className="bg-white/20 p-4 rounded-full">
                <MapPin size={32} className="text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-2">Visit Us</h3>
                <p className="text-white/80 text-lg mb-1">Our main headquarters</p>
                <p className="text-xl font-semibold">
                  123 Capture Lane<br />
                  Creativity City, CC 90210
                </p>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-10 shadow-2xl border border-white/20">
            <h2 className="text-3xl font-bold mb-8">Send us a message</h2>
            <form className="space-y-6 flex flex-col" onSubmit={(e) => e.preventDefault()}>
              <div className="flex flex-col gap-2">
                <label htmlFor="name" className="text-lg font-medium">Your Name</label>
                <input
                  type="text"
                  id="name"
                  placeholder="John Doe"
                  className="px-5 py-4 rounded-xl bg-white/20 border border-white/30 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="email" className="text-lg font-medium">Email Address</label>
                <input
                  type="email"
                  id="email"
                  placeholder="john@example.com"
                  className="px-5 py-4 rounded-xl bg-white/20 border border-white/30 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="message" className="text-lg font-medium">Message</label>
                <textarea
                  id="message"
                  rows={5}
                  placeholder="How can we help you today?"
                  className="px-5 py-4 rounded-xl bg-white/20 border border-white/30 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all resize-none"
                ></textarea>
              </div>

              <button className="mt-4 cursor-pointer px-8 py-4 bg-white text-purple-600 rounded-xl font-bold text-xl shadow-xl hover:scale-105 transition-transform flex items-center justify-center gap-3">
                <Send size={24} />
                Send Message
              </button>
            </form>
          </div>
        </div>

        {/* Refund Policy Section */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-10 w-full shadow-2xl border border-white/20 mt-16">
          <div className="flex flex-col lg:flex-row gap-12">
            <div className="flex-1 space-y-6">
              <h2 className="text-3xl font-bold flex items-center gap-3">
                <ReceiptText size={32} />
                Refund Policy
              </h2>
              <div className="space-y-4 text-white/80 text-lg leading-relaxed">
                <p>
                  At PhotoBooth, we strive for 100% customer satisfaction. If you are not happy with your purchase, we are here to help.
                </p>
                <ul className="list-disc list-inside space-y-3">
                  <li>Refunds are processed within 5-7 business days to your original payment method.</li>
                  <li>Requests must be made within 24 hours of your purchase.</li>
                  <li>Duplicate payments are automatically eligible for a full refund.</li>
                  <li>Technical issues during capture or download are prioritized for immediate resolution.</li>
                </ul>
                <div className="bg-white/5 p-4 rounded-xl border border-white/10 mt-6">
                  <p className="text-sm italic text-white/70">
                    <strong>Note:</strong> Please ensure you provide the correct Order ID from your confirmation email for faster processing.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 bg-white/5 rounded-2xl p-8 border border-white/10 shadow-inner">
              <h3 className="text-2xl font-bold mb-6">
                Refund Request Form
              </h3>
              <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-white/90">Order ID</label>
                    <input 
                      type="text" 
                      placeholder="#PB-12345" 
                      className="px-4 py-3 rounded-xl bg-white/10 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all" 
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-white/90">Transaction Date</label>
                    <input 
                      type="date" 
                      className="px-4 py-3 rounded-xl bg-white/10 border border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-white/50 transition-all" 
                    />
                  </div>
                </div>
                
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-white/90">Reason for Refund</label>
                  <select className="px-4 py-3 rounded-xl bg-white/10 border border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-white/50 transition-all cursor-pointer">
                    <option className="bg-purple-800 text-white">Select a reason</option>
                    <option className="bg-purple-800 text-white">Duplicate Payment</option>
                    <option className="bg-purple-800 text-white">Technical Issue during Capture</option>
                    <option className="bg-purple-800 text-white">Download Link Failed</option>
                    <option className="bg-purple-800 text-white">Accidental Purchase</option>
                    <option className="bg-purple-800 text-white">Other</option>
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-white/90">Additional Details</label>
                  <textarea 
                    rows={4} 
                    placeholder="Tell us more about what happened..." 
                    className="px-4 py-3 rounded-xl bg-white/10 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all resize-none"
                  ></textarea>
                </div>

                <button className="w-full mt-2 py-4 cursor-pointer bg-white text-purple-600 rounded-xl font-bold text-lg shadow-xl hover:scale-[1.02] active:scale-95 transition-all">
                  Submit Refund Request
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
