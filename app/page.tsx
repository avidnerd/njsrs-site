import Link from "next/link";

export default function HomePage() {
  return (
    <div>
      <section className="bg-primary-blue text-white py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-16 lg:gap-24 xl:gap-28 items-center">
            <div className="pr-0 lg:pr-8">
              <h1 className="text-xl md:text-3xl lg:text-4xl font-bold mb-6 leading-tight">
                The New Jersey Science Research Symposium (NJSRS) is a research competition that brings together high school scientists from across New Jersey to present original STEM research projects.
              </h1>
              <p className="text-lg md:text-xl mb-8 text-blue-100">
                Hosted at Millburn High School, this invitational is designed to provide students a platform to share, defend, and advance their research.
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
                  alt="Laboratory Equipment" 
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
                  alt="Scientist" 
                  className="h-24 w-auto"
                />
              </div>
              <h2 className="text-2xl font-bold text-primary-blue mb-4 text-center">
                The Competition
              </h2>
              <p className="text-gray-600">
                NJSRS is for high school students who have conducted experimental STEM research within the past year. Competitors give an oral presentation in front of slides and are scored by STEM professionals.
              </p>
            </Link>

            <div className="bg-white rounded-lg shadow-md p-8">
              <div className="mb-8 flex justify-center">
                <img 
                  src="/Envelope_with_Letter_PNG_Clip_Art.png" 
                  alt="Envelope with Letter" 
                  className="h-24 w-auto"
                />
              </div>
              <h2 className="text-2xl font-bold text-primary-blue mb-4 text-center">
                How to Participate
              </h2>
              <p className="text-gray-600">
                NJSRS is open to any high school student currently attending a high school in New Jersey. Each student must have an adult sponsor (teacher, mentor, parent) in order to participate.
              </p>
            </div>

            <Link href="/donate" className="bg-white rounded-lg shadow-md p-8 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="mb-8 flex justify-center">
                <img 
                  src="/donate.png" 
                  alt="Donate" 
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
                alt="Fair Timeline and Deadlines" 
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
