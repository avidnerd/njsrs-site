import Link from "next/link";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'New Jersey Science Research Symposium | NJSRS - High School STEM Competition',
  description: 'The New Jersey Science Research Symposium (NJSRS) is a research competition for high school students across New Jersey. Present your STEM research, compete for prizes, and receive feedback from STEM professionals. Hosted at Millburn High School.',
  keywords: ['New Jersey Science Research Symposium', 'NJSRS', 'research competitions New Jersey', 'science fair New Jersey', 'STEM competition New Jersey', 'high school science competition', 'New Jersey', 'science research competition', 'student research competition', 'research competitions for high school students', 'science competitions in New Jersey', 'NJ science fair', 'New Jersey STEM competition', 'high school research symposium', 'Millburn High School'],
  openGraph: {
    title: 'New Jersey Science Research Symposium | NJSRS',
    description: 'A research competition that brings together high school scientists from across New Jersey to present original STEM research projects.',
    url: 'https://njsrs.org',
    siteName: 'NJSRS',
    type: 'website',
  },
  alternates: {
    canonical: 'https://njsrs.org',
  },
};

export default function HomePage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "EducationalOrganization",
        "name": "New Jersey Science Research Symposium",
        "alternateName": "NJSRS",
        "url": "https://njsrs.org",
        "logo": "https://njsrs.org/njsrs-icon-only.png",
        "description": "A research competition that brings together high school scientists from across New Jersey to present original STEM research projects.",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "462 Millburn Ave",
          "addressLocality": "Millburn",
          "addressRegion": "NJ",
          "postalCode": "07041",
          "addressCountry": "US"
        },
        "contactPoint": {
          "@type": "ContactPoint",
          "email": "fairdirector@njsrs.org",
          "contactType": "Fair Director"
        },
        "areaServed": {
          "@type": "State",
          "name": "New Jersey"
        }
      },
      {
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "What research competitions are available in New Jersey?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "The New Jersey Science Research Symposium (NJSRS) is a premier research competition for high school students in New Jersey. It brings together students from across the state to present original STEM research projects and compete for prizes."
            }
          },
          {
            "@type": "Question",
            "name": "How do I participate in research competitions in New Jersey?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "To participate in NJSRS, you need a Science Research Advisor (SRA) from your school registered first. Then students can register online, select their school and SRA, and complete the registration form. The entry fee is $30 per student."
            }
          },
          {
            "@type": "Question",
            "name": "Where is the New Jersey Science Research Symposium held?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "The New Jersey Science Research Symposium is hosted at Millburn High School, located at 462 Millburn Ave., Millburn, NJ 07041."
            }
          },
          {
            "@type": "Question",
            "name": "What types of projects qualify for research competitions in New Jersey?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Qualifying projects include experimental research projects started after April 2025 in any STEM field (Science, Technology, Engineering, or Mathematics). Projects must follow the scientific method with background research, hypothesis, experiments, data analysis, and conclusions."
            }
          }
        ]
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div>
      <section className="bg-primary-blue text-white py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-16 lg:gap-24 xl:gap-28 items-center">
            <div className="pr-0 lg:pr-8">
              <h1 className="text-xl md:text-3xl lg:text-4xl font-bold mb-6 leading-tight">
                The New Jersey Science Research Symposium (NJSRS) is a research competition that brings together high school scientists from across New Jersey to present original STEM research projects.
              </h1>
              <p className="text-lg md:text-xl mb-4 text-blue-100">
                Looking for research competitions in New Jersey? NJSRS is the premier science research competition for high school students throughout New Jersey. Hosted at Millburn High School, this invitational is designed to provide students a platform to share, defend, and advance their research.
              </p>
              <p className="text-lg md:text-xl mb-8 text-blue-100">
                If you're a high school student in New Jersey interested in research competitions, NJSRS offers the opportunity to present your experimental STEM research, receive feedback from STEM professionals, and compete for awards.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/register/student"
                  className="bg-primary-green text-white px-6 py-3 rounded-md hover:bg-primary-darkGreen font-semibold text-center transition-colors flex items-center justify-center"
                >
                  COMPETE
                </Link>
                <Link
                  href="/register/judge"
                  className="bg-white text-primary-green px-6 py-3 rounded-md hover:bg-gray-100 font-semibold text-center transition-colors"
                >
                  ARE YOU A QUALIFIED SCIENTIST OR ENGINEER? BECOME A JUDGE!
                </Link>
              </div>
            </div>
            <div className="hidden lg:block pl-0 lg:pl-8">
              <div className="relative rounded-lg overflow-hidden h-96">
                <img 
                  src="/Laboratory-Equipment.jpg" 
                  alt="Laboratory equipment for science research at New Jersey Science Research Symposium" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <Link href="/competition" className="bg-white rounded-lg shadow-md p-8 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="mb-8 flex justify-center">
                <img 
                  src="/scientist.png" 
                  alt="Scientist presenting research at NJSRS competition" 
                  className="h-24 w-auto"
                />
              </div>
              <h2 className="text-2xl font-bold text-primary-blue mb-4 text-center">
                The Competition
              </h2>
              <p className="text-gray-600">
                NJSRS is one of the leading research competitions in New Jersey for high school students who have conducted experimental STEM research within the past year. Competitors give an oral presentation in front of slides and are scored by STEM professionals.
              </p>
            </Link>

            <div className="bg-white rounded-lg shadow-md p-8">
              <div className="mb-8 flex justify-center">
                <img 
                  src="/Envelope_with_Letter_PNG_Clip_Art.png" 
                  alt="How to participate in New Jersey Science Research Symposium" 
                  className="h-24 w-auto"
                />
              </div>
              <h2 className="text-2xl font-bold text-primary-blue mb-4 text-center">
                How to Participate
              </h2>
              <p className="text-gray-600">
                NJSRS is open to any high school student currently attending a high school in New Jersey. This research competition welcomes students from all New Jersey high schools. Each student must have an adult sponsor (teacher, mentor, parent) in order to participate.
              </p>
            </div>

            <Link href="/donate" className="bg-white rounded-lg shadow-md p-8 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="mb-8 flex justify-center">
                <img 
                  src="/donate.png" 
                  alt="Donate to support New Jersey Science Research Symposium" 
                  className="h-24 w-auto"
                />
              </div>
              <h2 className="text-2xl font-bold text-primary-blue mb-4 text-center">
                Donate
              </h2>
              <p className="text-gray-600">
                Donations support event costs, judging, and student awards so that this fair can happen! All contributions go directly toward running the symposium and expanding opportunities for New Jersey student researchers.
              </p>
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-semibold text-primary-blue mb-6 text-center">
              Timeline & Deadlines
            </h2>
            <div className="w-full">
              <img 
                src="/fair_timeline.png" 
                alt="NJSRS competition timeline and registration deadlines for 2025-2026" 
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
    </>
  );
}
