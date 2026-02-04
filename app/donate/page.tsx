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
    <>
      <Head>
        <title>Donate to NJSRS | Support Science Research Education</title>
        <meta name="description" content="Support the New Jersey Science Research Symposium through donations. Help fund event costs, judging, student awards, and expand opportunities for New Jersey student researchers." />
        <meta name="keywords" content="donate to science fair, NJSRS donation, support science education, science fair sponsorship, STEM education funding" />
        <link rel="canonical" href="https://njsrs.org/donate" />
      </Head>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white h-32 rounded border border-gray-200 flex items-center justify-center p-4">
              <img 
                src="/mef_logo.png" 
                alt="Millburn Education Foundation" 
                className="max-h-full max-w-full object-contain"
              />
            </div>
            <div className="bg-gray-200 h-32 rounded flex items-center justify-center">
              <span className="text-gray-500">Coming Soon</span>
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
      </div>
    </div>
  );
}
