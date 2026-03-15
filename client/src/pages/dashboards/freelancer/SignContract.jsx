import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, FileText, CheckCircle, XCircle, Download, Upload, Clock, User, Calendar, DollarSign } from "lucide-react";

export default function SignContract() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [signature, setSignature] = useState("");
  const [isSigned, setIsSigned] = useState(false);

  // Mock contract data (normally fetched via API)
  const contract = {
    id: "C-003",
    title: "UI/UX Redesign Contract",
    client: "Startup XYZ",
    status: "pending",
    dateCreated: "2023-11-05",
    amount: 3500,
    type: "Hourly",
    duration: "3 months",
    description: "Contract for complete user interface redesign with modern design and improved user experience.",
    terms: `
      1. The service provider agrees to provide the UI/UX redesign services described in the specifications.
      2. The client agrees to pay the amount of €3500 according to the agreed schedule.
      3. Any substantial modification of the project will be subject to an amendment to this contract.
      4. The service provider retains intellectual property rights until full payment.
      5. In case of dispute, the parties will endeavor to find an amicable solution before any legal action.
    `,
    clientInfo: {
      name: "Mark Dupont",
      email: "mark@startupxyz.com",
      position: "Technical Director"
    }
  };

  const handleSignature = () => {
    // Signature simulation
    setSignature("John Freelancer - " + new Date().toLocaleDateString('en-US'));
    setIsSigned(true);
    
    // Here, we would normally send the signature to the API
    setTimeout(() => {
      navigate("/freelancer/documents");
    }, 2000);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/freelancer/documents")}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Sign Contract
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Contract ID: {contract.id}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <Download size={20} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contract Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                  <FileText size={24} className="text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">{contract.title}</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Client: {contract.client}</p>
                </div>
              </div>

              {/* Contract Details */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <DollarSign size={16} className="mr-2" />
                  <span>Amount: <strong className="text-gray-900 dark:text-white">{formatCurrency(contract.amount)}</strong></span>
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <Clock size={16} className="mr-2" />
                  <span>Duration: <strong className="text-gray-900 dark:text-white">{contract.duration}</strong></span>
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <Calendar size={16} className="mr-2" />
                  <span>Created: <strong className="text-gray-900 dark:text-white">{formatDate(contract.dateCreated)}</strong></span>
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <FileText size={16} className="mr-2" />
                  <span>Type: <strong className="text-gray-900 dark:text-white">{contract.type}</strong></span>
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">Description</h3>
                <p className="text-gray-600 dark:text-gray-400">{contract.description}</p>
              </div>

              {/* Contract Terms */}
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">Contract Terms</h3>
                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                  <pre className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                    {contract.terms}
                  </pre>
                </div>
              </div>

              {/* Signature */}
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 dark:text-white mb-4">Signature</h3>
                
                {isSigned ? (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-400 mb-2">
                      <CheckCircle size={20} />
                      <span className="font-medium">Contract successfully signed</span>
                    </div>
                    <p className="text-sm text-green-600 dark:text-green-400">
                      Your signature: <strong>{signature}</strong>
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                      The contract has been sent to the client for countersignature.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <CheckCircle size={16} />
                      <span>I have read and accept the terms of the contract</span>
                    </div>
                    
                    <button
                      onClick={handleSignature}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <FileText size={18} />
                      Sign Electronically
                    </button>
                    
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                      By clicking "Sign Electronically", you legally accept all terms and conditions of this contract.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Client Info */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Client Information</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                    <User size={20} className="text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">{contract.clientInfo.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{contract.clientInfo.position}</p>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <span className="font-medium mr-2">Company:</span>
                    <span>{contract.client}</span>
                  </div>
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <span className="font-medium mr-2">Email:</span>
                    <span>{contract.clientInfo.email}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Contract Status</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Creation</span>
                  <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                    <CheckCircle size={16} />
                    <span className="text-sm">Completed</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Freelancer signature</span>
                  {isSigned ? (
                    <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                      <CheckCircle size={16} />
                      <span className="text-sm">Completed</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                      <Clock size={16} />
                      <span className="text-sm">Pending</span>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Client signature</span>
                  <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                    <Clock size={16} />
                    <span className="text-sm">Pending</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Active contract</span>
                  <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                    <Clock size={16} />
                    <span className="text-sm">Pending</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Actions</h2>
              <div className="space-y-3">
                <button className="w-full py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                  <Download size={16} />
                  Download PDF
                </button>
                <button className="w-full py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                  <Upload size={16} />
                  Import documents
                </button>
                <button className="w-full py-2.5 border border-red-300 dark:border-red-600 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                  <XCircle size={16} />
                  Decline contract
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}