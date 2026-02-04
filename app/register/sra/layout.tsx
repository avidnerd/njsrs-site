import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Science Research Advisor Registration | NJSRS - Research Competitions New Jersey',
  description: 'Register as a Science Research Advisor (SRA) for your school to participate in research competitions in New Jersey. Each school must have an SRA registered before students can register. SRAs must be able to chaperone students at the competition.',
  keywords: ['SRA registration', 'Science Research Advisor', 'teacher registration', 'school advisor registration', 'NJSRS SRA', 'research competitions New Jersey', 'science competition advisor'],
  openGraph: {
    title: 'Science Research Advisor Registration | NJSRS',
    description: 'Register as a Science Research Advisor for your school at NJSRS.',
    url: 'https://njsrs.org/register/sra',
  },
  alternates: {
    canonical: 'https://njsrs.org/register/sra',
  },
};

export default function SRARegistrationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
