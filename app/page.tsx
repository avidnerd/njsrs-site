import Link from "next/link";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Research Competitions in New Jersey | NJSRS - New Jersey Science Research Symposium',
  description: 'Looking for research competitions in New Jersey? The New Jersey Science Research Symposium (NJSRS) is a premier research competition in New Jersey for high school students. Present your STEM research, compete for prizes, and receive feedback from STEM professionals. Hosted at Millburn High School.',
  keywords: ['research competitions in New Jersey', 'research competitions in new jersey', 'New Jersey Science Research Symposium', 'NJSRS', 'research competitions New Jersey', 'science fair New Jersey', 'STEM competition New Jersey', 'high school science competition', 'New Jersey', 'science research competition', 'student research competition', 'research competitions for high school students', 'science competitions in New Jersey', 'NJ science fair', 'New Jersey STEM competition', 'high school research symposium', 'Millburn High School'],
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
            "name": "What research competitions in New Jersey are available for high school students?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "The New Jersey Science Research Symposium (NJSRS) is one of the premier research competitions in New Jersey for high school students. It brings together students from across the state to present original STEM research projects and compete for prizes."
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
              "text": "For NJSRS, qualifying projects include experimental research projects started after April 2025 in any STEM field (Science, Technology, Engineering, or Mathematics). Projects must follow the scientific method with background research, hypothesis, experiments, data analysis, and conclusions."
            }
          },
          {
            "@type": "Question",
            "name": "Where can I find research competitions in New Jersey?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "The New Jersey Science Research Symposium (NJSRS) is one of the leading research competitions in New Jersey. Hosted at Millburn High School, NJSRS is open to all high school students in New Jersey who have conducted experimental STEM research. Visit njsrs.org to learn more."
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
                Research Competitions in New Jersey: The New Jersey Science Research Symposium (NJSRS)
              </h1>
              <p className="text-lg md:text-xl mb-4 text-blue-100">
                The New Jersey Science Research Symposium (NJSRS) is a premier science research competition for high school students throughout New Jersey. Hosted at Millburn High School, this competition brings together students from across the state to present original STEM research projects and compete for awards.
              </p>
              <p className="text-lg md:text-xl mb-8 text-blue-100">
                NJSRS offers high school students the opportunity to showcase their experimental research, receive feedback from STEM professionals, and gain valuable experience in scientific communication.
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
                NJSRS is a research competition for high school students in New Jersey who have conducted experimental STEM research within the past year. Competitors give an oral presentation in front of slides and are scored by STEM professionals.
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
                NJSRS is open to any high school student currently attending a high school in New Jersey. The competition welcomes students from all New Jersey high schools. Each student must have an adult sponsor (teacher, mentor, parent) in order to participate.
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

      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-primary-blue mb-6 text-center">
            Research Competitions in New Jersey
          </h2>
          <div className="prose max-w-none text-gray-700 space-y-4">
            <p className="text-lg">
              The New Jersey Science Research Symposium (NJSRS) is one of the premier science research competitions for high school students in New Jersey. Whether you're a student, parent, or educator, NJSRS provides an excellent platform for students to showcase their experimental STEM research.
            </p>
            <p>
              NJSRS stands out as a comprehensive event that brings together students from high schools across the state. This competition offers:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Oral presentations judged by STEM professionals</li>
              <li>Category-based competition with final round presentations</li>
              <li>Poster sessions for all participants</li>
              <li>Detailed feedback on research methodology and findings</li>
              <li>Opportunities to network with other student researchers</li>
              <li>Awards and recognition for outstanding projects</li>
            </ul>
            <p>
              <strong>Why choose NJSRS?</strong> NJSRS is specifically designed for high school students who have conducted experimental research. The competition is hosted at Millburn High School and welcomes students from all New Jersey high schools. NJSRS provides both competitive opportunities and educational value, making it an excellent choice for students interested in science research competitions.
            </p>
            <p>
              To participate, students must have a Science Research Advisor (SRA) from their school registered first. The entry fee is $30 per student, and registration is open to all high school students in New Jersey who have conducted experimental STEM research within the past year.
            </p>
          </div>
        </div>
      </section>
    </div>
    </>
  );
}
