import Link from "next/link";

export default function JudgingPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-primary-blue mb-8">Judging</h1>

        <div className="mb-8">
          <Link
            href="/register/judge"
            className="inline-block bg-primary-green text-white px-6 py-3 rounded-md hover:bg-primary-darkGreen font-semibold mb-4"
          >
            REGISTER TO JUDGE OUR SCIENCE FAIR!
          </Link>
          <p className="text-sm text-gray-600">
            <strong>Registration opens February 1st</strong>
          </p>
        </div>

        {}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-primary-darkGreen mb-4">
            Qualifications to Serve as a Judge
          </h2>
          <p className="text-gray-700">
            Judges should have a strong background in STEM (Science, Technology, Engineering, or Mathematics) with a bachelor&apos;s degree or higher, or equivalent professional experience. We encourage graduate students, industry professionals, university faculty, and experienced high school STEM teachers to apply. Judges must be comfortable evaluating high school-level experimental research, providing feedback, and agreeing to NJSRS&apos;s conflict-of-interest and ethics policies.
          </p>
        </section>

        {}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-primary-darkGreen mb-4">
            Judging Criteria
          </h2>
          <p className="text-gray-700 mb-4">
            Evaluation is based on the quality of the research question, experimental design, data analysis, conclusions, and the student&apos;s understanding and communication.
          </p>
          <p className="text-gray-700">
            <strong>View Oral Presentation Rubric</strong> for full scoring categories and point distributions.
          </p>
        </section>

        {}
        <section>
          <h2 className="text-2xl font-semibold text-primary-darkGreen mb-4">
            Judging Guidelines & Procedure
          </h2>
          <p className="text-gray-700">
            This section provides an overview of the judging day process, including project assignment, timing, scoring, and debriefing. For more detailed information, please review the <strong>Judging Guidelines & Procedure</strong> document.
          </p>
        </section>
      </div>
    </div>
  );
}
