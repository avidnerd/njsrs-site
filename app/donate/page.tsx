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
    // Payment processing would go here
    alert("Donation form submitted. In production, this would process the payment.");
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-primary-blue mb-8">Donate</h1>

        {/* Our Mission */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-primary-blue mb-4">
            Our Mission
          </h2>
          <p className="text-gray-700">
            NJSRS provides a venue for high school students to present STEM research, compete for prizes, receive feedback, and learn from peers, especially given the suspension of regional science fairs like JSHS.
          </p>
        </section>

        {/* Our Sponsors */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-primary-blue mb-4">
            Our Sponsors
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-200 h-32 rounded flex items-center justify-center">
              <span className="text-gray-500">Sponsor 1</span>
            </div>
            <div className="bg-gray-200 h-32 rounded flex items-center justify-center">
              <span className="text-gray-500">Sponsor 2</span>
            </div>
            <div className="bg-gray-200 h-32 rounded flex items-center justify-center">
              <span className="text-gray-500">Sponsor 3</span>
            </div>
          </div>
          <p className="text-gray-700 mb-4">
            NJSRS relies on support from universities, STEM companies, community organizations, and individual donors. Sponsors help cover costs including venue, judging materials, and student recognition. In return, sponsors receive recognition on our website, event signage, and communications.
          </p>
          <p className="text-gray-700">
            Interested organizations can contact{" "}
            <a href="mailto:faircommittee@njsrs.org" className="text-primary-blue hover:underline">
              faircommittee@njsrs.org
            </a>{" "}
            to discuss sponsorship levels.
          </p>
        </section>

        {/* Donate Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-primary-blue mb-4">
            Donate
          </h2>
          <p className="text-gray-700 mb-4">
            Donations directly fund the symposium, covering logistics, printing, display materials, and awards. Even modest gifts help open more judging slots, invite more schools, and ensure the event&apos;s sustainability.
          </p>
          <p className="text-gray-700 mb-6">
            Use the form below to make a contribution, or contact us for information about institutional or larger gifts.
          </p>

          {/* Donation Form */}
          <div className="bg-blue-50 border-2 border-primary-blue rounded-lg p-6">
            <h3 className="text-xl font-semibold text-primary-blue mb-6">Donation</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium mb-1">
                    First Name
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium mb-1">
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="amount" className="block text-sm font-medium mb-1">
                  Amount
                </label>
                <input
                  id="amount"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="cardNumber" className="block text-sm font-medium mb-1">
                    Card Number/Other Payment Method
                  </label>
                  <input
                    id="cardNumber"
                    type="text"
                    value={formData.cardNumber}
                    onChange={(e) => setFormData({ ...formData, cardNumber: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                  />
                </div>
                <div className="flex items-end">
                  <div className="flex-1">
                    <label htmlFor="cvv" className="block text-sm font-medium mb-1">
                      CVV
                    </label>
                    <input
                      id="cvv"
                      type="text"
                      value={formData.cvv}
                      onChange={(e) => setFormData({ ...formData, cvv: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                    />
                  </div>
                  <button
                    type="submit"
                    className="ml-4 bg-yellow-400 text-gray-900 px-6 py-2 rounded-md hover:bg-yellow-500 font-semibold"
                  >
                    CONFIRM DONATION
                  </button>
                </div>
              </div>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
