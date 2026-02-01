import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center mb-4">
              <Image
                src="/njsrs-icon-only.png"
                alt="NJSRS Logo"
                width={60}
                height={60}
                className="mr-3"
              />
              <h3 className="text-lg font-semibold">NJSRS</h3>
            </div>
            <p className="text-gray-400 text-sm">
              New Jersey Science Research Symposium hosted at Millburn High School.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/competition" className="text-gray-400 hover:text-white">
                  Competition
                </a>
              </li>
              <li>
                <a href="/judging" className="text-gray-400 hover:text-white">
                  Judging
                </a>
              </li>
              <li>
                <a href="/donate" className="text-gray-400 hover:text-white">
                  Donate
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <p className="text-gray-400 text-sm">
              Millburn High School
              <br />
              462 Millburn Ave
              <br />
              Millburn, NJ
              <br />
              <a href="mailto:fairdirector@njsrs.org" className="text-white hover:text-primary-green mt-2 inline-block">
                fairdirector@njsrs.org
              </a>
            </p>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-sm text-gray-400">
          <p>&copy; {new Date().getFullYear()} New Jersey Science Research Symposium. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
