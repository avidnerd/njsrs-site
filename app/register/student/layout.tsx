import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Student Registration | NJSRS - Research Competitions New Jersey',
  description: 'Register as a student to compete in the New Jersey Science Research Symposium, one of the premier research competitions in New Jersey. You must have a Science Research Advisor (SRA) from your school registered first. Entry fee $30 per student.',
  keywords: ['NJSRS student registration', 'register for research competitions New Jersey', 'science competition registration', 'high school science fair', 'student registration', 'research competitions for high school students', 'register for science competition New Jersey'],
  openGraph: {
    title: 'Student Registration | NJSRS',
    description: 'Register as a student to compete in the New Jersey Science Research Symposium.',
    url: 'https://njsrs.org/register/student',
  },
  alternates: {
    canonical: 'https://njsrs.org/register/student',
  },
};

export default function StudentRegistrationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
