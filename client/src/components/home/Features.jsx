import React from 'react'
import { FaShieldAlt, FaUsers, FaRocket, FaHandshake, FaClock, FaStar } from 'react-icons/fa'

const Features = () => {
  const features = [
    {
      icon: <FaShieldAlt className="text-blue-600 text-xl" />,
      title: "Verified Experts",
      description: "All professionals are thoroughly vetted and verified for their Microsoft certifications and experience.",
    },
    {
      icon: <FaHandshake className="text-blue-600 text-xl" />,
      title: "Direct Collaboration",
      description: "Work directly with experts without intermediaries, ensuring clear communication and better results.",
    },
    {
      icon: <FaClock className="text-blue-600 text-xl" />,
      title: "Time-Efficient",
      description: "Find the right expert in minutes, not days. Our matching algorithm saves you time and effort.",
    },
    {
      icon: <FaRocket className="text-blue-600 text-xl" />,
      title: "Rapid Onboarding",
      description: "Get started with your project immediately with our streamlined onboarding process.",
    },
    {
      icon: <FaUsers className="text-blue-600 text-xl" />,
      title: "Diverse Talent",
      description: "Access a global pool of Microsoft specialists with diverse skills and expertise levels.",
    },
    {
      icon: <FaStar className="text-blue-600 text-xl" />,
      title: "Quality Assurance",
      description: "Our rating system ensures you work with top-performing professionals every time.",
    }
  ];

  return (
    <div className="bg-gray-50 py-16 px-4 lg:px-20">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Why businesses choose MNM Consulting
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We've created a platform that connects you directly with the best Microsoft talent worldwide
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <button className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 
                         transition-colors duration-200 shadow-lg shadow-blue-500/30">
            Get started today
            <FaRocket className="ml-2 text-sm" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default Features