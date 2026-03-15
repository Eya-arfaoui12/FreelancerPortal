// TemplateSelectionPage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAuth } from '../../../context/AuthContext'; // Adjust path as needed

export default function TemplateSelectionPage() {
  const navigate = useNavigate();
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [contractTemplates, setContractTemplates] = useState([]);
  const { fetchAPI } = useAuth();

  // Fetch templates from backend
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await fetchAPI('/contracts/templates');
        setContractTemplates(response);
      } catch (error) {
        console.error('Error fetching templates:', error);
        alert('Failed to load contract templates');
      }
    };
    fetchTemplates();
  }, [fetchAPI]);

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    
    // Naviguer vers la page de formulaire avec le template sélectionné
    navigate("/admin/add-contract/form", { state: { template } });
  };

  const testTemplateSelection = () => {
    if (selectedTemplate) {
      alert(`Template sélectionné:\n\nNom: ${selectedTemplate.name}\nType: ${selectedTemplate.type}\nPaiement: ${selectedTemplate.paymentSchedule}\n\nTermes par défaut:\n${selectedTemplate.defaultTerms}`);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate("/admin/contracts")}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Choose Contract Template</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Select a template to start creating your contract
            </p>
          </div>
        </div>
        
        {/* Bouton de test pour vérifier le template sélectionné */}
        {selectedTemplate && (
          <button
            onClick={testTemplateSelection}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm"
          >
            Test Template
          </button>
        )}
      </div>

      {/* Templates Grid */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          Available Contract Templates
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {contractTemplates.map((template) => (
            <div
              key={template.id}
              onClick={() => handleTemplateSelect(template)}
              className={`border-2 p-6 rounded-lg cursor-pointer transition-all duration-200 ${
                selectedTemplate?.id === template.id
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  : "border-gray-200 dark:border-gray-700 hover:border-blue-300 hover:shadow-md"
              }`}
            >
              <div className="text-3xl mb-4">{template.icon}</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {template.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {template.description}
              </p>
              <div className="mb-4 p-2 bg-gray-100 dark:bg-gray-700 rounded">
                <p className="text-xs font-medium">Type: {template.type}</p>
                <p className="text-xs">Payment: {template.paymentSchedule}</p>
              </div>
              <ul className="space-y-1">
                {template.features.map((feature, index) => (
                  <li key={index} className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
                    {feature}
                  </li>
                ))}
              </ul>
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                <button className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm">
                  Select Template
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}