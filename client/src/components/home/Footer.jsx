import React from "react";
import {
  FaFacebookF,
  FaTwitter,
  FaLinkedinIn,
  FaInstagram,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
} from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white px-6 py-16 border-t border-gray-700">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Logo & Description */}
          <div>
            <h2 className="text-3xl font-bold mb-6 text-white">
              MNM Consulting
            </h2>
            <p className="text-purple-200 leading-relaxed mb-6">
              We provide expert Microsoft project consulting, tailored solutions,
              and top-notch IT services to help your business grow and innovate.
            </p>
            <div className="flex space-x-4">
              {[
                { icon: FaFacebookF, color: "hover:text-blue-400" },
                { icon: FaTwitter, color: "hover:text-blue-300" },
                { icon: FaLinkedinIn, color: "hover:text-blue-500" },
                { icon: FaInstagram, color: "hover:text-pink-400" }
              ].map((social, index) => (
                <a
                  key={index}
                  href="#"
                  className={`w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center 
                           text-purple-200 border border-gray-700 hover:bg-gray-700 ${social.color}`}
                >
                  <social.icon />
                </a>
              ))}
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-lg font-semibold mb-6 text-white">Services</h3>
            <ul className="space-y-3">
              {[
                "Microsoft Azure",
                "Microsoft 365",
                "Azure DevOps",
                "Power BI",
                "IT Consulting",
                "Cloud Migration"
              ].map((service, index) => (
                <li key={index}>
                  <a href="#" className="text-purple-200 hover:text-white transition-colors duration-200">
                    {service}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-lg font-semibold mb-6 text-white">Company</h3>
            <ul className="space-y-3">
              {[
                "About Us",
                "Careers",
                "Blog",
                "Contact",
                "Privacy Policy",
                "Terms of Service"
              ].map((item, index) => (
                <li key={index}>
                  <a href="#" className="text-purple-200 hover:text-white transition-colors duration-200">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-6 text-white">Contact Info</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-purple-200">
                <FaMapMarkerAlt className="text-purple-400" />
                <span>123 Innovation Street, Tunis, Tunisia</span>
              </div>
              <div className="flex items-center gap-3 text-purple-200">
                <FaEnvelope className="text-purple-400" />
                <a href="mailto:contact@mnmconsulting.com" className="hover:text-white transition-colors">
                  contact@mnmconsulting.com
                </a>
              </div>
              <div className="flex items-center gap-3 text-purple-200">
                <FaPhone className="text-purple-400" />
                <a href="tel:+21612345678" className="hover:text-white transition-colors">
                  +216 12 345 678
                </a>
              </div>
            </div>

            {/* Newsletter Subscription */}
            <div className="mt-6">
              <h4 className="text-sm font-semibold text-white mb-3">Stay Updated</h4>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Your email"
                  className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg 
                           text-white placeholder-purple-300 text-sm outline-none focus:border-purple-400"
                />
                <button className="px-4 py-2 bg-purple-600 text-white 
                                 rounded-lg hover:bg-purple-700 transition-colors duration-200">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-8 border-t border-gray-700 text-center">
          <p className="text-purple-300 text-sm">
            © {new Date().getFullYear()} MNM Consulting. All rights reserved. | 
            Built with ❤️ for the Microsoft ecosystem
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;