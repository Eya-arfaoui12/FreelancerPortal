import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, FileText, Calendar, DollarSign, User, Briefcase, Download, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useAuth } from '../../../context/AuthContext';

export default function EditContractPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { fetchAPI } = useAuth();
  const canvasRef = useRef(null);
  
  const [activeStep, setActiveStep] = useState(1);
  const [isDrawing, setIsDrawing] = useState(false);
  const [clientSignature, setClientSignature] = useState(null);
  const [freelancerSignature, setFreelancerSignature] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });
  const [freelancers, setFreelancers] = useState([]);
  const [projects, setProjects] = useState([]);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "fixed",
    freelancerUserId: "",
    projectId: "",
    startDate: "",
    endDate: "",
    value: "",
    paymentSchedule: "milestone",
    terms: "",
    clientName: "MNM Consulting",
    clientAddress: "Company Address", 
    clientEmail: "mnmconsulting@gmail.com",
    status: "active",
    templateId: null
  });

  // Fonction pour afficher les notifications
  const showNotification = (type, message) => {
    setNotification({ show: true, type, message });
    setTimeout(() => {
      setNotification({ show: false, type: '', message: '' });
    }, 5000);
  };

  // Fonction pour fermer la notification manuellement
  const closeNotification = () => {
    setNotification({ show: false, type: '', message: '' });
  };

  // Charger les données du contrat
  useEffect(() => {
    const fetchContractData = async () => {
      try {
        setLoading(true);
        setError('');
        
        const contractData = await fetchAPI(`/contracts/${id}`);
        
        setFormData({
          title: contractData.title || "",
          description: contractData.description || "",
          type: contractData.type || "fixed",
          freelancerUserId: contractData.freelancerId || "",
          projectId: contractData.projectId || "",
          startDate: contractData.startDate || "",
          endDate: contractData.endDate || "",
          value: contractData.value || "",
          paymentSchedule: contractData.paymentSchedule || "milestone",
          terms: contractData.terms || "",
          clientName: contractData.clientName || "MNM Consulting",
          clientAddress: contractData.clientAddress || "Company Address",
          clientEmail: contractData.clientEmail || "mnmconsulting@gmail.com",
          status: contractData.status || "active",
          templateId: contractData.template?.id || null
        });

        // Charger les signatures existantes
        if (contractData.clientSignature) {
          setClientSignature(contractData.clientSignature);
        }
        if (contractData.freelancerSignature) {
          setFreelancerSignature(contractData.freelancerSignature);
        }
        
      } catch (error) {
        console.error('Error fetching contract:', error);
        setError('Failed to load contract data');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchContractData();
    }
  }, [id, fetchAPI]);

  // Charger les freelancers et projets pour les dropdowns
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        // Charger les freelancers
        const freelancersResponse = await fetchAPI('/freelancers');
        console.log('Freelancers response:', freelancersResponse);
        setFreelancers(Array.isArray(freelancersResponse) ? freelancersResponse : []);
        
        // Charger les projets
        const projectsResponse = await fetchAPI('/projects');
        console.log('Projects response:', projectsResponse);
        setProjects(Array.isArray(projectsResponse) ? projectsResponse : []);
        
      } catch (error) {
        console.error('Error fetching dropdown data:', error);
        setFreelancers([]);
        setProjects([]);
      }
    };

    fetchDropdownData();
  }, [fetchAPI]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setUpdating(true);
      setError('');

      const updateData = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        freelancerUserId: formData.freelancerUserId,
        projectId: formData.projectId,
        startDate: formData.startDate,
        endDate: formData.endDate,
        value: parseFloat(formData.value),
        paymentSchedule: formData.paymentSchedule,
        terms: formData.terms,
        clientName: formData.clientName,
        clientAddress: formData.clientAddress,
        clientEmail: formData.clientEmail,
        status: formData.status,
        templateId: formData.templateId,
        clientSignature: clientSignature,
        freelancerSignature: freelancerSignature
      };

      const response = await fetchAPI(`/contracts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updateData)
      });

      if (response) {
        showNotification('success', 'Contract updated successfully!');
        // Retarder la navigation pour laisser le temps de voir la notification
        setTimeout(() => {
          navigate('/admin/contracts');
        }, 2000);
      }
      
    } catch (error) {
      console.error('Error updating contract:', error);
      const errorMessage = 'Failed to update contract: ' + error.message;
      setError(errorMessage);
      showNotification('error', errorMessage);
    } finally {
      setUpdating(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Fonctions de signature pour le client
  const startDrawing = (e, signatureType = 'client') => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing({ type: signatureType, drawing: true });
  };

  const draw = (e) => {
    if (!isDrawing.drawing) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();

    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing.drawing) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.closePath();
    
    const signatureData = canvas.toDataURL();
    
    if (isDrawing.type === 'client') {
      setClientSignature(signatureData);
    } else {
      setFreelancerSignature(signatureData);
    }
    
    setIsDrawing({ type: null, drawing: false });
  };

  const clearSignature = (signatureType = 'client') => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (signatureType === 'client') {
      setClientSignature(null);
    } else {
      setFreelancerSignature(null);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const response = await fetchAPI(`/contracts/${id}/pdf`, {
        method: 'GET',
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Contract_${formData.title || 'Updated'}_${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      showNotification('error', 'Failed to download contract PDF');
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700 h-96"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Notification Toast */}
      {notification.show && (
        <div className="fixed top-4 right-4 z-50">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border transition-all duration-300 transform ${
            notification.type === 'success' 
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
              : notification.type === 'error'
              ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
              : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200'
          }`}>
            {notification.type === 'success' && <CheckCircle size={20} />}
            {notification.type === 'error' && <XCircle size={20} />}
            {notification.type === 'info' && <AlertCircle size={20} />}
            <span className="font-medium">{notification.message}</span>
            <button
              onClick={closeNotification}
              className={`ml-2 p-1 rounded-full transition-colors ${
                notification.type === 'success'
                  ? 'hover:bg-green-200 dark:hover:bg-green-800'
                  : notification.type === 'error'
                  ? 'hover:bg-red-200 dark:hover:bg-red-800'
                  : 'hover:bg-blue-200 dark:hover:bg-blue-800'
              }`}
            >
              <XCircle size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => navigate("/admin/contracts")}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Contract - CT-{id.slice(-4)}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {activeStep === 1 && "Update contract details"}
            {activeStep === 2 && "Update electronic signatures"}
          </p>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded">
          {error}
        </div>
      )}

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
                    name="freelancerUserId"
                    value={formData.freelancerUserId}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a freelancer</option>
                    {freelancers.map((freelancer) => (
                      <option key={freelancer.userId} value={freelancer.userId}>
                        {freelancer.firstName} {freelancer.lastName}
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="terminated">Terminated</option>
                    <option value="expired">Expired</option>
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
                    <option value="milestone">Milestone-based</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
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
                onClick={() => navigate("/admin/contracts")}
                className="px-6 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setActiveStep(2)}
                className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
              >
                Continue to Signatures
              </button>
            </div>
          </>
        )}

        {/* Step 2: Electronic Signatures */}
        {activeStep === 2 && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Electronic Signatures
            </h2>
            
            {/* Client Signature */}
            <div className="mb-8">
              <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">Client Signature</h3>
              
              {clientSignature && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Current signature:</p>
                  <img src={clientSignature} alt="Client signature" className="w-64 h-32 border border-gray-300 dark:border-gray-600 rounded" />
                </div>
              )}
              
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 mb-4">
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={150}
                  onMouseDown={(e) => startDrawing(e, 'client')}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  className="w-full h-32 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded cursor-crosshair"
                />
              </div>
              
              <div className="flex gap-4 mb-6">
                <button
                  type="button"
                  onClick={() => clearSignature('client')}
                  className="px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  Clear Client Signature
                </button>
              </div>
            </div>

            {/* Freelancer Signature */}
            <div className="mb-8">
              <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">Freelancer Signature</h3>
              
              {freelancerSignature && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Current signature:</p>
                  <img src={freelancerSignature} alt="Freelancer signature" className="w-64 h-32 border border-gray-300 dark:border-gray-600 rounded" />
                </div>
              )}
              
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 mb-4">
                <canvas
                  width={600}
                  height={150}
                  onMouseDown={(e) => startDrawing(e, 'freelancer')}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  className="w-full h-32 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded cursor-crosshair"
                />
              </div>
              
              <div className="flex gap-4 mb-6">
                <button
                  type="button"
                  onClick={() => clearSignature('freelancer')}
                  className="px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  Clear Freelancer Signature
                </button>
                <button
                  type="button"
                  onClick={handleDownloadPDF}
                  className="flex items-center gap-2 px-4 py-2 text-green-600 border border-green-300 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20"
                >
                  <Download size={16} />
                  Download PDF
                </button>
              </div>
            </div>

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
                disabled={updating}
                className="inline-flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 
                         hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500
                         text-white font-normal text-sm py-2 px-4 rounded-lg 
                         shadow-sm hover:shadow-md transition-all duration-300"
              >
                <Save size={16} />
                {updating ? 'Updating...' : 'Update Contract'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}