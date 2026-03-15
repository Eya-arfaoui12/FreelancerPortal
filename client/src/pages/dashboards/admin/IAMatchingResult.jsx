import { useState } from "react";
import { X, Star, Mail, Phone, Calendar, Award, CheckCircle } from "lucide-react";

export default function IAMatchingResults({ projectData, onClose, onSelectFreelancer }) {
  const [selectedFreelancer, setSelectedFreelancer] = useState(null);

  // Données simulées de freelancers correspondants
  const matchedFreelancers = [
    {
      id: 1,
      name: "Alice Dupont",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
      skills: ["JavaScript", "React", "Node.js"],
      matchScore: 95,
      hourlyRate: 45,
      availability: "Immediate",
      rating: 4.8,
      completedProjects: 24,
      location: "Paris, France",
      bio: "Développeuse fullstack avec 5 ans d'expérience en React et Node.js"
    },
    {
      id: 2,
      name: "Karim Benzema",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
      skills: ["Python", "Data Analysis", "Machine Learning"],
      matchScore: 88,
      hourlyRate: 55,
      availability: "Within 2 weeks",
      rating: 4.9,
      completedProjects: 32,
      location: "Lyon, France",
      bio: "Data scientist spécialisé en machine learning et analyse prédictive"
    },
    {
      id: 3,
      name: "Mouna Ahmed",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
      skills: ["UI/UX Design", "Figma", "Adobe XD"],
      matchScore: 82,
      hourlyRate: 40,
      availability: "Immediate",
      rating: 4.7,
      completedProjects: 18,
      location: "Marseille, France",
      bio: "Designer UI/UX passionnée par la création d'interfaces intuitives"
    }
  ];

  const getMatchColor = (score) => {
    if (score >= 90) return "text-green-600 bg-green-100 dark:bg-green-900/30";
    if (score >= 80) return "text-blue-600 bg-blue-100 dark:bg-blue-900/30";
    if (score >= 70) return "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30";
    return "text-red-600 bg-red-100 dark:bg-red-900/30";
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-500 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-4xl max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              🤖 AI Matching Results
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Top freelancers matching your project requirements
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Project Summary */}
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Project Criteria:</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-700 dark:text-blue-300">Skills: </span>
                <span>{projectData.skills?.join(", ") || "Not specified"}</span>
              </div>
              <div>
                <span className="text-blue-700 dark:text-blue-300">Budget: </span>
                <span>${projectData.budget || "Not specified"}</span>
              </div>
              <div>
                <span className="text-blue-700 dark:text-blue-300">Duration: </span>
                <span>{projectData.duration ? `${projectData.duration} days` : "Not specified"}</span>
              </div>
            </div>
          </div>

          {/* Matching Results */}
          <div className="space-y-4">
            {matchedFreelancers.map((freelancer) => (
              <div
                key={freelancer.id}
                className={`border rounded-xl p-4 transition-all duration-200 ${
                  selectedFreelancer?.id === freelancer.id
                    ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 shadow-md"
                    : "border-gray-200 dark:border-gray-700 hover:border-indigo-300 hover:shadow-sm"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <img
                      src={freelancer.avatar}
                      alt={freelancer.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {freelancer.name}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMatchColor(freelancer.matchScore)}`}>
                          {freelancer.matchScore}% Match
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {freelancer.bio}
                      </p>

                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-3">
                        <div className="flex items-center gap-1">
                          <Star size={14} className="text-yellow-500" />
                          <span>{freelancer.rating}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Award size={14} className="text-blue-500" />
                          <span>{freelancer.completedProjects} projects</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar size={14} className="text-green-500" />
                          <span>{freelancer.availability}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-3">
                        {freelancer.skills.map((skill, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs rounded-full"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="text-right ml-4">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      ${freelancer.hourlyRate}/h
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      {freelancer.location}
                    </div>
                    <button
                      onClick={() => setSelectedFreelancer(freelancer)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedFreelancer?.id === freelancer.id
                          ? "bg-indigo-600 text-white"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/30"
                      }`}
                    >
                      {selectedFreelancer?.id === freelancer.id ? "Selected" : "Select"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={() => selectedFreelancer && onSelectFreelancer(selectedFreelancer)}
              disabled={!selectedFreelancer}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <CheckCircle size={18} />
              Confirm Selection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}