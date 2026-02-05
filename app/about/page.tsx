import type { Metadata } from 'next';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'About Us | NJSRS - New Jersey Science Research Symposium',
  description: 'Learn about the New Jersey Science Research Symposium committee and our mission to provide high school students with opportunities to showcase their STEM research.',
  keywords: ['NJSRS about', 'New Jersey Science Research Symposium committee', 'NJSRS team', 'science fair organizers'],
  openGraph: {
    title: 'About Us | NJSRS',
    description: 'Learn about the NJSRS committee and our mission.',
    url: 'https://njsrs.org/about',
  },
  alternates: {
    canonical: 'https://njsrs.org/about',
  },
};

export default function AboutPage() {
  const committeeMembers = [
    {
      name: 'Subhi Stephan',
      role: 'Tech Committee Chair',
      description: 'Developer of the website and portal, and lead of technology management',
      image: '/subhi_stephan.jpg',
    },
    {
      name: 'Paridhi Tyagi',
      role: 'Chair of Participant Outreach and Venue',
      description: 'Manages participant advertising and coordinates venue logistics',
      image: '/pari_tyagi.jpg',
    },
    {
      name: 'Daniel Han',
      role: 'Logistics Co-Chair',
      description: 'Coordinates event logistics and operations',
      image: '/daniel_han.jpg',
    },
    {
      name: 'Ahisha Ravi',
      role: 'Logistics Co-Chair and Fundraising Chair',
      description: 'Manages logistics coordination and fundraising efforts',
      image: '/ahisha_ravi.jpg',
    },
    {
      name: 'Aaron Yu',
      role: 'Judging Outreach Chair',
      description: 'Coordinates judge recruitment and outreach efforts',
      image: '/aaron_yu.jpg',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-primary-blue mb-8">About Us</h1>

        <section className="mb-16">
          <div className="prose max-w-none text-gray-700 space-y-4">
            <p className="text-lg bold">
              The New Jersey Science Research Symposium (NJSRS) was created to fill a critical gap in science research opportunities for high school students in New Jersey. With the suspension of JSHS (Junior Science and Humanities Symposium) this year, we recognized the need for a platform where students could continue to showcase their experimental research, receive valuable feedback, and compete for recognition.
            </p>
            <p>
              Our mission is to provide high school students throughout New Jersey with a comprehensive research competition experience. We believe that every student who has conducted meaningful experimental research deserves the opportunity to present their work, defend their methodology, and learn from STEM professionals. NJSRS offers competition, education, mentorship, and community building among young researchers.
            </p>
            <p>
              Through oral presentations, category-based judging, poster sessions, and special awards, we aim to foster scientific communication skills and celebrate the innovative research being conducted by New Jersey high school students. We are committed to making this competition accessible, fair, and educational for all participants.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-3xl font-bold text-primary-blue mb-8 text-center">
            Committee Chairs
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8">
            {committeeMembers.map((member, index) => (
              <div
                key={index}
                className="group relative bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl member-card"
              >
                <div className="relative aspect-square overflow-hidden rounded-t-lg">
                  <Image
                    src={member.image}
                    alt={member.name}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-primary-blue mb-2">
                    {member.name}
                  </h3>
                  <p className="text-sm font-semibold text-primary-darkGreen mb-3">
                    {member.role}
                  </p>
                  <p className="text-gray-600 text-sm">
                    {member.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
