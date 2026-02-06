import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Research Competitions in New Jersey | NJSRS Competition Rules & Information',
  description: 'Learn about research competitions in New Jersey. The New Jersey Science Research Symposium (NJSRS) is one of the premier research competitions in New Jersey for high school students. Learn about competition format, rules, registration, and venue. Entry fee $30 per student.',
  keywords: ['new jersey high school research competitions','NJSRS competition', 'research competitions New Jersey', 'science fair rules', 'STEM competition format', 'student registration', 'science research competition', 'New Jersey science fair', 'research competitions for high school students', 'NJ science competition'],
  openGraph: {
    title: 'Competition Rules & Information | NJSRS',
    description: 'Learn about the NJSRS competition format, rules, and registration process.',
    url: 'https://njsrs.org/competition',
  },
  alternates: {
    canonical: 'https://njsrs.org/competition',
  },
};

export default function CompetitionPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Event",
    "name": "New Jersey Science Research Symposium",
    "description": "A research competition for high school students to present original STEM research projects",
    "startDate": "2025-04-01",
    "eventStatus": "https://schema.org/EventScheduled",
    "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
    "location": {
      "@type": "Place",
      "name": "Millburn High School",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "462 Millburn Ave",
        "addressLocality": "Millburn",
        "addressRegion": "NJ",
        "postalCode": "07041",
        "addressCountry": "US"
      }
    },
    "organizer": {
      "@type": "Organization",
      "name": "New Jersey Science Research Symposium",
      "url": "https://njsrs.org"
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-primary-blue mb-8">Competition</h1>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-primary-darkGreen mb-6">
            Timeline & Deadlines
          </h2>
          <div className="w-full">
            <img 
              src="/fair_timeline.png" 
              alt="NJSRS competition timeline and registration deadlines" 
              className="w-full h-auto"
            />
          </div>
        </section>

        <section className="mb-12">
          <div className="bg-primary-blue rounded-lg shadow-lg p-6 text-white hover:shadow-xl transition-shadow">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold mb-2 text-white">Competition Rules</h2>
                <p className="text-white">
                  Download the complete competition rules, guidelines, and policies document
                </p>
              </div>
              <a
                href="/2025-2026 New Jersey Science Research Symposium Core Rules 20260131.5 (1).pdf"
                download="NJSRS_Competition_Rules.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white text-primary-blue px-6 py-3 rounded-md hover:bg-gray-100 font-semibold transition-colors whitespace-nowrap"
              >
                View Competition Rules
              </a>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-primary-darkGreen mb-6">
            Event Day Schedule
          </h2>
          <div className="relative">
            <div className="absolute left-4 md:left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary-blue via-primary-green to-primary-blue"></div>
            <div className="space-y-6">
              <div className="relative pl-12 md:pl-20">
                <div className="absolute left-2 md:left-6 w-4 h-4 bg-primary-blue rounded-full border-4 border-white shadow-lg"></div>
                <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-primary-blue hover:shadow-lg transition-shadow">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
                    <h3 className="text-lg font-bold text-primary-blue">Check-in and Set-up</h3>
                    <span className="text-sm font-semibold text-primary-darkGreen bg-primary-green/10 px-3 py-1 rounded-full">8:00 - 8:30 AM</span>
                  </div>
                  <p className="text-gray-600 text-sm">Participants and judges check in and set up their presentations</p>
                </div>
              </div>

              <div className="relative pl-12 md:pl-20">
                <div className="absolute left-2 md:left-6 w-4 h-4 bg-primary-green rounded-full border-4 border-white shadow-lg"></div>
                <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-primary-green hover:shadow-lg transition-shadow">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
                    <h3 className="text-lg font-bold text-primary-blue">Judge Orientation</h3>
                    <span className="text-sm font-semibold text-primary-darkGreen bg-primary-green/10 px-3 py-1 rounded-full">8:30 - 9:00 AM</span>
                  </div>
                  <p className="text-gray-600 text-sm">Judges receive orientation and instructions for the competition</p>
                </div>
              </div>

              <div className="relative pl-12 md:pl-20">
                <div className="absolute left-2 md:left-6 w-4 h-4 bg-primary-blue rounded-full border-4 border-white shadow-lg"></div>
                <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-primary-blue hover:shadow-lg transition-shadow">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
                    <h3 className="text-lg font-bold text-primary-blue">Category Judging</h3>
                    <span className="text-sm font-semibold text-primary-darkGreen bg-primary-green/10 px-3 py-1 rounded-full">9:00 AM - 12:00 PM</span>
                  </div>
                  <p className="text-gray-600 text-sm">Students present their research in assigned categories in classrooms</p>
                </div>
              </div>

              <div className="relative pl-12 md:pl-20">
                <div className="absolute left-2 md:left-6 w-4 h-4 bg-primary-green rounded-full border-4 border-white shadow-lg"></div>
                <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-primary-green hover:shadow-lg transition-shadow">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
                    <h3 className="text-lg font-bold text-primary-blue">Lunch</h3>
                    <span className="text-sm font-semibold text-primary-darkGreen bg-primary-green/10 px-3 py-1 rounded-full">12:00 - 1:00 PM</span>
                  </div>
                  <p className="text-gray-600 text-sm">Lunch break for students and judges (Lunch provided for judges)</p>
                </div>
              </div>

              <div className="relative pl-12 md:pl-20">
                <div className="absolute left-2 md:left-6 w-4 h-4 bg-primary-blue rounded-full border-4 border-white shadow-lg"></div>
                <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-primary-blue hover:shadow-lg transition-shadow">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
                    <h3 className="text-lg font-bold text-primary-blue">Poster Session</h3>
                    <span className="text-sm font-semibold text-primary-darkGreen bg-primary-green/10 px-3 py-1 rounded-full">1:00 - 3:30 PM</span>
                  </div>
                  <p className="text-gray-600 text-sm">All participants present their research in poster format</p>
                </div>
              </div>

              <div className="relative pl-12 md:pl-20">
                <div className="absolute left-2 md:left-6 w-4 h-4 bg-primary-green rounded-full border-4 border-white shadow-lg"></div>
                <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-primary-green hover:shadow-lg transition-shadow">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
                    <h3 className="text-lg font-bold text-primary-blue">Finals for Category Winners</h3>
                    <span className="text-sm font-semibold text-primary-darkGreen bg-primary-green/10 px-3 py-1 rounded-full">3:30 - 6:00 PM</span>
                  </div>
                  <p className="text-gray-600 text-sm">Category winners present in the auditorium for Grand Prize consideration</p>
                </div>
              </div>

              <div className="relative pl-12 md:pl-20">
                <div className="absolute left-2 md:left-6 w-4 h-4 bg-primary-blue rounded-full border-4 border-white shadow-lg"></div>
                <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-primary-blue hover:shadow-lg transition-shadow">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
                    <h3 className="text-lg font-bold text-primary-blue">Final Deliberation</h3>
                    <span className="text-sm font-semibold text-primary-darkGreen bg-primary-green/10 px-3 py-1 rounded-full">6:00 - 7:00 PM</span>
                  </div>
                  <p className="text-gray-600 text-sm">Judges deliberate to determine winners of finals and special awards</p>
                </div>
              </div>

              <div className="relative pl-12 md:pl-20">
                <div className="absolute left-2 md:left-6 w-4 h-4 bg-primary-green rounded-full border-4 border-white shadow-lg"></div>
                <div className="bg-gradient-to-r from-primary-blue to-primary-green rounded-lg shadow-md p-6 border-l-4 border-primary-green hover:shadow-xl transition-shadow">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
                    <h3 className="text-lg font-bold text-white">Awards Ceremony and Closing Remarks</h3>
                    <span className="text-sm font-semibold text-white bg-white/20 px-3 py-1 rounded-full">7:00 - 8:30 PM</span>
                  </div>
                  <p className="text-white/90 text-sm">Celebration of winners and closing remarks</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-primary-darkGreen mb-4">
            How to Register
          </h2>
          <div className="prose max-w-none">
            <p className="text-gray-700 mb-4">
              Registration for NJSRS requires a <strong>Science Research Advisor (SRA)</strong> to be registered for each school before students can register.
            </p>

            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Science Research Advisor (SRA) Registration
              </h3>
              <p className="text-gray-700 mb-4">
                A faculty member at the student&apos;s school must register their school as a Science Research Advisor. <strong>Each school must have an SRA for students to enter.</strong>
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Students must have an SRA to enter</li>
                <li>The SRA must attend/chaperone student(s) from their school</li>
                <li>The SRA does not have to be a science teacher</li>
                <li>Any school personnel can serve as SRA:
                  <ul className="list-disc list-inside ml-6 mt-2">
                    <li>Teacher</li>
                    <li>Administrator</li>
                    <li>Other school staff member</li>
                  </ul>
                </li>
              </ul>
              <p className="text-gray-700 mb-4">
                <strong>The SRA registers first for each school.</strong> Once an SRA registers, students can register as students and when they choose their school and select the SRA from their school, the SRA will receive an email confirmation to validate their account and admit the student into their cohort.
              </p>
              <p className="text-gray-700">
                The SRA should be able to see the status of all the students&apos; projects through their dashboard.
              </p>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Student Registration
              </h3>
              <p className="text-gray-700 mb-4">
                After an SRA has registered for your school, students can register by:
              </p>
              <ol className="list-decimal list-inside text-gray-700 mb-4 space-y-2">
                <li>Selecting their school from the list</li>
                <li>Choosing the SRA from their school</li>
                <li>Completing the registration form</li>
              </ol>
              <p className="text-gray-700">
                Once registered, the SRA will receive an email notification and can approve the student&apos;s registration through their dashboard.
              </p>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Payment
              </h3>
              <p className="text-gray-700 mb-4">
                The entry fee is <strong>$30 per student</strong>.
              </p>
              <p className="text-gray-700 mb-4">
                <strong>Payment Process:</strong>
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>The entry fee for all of the students from a school will be collected by a teacher at that school. </li>
                <li>The teacher’s school will write a single purchase order (check) for all of the entry fees for the students participating from that school</li>
                <li>Mail the payment to: <strong>462 Millburn Ave., Millburn, NJ</strong></li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-primary-darkGreen mb-4">
            Qualifying Projects
          </h2>
          <div className="prose max-w-none">
            <p className="text-gray-700 mb-4">
              Qualifying projects include <strong>experimental research projects started after April of 2025.</strong>
            </p>
            <p className="text-gray-700 mb-4">
              An &apos;experimental research project&apos; is the implementation of the scientific method to answer a question or solve a problem. This involves doing background research on the question/problem, forming a hypothesis or proposed solution, designing and performing experiments to test the hypothesis/solution, analyzing the experimental data, and using the results to draw conclusions about the question or problem being investigated. In <strong>NJSRS</strong>, the research can be in any area of Science, Technology, Engineering, or Mathematics (STEM).
            </p>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-primary-darkGreen mb-4">
            Competition Format & Rules
          </h2>
          <p className="text-gray-700 mb-6">
            In NJSRS, every project is presented through a long-form oral presentation with slides and is judged in front of a panel of STEM professionals and an audience. The competition uses a two-stage format: morning category judging in classrooms and afternoon final round presentations for category winners. In addition, there will be an afternoon poster session for all entrants, offering them the opportunity to win special awards.
          </p>

          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Judged Oral Presentations (Category Round and Final Round)
            </h3>
            <p className="text-gray-700 mb-4">
              Students present in assigned categories (e.g., Biology, Chemistry, Mathematics & Computer Science), with each category in its own classroom. Every student gives a 10-minute presentation using slides, followed by a judge Q&A session and a brief audience Q&A session. Evaluation is based on clarity of explanation, quality of experimental design and analysis, understanding of the science, and ability to respond to questions.
              First place category winners deliver a second 10-minute slide presentation in the Millburn High School auditorium. These finalists will be eligible to win the Grand Prizes of NJSRS.
            </p>
          </div>

          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Final Round Presentations
            </h3>
            <p className="text-gray-700 mb-4">
              First place category winners deliver a second 10-minute slide presentation in the Millburn High School auditorium. In the final round, there is no audience Q&A. These finalists will be eligible to win the Grand Prizes of NJSRS.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Rules, Safety & Ethics
            </h3>
            <p className="text-gray-700 mb-4">
              All projects must follow ISEF safety rules and NJSRS&apos;s own rules on research integrity, attribution, and safe use of materials and equipment. For projects involving human participants, vertebrate animals, or potentially hazardous biological agents (PHBAs), please refer to the Core Rules of the Competition for more details. Students must accurately represent their own work, maintain proper citations, and may not fabricate or misreport data; serious violations lead to disqualification.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-primary-darkGreen mb-4">
            Venue
          </h2>
          <p className="text-gray-700 mb-4">
            The New Jersey Science Research Symposium is hosted at Millburn High School in Millburn, New Jersey.
          </p>
          <div className="w-full h-96 rounded-lg overflow-hidden shadow-md mb-4">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3023.5!2d-74.3!3d40.7!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c3a8b8b8b8b8b9%3A0x8b8b8b8b8b8b8b8b!2s462%20Millburn%20Ave%2C%20Millburn%2C%20NJ%2007041!5e0!3m2!1sen!2sus!4v1234567890123!5m2!1sen!2sus"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Millburn High School Location - 462 Millburn Ave, Millburn, NJ 07041"
            />
          </div>
          <p className="text-gray-700">
            <strong>Address:</strong> 462 Millburn Ave., Millburn, NJ 07041
          </p>
        </section>
      </div>
    </div>
    </>
  );
}
