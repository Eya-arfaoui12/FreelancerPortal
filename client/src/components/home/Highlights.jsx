import { FaUserTie, FaHandshake, FaProjectDiagram, FaAward } from "react-icons/fa";

const Highlights = () => {
  const stats = [
    {
      icon: <FaUserTie className="text-blue-600 text-2xl" />,
      value: "50+",
      label: "MNM Expert Freelancers",
    },
    {
      icon: <FaHandshake className="text-blue-600 text-2xl" />,
      value: "200+",
      label: "Satisfied Enterprise Clients",
    },
    {
      icon: <FaProjectDiagram className="text-blue-600 text-2xl" />,
      value: "500+",
      label: "Microsoft Projects Delivered",
    },
    {
      icon: <FaAward className="text-blue-600 text-2xl" />,
      value: "98%",
      label: "Client Satisfaction Rate",
    }
  ];

  return (
    <div className="py-16 px-4 bg-gradient-to-r from-blue-900 to-purple-900">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            MNM Excellence in Numbers
          </h2>
          <p className="text-xl text-blue-200 max-w-3xl mx-auto">
            Our network of Microsoft experts dedicated to your project success
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="text-center text-white p-6 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 
                         hover:bg-white/15 transition-all duration-300 hover:scale-105"
            >
              <div className="flex justify-center mb-4">
                {stat.icon}
              </div>
              <div className="text-4xl font-bold mb-2">{stat.value}</div>
              <div className="text-blue-200 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* CTA Section - Adapted for internal application */}
        <div className="text-center mt-16">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 shadow-2xl max-w-3xl mx-auto 
                      border border-white/20">
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Join the MNM Ecosystem
            </h3>
            <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
              Access our exclusive network of certified Microsoft experts and boost your projects with proven talents
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {/* <button className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-xl hover:bg-gray-100 
                               transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                📋 View Available Profiles
              </button> */}
              <button className="px-6 py-3 bg-transparent text-white border-2 border-white rounded-xl 
                               hover:bg-white/10 transition-all duration-300">
                💼 Submit a Project
              </button>
            </div>
            
            {/* Internal information */}
            <div className="mt-6 pt-6 border-t border-white/20">
              <p className="text-blue-200 text-sm">
                ⚡ Access restricted to MNM collaborators | 🔒 Secure internal platform
              </p>
            </div>
          </div>
        </div>

        {/* Additional section for internal stats */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="text-2xl font-bold text-white">24h</div>
            <div className="text-blue-200 text-sm">Average response time</div>
          </div>
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="text-2xl font-bold text-white">15+</div>
            <div className="text-blue-200 text-sm">Years of expertise</div>
          </div>
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="text-2xl font-bold text-white">100%</div>
            <div className="text-blue-200 text-sm">Microsoft certified experts</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Highlights;