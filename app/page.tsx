import Link from "next/link";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'New Jersey High School Research Competitions | NJSRS - New Jersey Science Research Symposium',
  description: 'The New Jersey Science Research Symposium (NJSRS) is one of the premier New Jersey high school research competitions. High school students present original STEM research projects, compete for awards, and receive feedback from STEM professionals. Hosted at Millburn High School.',
  keywords: ['New Jersey high school research competitions', 'new jersey high school research competitions','New Jersey high school research competitions', 'NJSRS', 'New Jersey Science Research Symposium', 'high school research competitions New Jersey', 'NJ high school science competitions', 'research competitions for high school students New Jersey', 'New Jersey STEM competitions high school', 'science research competitions New Jersey', 'high school science fair New Jersey', 'Millburn High School'],
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
            "name": "What New Jersey high school research competitions are available?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "New Jersey offers several high school research competitions including the New Jersey Science Research Symposium (NJSRS), NJ Regional Science Bowl, NJAS Junior Academy, Northern NJ Junior Science and Humanities Symposium (JSHS) at Rutgers, Terra North Jersey STEM Fair, and New Jersey State Science Day. NJSRS is one of the premier New Jersey high school research competitions for students to present original STEM research."
            }
          },
          {
            "@type": "Question",
            "name": "How do I participate in New Jersey high school research competitions?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "To participate in NJSRS, one of the leading New Jersey high school research competitions, you need a Science Research Advisor (SRA) from your school registered first. Then students can register online, select their school and SRA, and complete the registration form. The entry fee is $30 per student."
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
            "name": "What types of projects qualify for New Jersey high school research competitions?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "For NJSRS and other New Jersey high school research competitions, qualifying projects include experimental research projects started after April 2025 in any STEM field (Science, Technology, Engineering, or Mathematics). Projects must follow the scientific method with background research, hypothesis, experiments, data analysis, and conclusions."
            }
          },
          {
            "@type": "Question",
            "name": "Where are New Jersey high school research competitions held?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "The New Jersey Science Research Symposium (NJSRS) is hosted at Millburn High School in Millburn, New Jersey. Other New Jersey high school research competitions are held at various locations including Rutgers University (Northern NJ JSHS), Princeton Plasma Physics Laboratory (NJ Regional Science Bowl), and other venues across the state."
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
                NJSRS is a premier science research competition for high school students throughout New Jersey. Hosted at Millburn High School, this competition is designed to provide students a platform to share, defend, and advance their research. 
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
                NJSRS is one of the leading New Jersey high school research competitions. High school students who have conducted experimental STEM research within the past year can participate. Competitors give an oral presentation in front of slides and are scored by STEM professionals.
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
            New Jersey High School Research Competitions
          </h2>
          <div className="prose max-w-none text-gray-700 space-y-4">
            <p className="text-lg">
              The New Jersey Science Research Symposium (NJSRS) is one of the premier New Jersey high school research competitions. Alongside other notable competitions like the NJ Regional Science Bowl, NJAS Junior Academy, and Northern NJ Junior Science and Humanities Symposium (JSHS), NJSRS offers high school students in New Jersey the opportunity to present original STEM research and compete for recognition and awards.
            </p>
            <p>
              <strong>About NJSRS:</strong> As one of the leading New Jersey high school research competitions, NJSRS stands out for its comprehensive format that includes:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Oral presentations judged by STEM professionals</li>
              <li>Category-based competition with final round presentations</li>
              <li>Poster sessions for all participants</li>
              <li>Detailed feedback on research methodology and findings</li>
              <li>Opportunities to network with other student researchers from across New Jersey</li>
              <li>Awards and recognition for outstanding projects</li>
            </ul>
            <p>
              <strong>Eligibility:</strong> NJSRS is open to all high school students in New Jersey (grades 9-12) who have conducted experimental STEM research within the past year. The competition welcomes students from public, private, and charter schools across the state.
            </p>
            <p>
              <strong>How to Participate:</strong> To participate in this New Jersey high school research competition, students must have a Science Research Advisor (SRA) from their school registered first. The entry fee is $30 per student. Registration is open to all high school students in New Jersey who have conducted experimental STEM research.
            </p>
            <p>
              <strong>Location:</strong> NJSRS is hosted at Millburn High School in Millburn, New Jersey, making it easily accessible to students throughout the state.
            </p>
          </div>
        </div>
      </section>
    </div>
    </>
  );
}
