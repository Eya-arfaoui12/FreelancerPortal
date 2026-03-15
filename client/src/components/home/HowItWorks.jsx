import React from 'react'
import { FaSearch, FaHandshake, FaTasks } from 'react-icons/fa'

const HowItWorks = () => {
  const steps = [
    {
      icon: <FaSearch className="text-white text-2xl" />,
      title: "Find Your Expert",
      description: "Browse our directory of certified Microsoft professionals",
      color: "bg-blue-600"
    },
    {
      icon: <FaHandshake className="text-white text-2xl" />,
      title: "Connect Directly",
      description: "Message and discuss your project requirements",
      color: "bg-purple-600"
    },
    {
      icon: <FaTasks className="text-white text-2xl" />,
      title: "Start Collaborating",
      description: "Begin working together with secure project tools",
      color: "bg-indigo-600"
    }
  ]

  return (
    <div className="py-16 px-4 lg:px-20 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            How TalentHub Works
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Simple, efficient, and designed for Microsoft professionals and clients
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="text-center">
              <div className="flex justify-center mb-6">
                <div className={`w-16 h-16 ${step.color} rounded-full flex items-center justify-center`}>
                  {step.icon}
                </div>
              </div>
              <div className="mb-2 text-lg font-semibold text-gray-900">Step {index + 1}</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
              <p className="text-gray-600">{step.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <button className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium">
            Get Started Today
          </button>
        </div>
      </div>
    </div>
  )
}

export default HowItWorks