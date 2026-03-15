import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Label from "../../../components/form/Label";
import Input from "../../../components/form/input/InputField";
import TextArea from "../../../components/form/input/TextArea";
import SelectSkills from "../../../components/form/SelectSkills";
import DropzoneComponent from "../../../components/form/form-elements/DropZone";
import { Brain, PlusCircle } from "lucide-react";
import IAMatchingResults from "../../../pages/dashboards/admin/IAMatchingResult"; // Import du nouveau composant

export default function IAmatching() {
  const [description, setDescription] = useState("");
  const [skills, setSkills] = useState([]);
  const [budget, setBudget] = useState("");
  const [duration, setDuration] = useState("");
  const [showMatchingResults, setShowMatchingResults] = useState(false);
  const [selectedFreelancer, setSelectedFreelancer] = useState(null);
  const navigate = useNavigate();

  const skillOptions = [
    { value: "javascript", label: "JavaScript" },
    { value: "python", label: "Python" },
    { value: "excel", label: "Excel" },
    { value: "word", label: "Word" },
    { value: "office365", label: "Office 365" },
    { value: "react", label: "React" },
    { value: "node", label: "Node.js" },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log({
      description,
      skills,
      budget,
      duration,
      selectedFreelancer
    });
    alert("✅ Project Added with Selected Freelancer!");
  };

  const handleRunMatching = () => {
    if (!skills.length) {
      alert("Please select at least one skill to run AI matching");
      return;
    }
    setShowMatchingResults(true);
  };

  const handleSelectFreelancer = (freelancer) => {
    setSelectedFreelancer(freelancer);
    setShowMatchingResults(false);
    alert(`✅ ${freelancer.name} selected for the project!`);
  };

  return (
    <div className="relative max-w-4xl mx-auto p-6 bg-white rounded-2xl shadow-md dark:bg-gray-900">

      {/* Bouton retour moderne en haut à gauche avec hover animé */}
      {/* <button
        onClick={() => navigate("/admin/projects")}
        className="absolute top-4 left-4 flex items-center justify-center w-9 h-9
                   rounded-full border border-gray-300 dark:border-gray-700
                   bg-white dark:bg-gray-800
                   text-gray-600 dark:text-gray-300
                   hover:bg-indigo-600 hover:text-white
                   shadow-sm hover:shadow-md
                   transition-all duration-300 transform hover:scale-110 hover:-translate-x-1"
      >
        <ArrowLeft size={18} />
      </button> */}

      <h1 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-white">
        ➕ Add New Project
      </h1>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Project Description */}
        <div>
          <Label>Project Description</Label>
          <TextArea
            rows={5}
            placeholder="Enter project details..."
            value={description}
            onChange={(value) => setDescription(value)}
          />
        </div>

        {/* Documents Upload */}
        <div>
          <Label>Attach Documents (contracts, invoices...)</Label>
          <DropzoneComponent />
        </div>

        {/* Skills */}
        <div>
          <Label>Required Skills</Label>
          <SelectSkills
            options={skillOptions}
            placeholder="Select required skills"
            isMulti
            onChange={(values) => setSkills(values)}
          />
        </div>

        {/* Budget */}
        <div>
          <Label>Budget ($)</Label>
          <Input
            type="number"
            placeholder="Enter budget"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
          />
        </div>

        {/* Duration */}
        <div>
          <Label>Duration (days)</Label>
          <Input
            type="number"
            placeholder="Project duration in days"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          />
        </div>

        
        {/* Buttons */}
        <div className="flex justify-end gap-4 pt-4">
          <button
            type="button"
            onClick={() => alert("🤖 Running AI Matching...")}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-normal transition"
          >
            <Brain size={18} />
            Run IA Matching
          </button>

          <button
            type="submit"
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 font-normal"
          >
            <PlusCircle size={18} />
            Add Project
          </button>
        </div>
      </form>

      {/* Modal de résultats IA */}
      {showMatchingResults && (
        <IAMatchingResults
          projectData={{ skills, budget, duration, description }}
          onClose={() => setShowMatchingResults(false)}
          onSelectFreelancer={handleSelectFreelancer}
        />
      )}

      {/* Affichage du freelancer sélectionné */}
      {selectedFreelancer && (
        <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
            ✅ Selected Freelancer
          </h3>
          <div className="flex items-center gap-3">
            <img
              src={selectedFreelancer.avatar}
              alt={selectedFreelancer.name}
              className="w-10 h-10 rounded-full"
            />
            <div>
              <p className="font-medium text-green-900 dark:text-green-100">
                {selectedFreelancer.name}
              </p>
              <p className="text-sm text-green-700 dark:text-green-300">
                {selectedFreelancer.matchScore}% Match - ${selectedFreelancer.hourlyRate}/h
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
