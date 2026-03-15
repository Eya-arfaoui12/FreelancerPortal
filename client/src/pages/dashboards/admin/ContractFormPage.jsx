// ContractFormPage.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { ArrowLeft, Save, FileText, Calendar, DollarSign, User, Briefcase, Download } from "lucide-react";
import { jsPDF } from "jspdf";
import { useAuth } from '../../../context/AuthContext'; // Adjust path as needed

export default function ContractFormPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams(); // For edit mode
  const selectedTemplate = location.state?.template;
  
  const [activeStep, setActiveStep] = useState(1); // 1: Details, 2: Signature
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: selectedTemplate?.type || "fixed",
    category: "",
    freelancerId: "",
    projectId: "",
    startDate: "",
    endDate: "",
    value: "",
    paymentSchedule: selectedTemplate?.paymentSchedule || "one-time",
    terms: selectedTemplate?.defaultTerms || "",
    clientName: "MNM Consulting",
    clientAddress: "Company Address", 
    clientEmail: "mnmconsulting@gmail.com"
  });
  
  const [signature, setSignature] = useState(null);
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [freelancers, setFreelancers] = useState([]);
  const [projects, setProjects] = useState([]);
  const { fetchAPI } = useAuth();

  // Fetch freelancers, projects, and contract if editing
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch freelancers
        const freelancersData = await fetchAPI('/freelancers');
        setFreelancers(freelancersData);

        // Fetch projects
        const projectsData = await fetchAPI('/projects');
        setProjects(projectsData.data || []);

        // If editing, fetch contract
        if (id) {
          const contractData = await fetchAPI(`/contracts/${id}`);
          setFormData(contractData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        alert('Failed to load data');
      }
    };
    fetchData();
  }, [id, fetchAPI]);

  useEffect(() => {
  // Initialiser le canvas pour la signature quand le step 2 est activé
  if (activeStep === 2 && canvasRef.current) {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Configurer les propriétés de dessin
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Fond blanc pour la signature
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}, [activeStep]);

  const handleSubmit = async (e) => {
  e.preventDefault();
  
  const contractData = {
    ...formData,
    freelancerUserId: formData.freelancerId, // Backend expects freelancerUserId
    clientSignature: signature, // Envoyer les vraies données base64
    // Pas besoin de freelancerSignature pour l'instant si c'est juste l'admin qui signe
  };
  
  try {
    let response;
    if (id) {
      // Update
      response = await fetchAPI(`/contracts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(contractData)
      });
      alert("Contrat mis à jour avec succès!");
    } else {
      // Create
      response = await fetchAPI('/contracts', {
        method: 'POST',
        body: JSON.stringify(contractData)
      });
      alert("Contrat créé avec succès!");
    }
    navigate("/admin/contracts");
  } catch (error) {
    console.error('Error submitting contract:', error);
    alert(id ? 'Échec de la mise à jour du contrat' : 'Échec de la création du contrat');
  }
};

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Fonctions de signature
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();

    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.closePath();
    setIsDrawing(false);
    setSignature(canvas.toDataURL());
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignature(null);
  };

  // const generateContractPDF = () => {
  //   // Création du PDF
  //   const doc = new jsPDF();
    
  //   // Titre du document basé sur le template sélectionné
  //    const contractType = formData.type.toUpperCase();
  //    const pdfTitle = `${contractType} PRICE CONTRACT AGREEMENT`;
    
  //   // En-tête du document
  //   doc.setFontSize(20);
  //   doc.setTextColor(40, 40, 40);
  //   doc.text(pdfTitle, 105, 20, { align: "center" });
    
  //   doc.setFontSize(12);
  //   doc.setTextColor(100, 100, 100);
  //   doc.text(`Contract ID: CT-${Math.floor(1000 + Math.random() * 9000)}`, 105, 30, { align: "center" });
    
  //   // Ligne séparatrice
  //   doc.setDrawColor(200, 200, 200);
  //   doc.line(20, 35, 190, 35);
    
  //   // Informations sur les parties
  //   doc.setFontSize(14);
  //   doc.setTextColor(40, 40, 40);
  //   doc.text("PARTIES", 20, 45);
    
  //   doc.setFontSize(10);
  //   doc.setTextColor(80, 80, 80);
  //   doc.text("Client:", 20, 55);
  //   doc.setFont(undefined, 'bold');
  //   doc.text(formData.clientName, 50, 55);
  //   doc.setFont(undefined, 'normal');
  //   doc.text(formData.clientAddress, 50, 60);
  //   doc.text(formData.clientEmail, 50, 65);
    
  //   // Récupérer le nom du freelancer sélectionné
  //   const freelancerOptions = freelancers.reduce((acc, f) => {
  //     acc[f.id] = f.freelancer;
  //     return acc;
  //   }, {});
  //   const freelancerName = freelancerOptions[formData.freelancerId] || "Not selected";
    
  //   doc.text("Freelancer:", 20, 75);
  //   doc.setFont(undefined, 'bold');
  //   doc.text(freelancerName, 50, 75);
  //   doc.setFont(undefined, 'normal');
    
  //   // Détails du contrat
  //   doc.setFontSize(14);
  //   doc.setTextColor(40, 40, 40);
  //   doc.text("CONTRACT DETAILS", 20, 90);
    
  //   doc.setFontSize(10);
  //   doc.setTextColor(80, 80, 80);
    
  //   const details = [
  //     { label: "Title:", value: formData.title || "Not specified", y: 100 },
  //     { label: "Type:", value: formData.type, y: 105 },
  //     { label: "Template:", value: selectedTemplate?.name || "Not selected", y: 110 },
  //     { label: "Description:", value: formData.description || "Not specified", y: 115 },
  //     { label: "Start Date:", value: formData.startDate || "Not specified", y: 125 },
  //     { label: "End Date:", value: formData.endDate || "Not specified", y: 130 },
  //     { label: "Value:", value: formData.value ? `$${formData.value}` : "Not specified", y: 135 },
  //     { label: "Payment Schedule:", value: formData.paymentSchedule, y: 140 }
  //   ];
    
  //   details.forEach(detail => {
  //     doc.text(detail.label, 20, detail.y);
  //     doc.text(detail.value, 60, detail.y);
  //   });
    
  //   // Termes et conditions
  //   if (formData.terms) {
  //     doc.setFontSize(14);
  //     doc.setTextColor(40, 40, 40);
  //     doc.text("TERMS & CONDITIONS", 20, 150);
      
  //     doc.setFontSize(10);
  //     doc.setTextColor(80, 80, 80);
      
  //     const splitTerms = doc.splitTextToSize(formData.terms, 170);
  //     doc.text(splitTerms, 20, 160);
  //   }
    
  //   // Signature
  //   if (signature) {
  //     doc.addPage();
  //     doc.setFontSize(14);
  //     doc.setTextColor(40, 40, 40);
  //     doc.text("SIGNATURES", 105, 20, { align: "center" });
      
  //     doc.setFontSize(10);
  //     doc.setTextColor(80, 80, 80);
      
  //     // Signature du client
  //     doc.text("Client Signature:", 20, 40);
  //     doc.addImage(signature, 'PNG', 20, 45, 80, 40);
  //     doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 90);
  //     doc.text(`Name: ${formData.clientName}`, 20, 95);
      
  //     // Ligne pour la signature du freelancer
  //     doc.text("Freelancer Signature:", 20, 120);
  //     doc.setDrawColor(200, 200, 200);
  //     doc.line(20, 125, 100, 125);
  //     doc.text("Date: ___________________", 20, 135);
  //     doc.text("Name: ___________________", 20, 140);
  //   }
    
  //   // Pied de page
  //   const pageCount = doc.internal.getNumberOfPages();
  //   for (let i = 1; i <= pageCount; i++) {
  //     doc.setPage(i);
  //     doc.setFontSize(8);
  //     doc.setTextColor(150, 150, 150);
  //     doc.text(`Page ${i} of ${pageCount}`, 105, 280, { align: "center" });
  //     // doc.text(`Generated on ${new Date().toLocaleDateString()}`, 105, 285, { align: "center" });
  //   }
    
  //   // Téléchargement du PDF
  //   const contractTypeForFileName = formData.type.charAt(0).toUpperCase() + formData.type.slice(1);
  //   const fileName = `Contract_${contractTypeForFileName}_${formData.title || selectedTemplate?.name || 'Untitled'}_${new Date().getTime()}.pdf`;
  //   doc.save(fileName);
  // };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => navigate("/admin/add-contract")}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create Contract - {selectedTemplate?.name}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {activeStep === 1 && "Fill in the contract details"}
            {activeStep === 2 && "Add electronic signature to finalize"}
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex justify-center mb-8">
        <div className="flex items-center">
          {[1, 2].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                activeStep >= step 
                  ? "bg-blue-500 text-white" 
                  : "bg-gray-200 dark:bg-gray-700 text-gray-500"
              }`}>
                {step}
              </div>
              {step < 2 && (
                <div className={`w-16 h-1 mx-2 ${
                  activeStep > step ? "bg-blue-500" : "bg-gray-200 dark:bg-gray-700"
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Step 1: Contract Details */}
        {activeStep === 1 && (
          <>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FileText size={18} />
                Contract Details
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Contract Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Website Development Contract"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Contract Type *
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="fixed">Fixed Price</option>
                    <option value="hourly">Hourly</option>
                    <option value="retainer">Retainer</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Describe the scope of work and deliverables..."
                  />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <User size={18} />
                Parties Involved
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Freelancer *
                  </label>
                  <select
                    name="freelancerId"
                    value={formData.freelancerId}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a freelancer</option>
                    {freelancers.map((freelancer) => (
                      <option key={freelancer.id} value={freelancer.id}>
                        {freelancer.freelancer}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Project
                  </label>
                  <select
                    name="projectId"
                    value={formData.projectId}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a project (optional)</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <DollarSign size={18} />
                Terms & Conditions
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    End Date *
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Contract Value *
                  </label>
                  <input
                    type="number"
                    name="value"
                    value={formData.value}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Payment Schedule *
                  </label>
                  <select
                    name="paymentSchedule"
                    value={formData.paymentSchedule}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="one-time">One-time Payment</option>
                    <option value="monthly">Monthly</option>
                    <option value="milestone">Milestone-based</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Additional Terms
                  </label>
                  <textarea
                    name="terms"
                    value={formData.terms}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Additional terms and conditions..."
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => navigate("/admin/add-contract")}
                className="px-6 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Back to Templates
              </button>
              <button
                type="button"
                onClick={() => setActiveStep(2)}
                className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
              >
                Continue to Signature
              </button>
            </div>
          </>
        )}

        {/* Step 2: Electronic Signature */}
        {activeStep === 2 && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Electronic Signature
            </h2>
            
            <div className="mb-6">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Please sign below to confirm and validate this contract. Your signature indicates acceptance of all terms and conditions.
              </p>
              
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 mb-4">
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={200}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  className="w-full h-48 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded cursor-crosshair"
                />
              </div>
              
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={clearSignature}
                  className="px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  Clear Signature
                </button>
                {/* <button
                  type="button"
                  onClick={generateContractPDF}
                  className="flex items-center gap-2 px-4 py-2 text-green-600 border border-green-300 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20"
                >
                  <Download size={16} />
                  Download PDF
                </button> */}
              </div>
            </div>

            {signature && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Signature Preview:</h3>
                <img src={signature} alt="Signature preview" className="w-48 h-24 border border-gray-300 dark:border-gray-600 rounded" />
              </div>
            )}

            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => setActiveStep(1)}
                className="px-6 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Back to Details
              </button>
             <button
                type="submit"
                disabled={!signature}
                className={`inline-flex items-center gap-1.5 ${
                  !signature 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700'
                } text-white font-normal text-sm py-2 px-4 rounded-lg shadow-sm hover:shadow-md transition-all duration-300`}
              >
                <Save size={16} />
                {id ? 'Update Contract' : 'Create Contract'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}