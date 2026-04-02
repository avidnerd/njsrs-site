"use client";

import { useState } from "react";

export default function DonatePage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    amount: "",
    cardNumber: "",
    cvv: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Donation form submitted. In production, this would process the payment.");
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-primary-blue mb-8">Donate</h1>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-primary-blue mb-4">
            Our Mission
          </h2>
          <p className="text-gray-700">
            NJSRS provides a venue for high school students to present STEM research, compete for prizes, receive feedback, and learn from peers, especially given the suspension of JSHS this year.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-primary-blue mb-4">
            Our Sponsors
          </h2>
          {/* Sponsor logo grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="flex flex-col items-center gap-2 rounded-xl border-2 border-indigo-300 bg-gradient-to-b from-indigo-50 to-white p-4 shadow-sm min-h-[9rem]">
              <span className="text-xs font-bold uppercase tracking-wide text-indigo-600">Diamond</span>
              <img src="/mef_logo.png" alt="Millburn Education Foundation" className="max-h-16 w-full object-contain border border-indigo-100 rounded p-1" />
            </div>
            <div className="flex flex-col items-center gap-2 rounded-xl border-2 border-amber-300 bg-gradient-to-b from-amber-50 to-white p-4 shadow-sm min-h-[9rem]">
              <span className="text-xs font-bold uppercase tracking-wide text-amber-700">Gold</span>
              <img src="/beyond_young.jpeg" alt="Beyond Young Academy" className="max-h-16 w-full object-contain border border-amber-100 rounded p-1" />
            </div>
            <div className="flex flex-col items-center gap-2 rounded-xl border-2 border-gray-300 bg-gradient-to-b from-gray-50 to-white p-4 shadow-sm min-h-[9rem]">
              <span className="text-xs font-bold uppercase tracking-wide text-gray-500">Silver</span>
              <img src="/aops.png" alt="Art of Problem Solving" className="max-h-16 w-full object-contain border border-gray-200 rounded p-1" />
            </div>
            <div className="flex flex-col items-center gap-2 rounded-xl border-2 border-gray-300 bg-gradient-to-b from-gray-50 to-white p-4 shadow-sm min-h-[9rem]">
              <span className="text-xs font-bold uppercase tracking-wide text-gray-500">Silver</span>
              <img src="/clemenzas.avif" alt="Clemenza's Brick Oven Pizza" className="max-h-16 w-full object-contain border border-gray-200 rounded p-1" />
            </div>
          </div>

          {/* Special Awards Donors */}
          <div className="border-t border-gray-200 pt-6 mb-6">
            <h3 className="text-lg font-bold text-gray-800 text-center mb-4">Special Awards Donors</h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-1 max-w-lg mx-auto text-center">
              {[
                "Millburn Ed Foundation", "The Kapur Family",
                "The Farashuddin Family", "The Illango Mahjan Family",
                "The Lu Family", "The Cook Family",
                "The Ravi Family", "The Kolodkin Family",
                "The Li Family", "Allison Ruggles",
              ].map((name) => (
                <p key={name} className="text-gray-700 py-0.5 text-sm">{name}</p>
              ))}
            </div>
          </div>
          <p className="text-gray-700 mb-4">
            NJSRS relies on support from universities, STEM companies, community organizations, and individual donors. Sponsors help cover costs including venue, judging materials, and student awards. In return, sponsors receive recognition on our website, event signage, and communications.
          </p>
          <p className="text-gray-700">
            Interested organizations can contact{" "}
            <a href="mailto:fairdirector@njsrs.org" className="text-primary-blue hover:underline">
              fairdirector@njsrs.org
            </a>{" "}
            to discuss sponsorship levels.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-primary-blue mb-4">
            Donate
          </h2>
          <p className="text-gray-700 mb-4">
          If you would be interested in making a donation to our fair, please contact the fair director at fairdirector@njsrs.org.
          </p>
          <p className="text-gray-700 mb-6">
          Donations directly fund the symposium, covering logistics, printing, display materials, and awards. Even modest gifts help open more judging slots, invite more schools, and ensure the event&apos;s sustainability. 
          If you would like to fund a special award in honor of a friend, family member, colleague, or business, please mention that in your request. 
          </p>
        </section>

        <section className="mb-12 pt-8 border-t border-gray-200">
          <h2 className="text-2xl font-semibold text-primary-blue mb-3">
            Sponsorship Levels
          </h2>
          <p className="text-gray-700 mb-8 max-w-2xl">
            Donors at our sponsorship levels will be featured on event T-shirts, signage, and our website. Choose the tier that fits your organization and receive recognition that helps inspire the next generation of scientists. 
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="relative overflow-hidden rounded-xl border-2 border-gray-300 bg-gradient-to-b from-gray-50 to-gray-100 p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-gray-300 to-gray-400 rounded-bl-full opacity-80" />
              <div className="relative">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center mb-4 shadow-inner">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L9 8H3l5 4-2 6 6-4 6 4-2-6 5-4h-6L12 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-1">Silver</h3>
                <p className="text-2xl font-extrabold text-gray-700 mb-3">$100 – $249</p>
                <p className="text-sm text-gray-600">Recognition on the NJSRS website.</p>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-xl border-2 border-amber-400 bg-gradient-to-b from-amber-50 to-amber-100 p-6 shadow-lg hover:shadow-xl transition-shadow ring-2 ring-amber-300/50">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-300 to-amber-500 rounded-bl-full opacity-80" />
              <div className="relative">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mb-4 shadow-inner">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l2.4 7.2h7.6l-6 4.6 2.3 7-6.3-4.5-6.3 4.5 2.3-7-6-4.6h7.6L12 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-amber-900 mb-1">Gold</h3>
                <p className="text-2xl font-extrabold text-amber-800 mb-3">$250 – $499</p>
                <p className="text-sm text-amber-900/80">Recognition on the NJSRS website and event signage.</p>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-xl border-2 border-slate-400 bg-gradient-to-b from-slate-50 to-slate-200 p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-slate-300 to-slate-500 rounded-bl-full opacity-80" />
              <div className="relative">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center mb-4 shadow-inner">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l2.4 7.2h7.6l-6 4.6 2.3 7-6.3-4.5-6.3 4.5 2.3-7-6-4.6h7.6L12 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-1">Platinum</h3>
                <p className="text-2xl font-extrabold text-slate-700 mb-3">$500 – $749</p>
                <p className="text-sm text-slate-700/90">Recognition on the NJSRS website, event signage, and event merchandise (t-shirts).</p>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-xl border-2 border-indigo-400 bg-gradient-to-b from-indigo-50 via-purple-50 to-indigo-100 p-6 shadow-lg hover:shadow-xl transition-shadow ring-2 ring-indigo-300/50">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-300 via-purple-300 to-indigo-400 rounded-bl-full opacity-80" />
              <div className="relative">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-400 via-purple-500 to-indigo-600 flex items-center justify-center mb-4 shadow-inner">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l10 10-10 10L2 12 12 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-indigo-900 mb-1">Diamond</h3>
                <p className="text-2xl font-extrabold text-indigo-800 mb-3">$750+</p>
                <p className="text-sm text-indigo-900/80">Recognition on the website, signage, and merchandise, plus a special acknowledgment during the awards ceremony.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
