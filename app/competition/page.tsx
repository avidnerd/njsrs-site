export default function CompetitionPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-primary-blue mb-8">Competition</h1>

        {/* Timeline & Deadlines */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-primary-darkGreen mb-6">
            Timeline & Deadlines
          </h2>
          <div className="relative">
            <div className="flex items-center space-x-4 overflow-x-auto pb-4">
              <div className="flex-shrink-0 text-center">
                <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-sm font-semibold">01/01</span>
                </div>
                <p className="text-sm font-medium">01/01/2025</p>
                <p className="text-sm text-gray-600">Registration Opens</p>
              </div>
              <div className="flex-shrink-0 w-24 h-1 bg-yellow-400"></div>
              <div className="flex-shrink-0 text-center">
                <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-sm font-semibold">TBD</span>
                </div>
                <p className="text-sm font-medium">TBD</p>
                <p className="text-sm text-gray-600">SRC Project Submission</p>
              </div>
              <div className="flex-shrink-0 w-24 h-1 bg-yellow-400"></div>
              <div className="flex-shrink-0 text-center">
                <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-sm font-semibold">TBD</span>
                </div>
                <p className="text-sm font-medium">TBD</p>
                <p className="text-sm text-gray-600">Registration Closes</p>
              </div>
              <div className="flex-shrink-0 w-24 h-1 bg-yellow-400"></div>
              <div className="flex-shrink-0 text-center">
                <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-sm font-semibold">TBD</span>
                </div>
                <p className="text-sm font-medium">TBD</p>
                <p className="text-sm text-gray-600">Abstract Submission Deadline</p>
              </div>
              <div className="flex-shrink-0 w-24 h-1 bg-yellow-400"></div>
              <div className="flex-shrink-0 text-center">
                <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-sm font-semibold">04/16</span>
                </div>
                <p className="text-sm font-medium">04/16/2026</p>
                <p className="text-sm text-gray-600">Fair Date</p>
              </div>
            </div>
          </div>
        </section>

        {/* Qualifying Projects */}
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
            <p className="text-gray-700">
              If a project requires SRC approval as per our <strong>SRC Guidelines</strong> (a clickable link), they must submit the appropriate forms at an earlier deadline as shown above.
            </p>
          </div>
        </section>

        {/* Competition Format & Rules */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-primary-darkGreen mb-4">
            Competition Format & Rules
          </h2>
          <p className="text-gray-700 mb-6">
            In NJSRS, every project is presented through a long-form oral presentation with slides and is judged in front of a panel of STEM professionals and an audience. The competition uses a two-stage format: morning category judging in classrooms and afternoon final round presentations for category winners.
          </p>

          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Judged Oral Presentations (Category Round)
            </h3>
            <p className="text-gray-700 mb-4">
              Students present in assigned categories (e.g., Biology, Chemistry, Mathematics & Computer Science), with each category in its own classroom. Every student gives a 10-minute presentation using slides, followed by 5 minutes of judge Q&A and 3 minutes of audience Q&A. Judges then step into the hallway to finalize their scoring and written feedback. Evaluation is based on clarity of explanation, quality of experimental design and analysis, understanding of the science, and ability to respond to questions. First place category winners advance to the final round.
            </p>
            <p className="text-gray-700">
              <strong>View detailed Presentation Rules</strong>
            </p>
          </div>

          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Final Round Presentations
            </h3>
            <p className="text-gray-700 mb-4">
              First place category winners deliver a second 10-minute slide presentation in a common space such as the auditorium, cafeteria, library, or MILL. In the final round, there is no judge Q&A and no audience Q&A; judges score solely on the quality of the presentation and the underlying research. These finalists will be eligible to win the Grand Prizes of NJSRS.
            </p>
            <p className="text-gray-700">
              <strong>View Final Round Guidelines</strong>
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Rules, Safety & Ethics
            </h3>
            <p className="text-gray-700 mb-4">
              All projects must follow ISEF safety rules and NJSRI&apos;s own rules on research integrity, attribution, and safe use of materials and equipment. Projects involving human participants, vertebrate animals, or potentially hazardous biological agents (PHBAs) require prior SRC (and IRB, if applicable) approval before experimentation begins. Students must accurately represent their own work, maintain proper citations, and may not fabricate or misreport data; serious violations lead to disqualification.
            </p>
            <p className="text-gray-700">
              <strong>View Full Rules & Ethics Policy.</strong>
            </p>
          </div>
        </section>

        {/* Venue */}
        <section>
          <h2 className="text-2xl font-semibold text-primary-darkGreen mb-4">
            Venue
          </h2>
          <p className="text-gray-700 mb-4">
            The New Jersey Science Research Symposium is hosted at Millburn High School in Millburn, New Jersey. The event uses two main spaces:
          </p>
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Classrooms 100-110 - Oral Presentations
              </h3>
              <p className="text-gray-700">
                A set of adjacent classrooms (100-110) is reserved for oral presentations. In each room, a small panel of judges listens to talks, asks questions, and scores projects.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Auditorium
              </h3>
              <p className="text-gray-700">
                The high school auditorium is used for the final round judging and award ceremony. First place category winners will present their research in front of a larger audience to be evaluated for the Grand Prize Winners Award of NJSRS.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
