import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Judge Registration | NJSRS - Research Competitions New Jersey',
  description: 'Register to become a judge at the New Jersey Science Research Symposium, one of the premier research competitions in New Jersey. We need STEM professionals, university faculty, and graduate students to evaluate high school science research projects. Registration opens February 1st.',
  keywords: ['judge registration', 'science fair judge', 'volunteer judge', 'STEM judge registration', 'NJSRS judge', 'judge research competitions New Jersey', 'science competition judge'],
  openGraph: {
    title: 'Judge Registration | NJSRS',
    description: 'Register to become a judge at the New Jersey Science Research Symposium.',
    url: 'https://njsrs.org/register/judge',
  },
  alternates: {
    canonical: 'https://njsrs.org/register/judge',
  },
};

export default function JudgeRegistrationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
