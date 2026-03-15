import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { Search, Filter, FileText, Download, Clock, CheckCircle, AlertCircle, XCircle, ChevronDown, ChevronUp, PenTool, RefreshCw } from "lucide-react";

export default function FreelancerDocuments() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedContract, setExpandedContract] = useState(null);
  const [contracts, setContracts] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    signed: 0,
    active: 0,
    pending: 0,
    expired: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [signing, setSigning] = useState(false);
  const navigate = useNavigate();
  const { currentUser, fetchAPI } = useAuth();

  // Load documents when component mounts
  useEffect(() => {
    if (currentUser?.id) {
      loadDocuments();
    }
  }, [currentUser]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError("");
      
      const response = await fetchAPI(`/freelancers/${currentUser.id}/documents`, {
        method: 'GET'
      });
      
      if (response.contracts && response.stats) {
        setContracts(response.contracts);
        setStats(response.stats);
      } else {
        setError("Invalid response format");
      }
    } catch (err) {
      console.error("Error loading documents:", err);
      setError(err.message || "Error loading documents");
    } finally {
      setLoading(false);
    }
  };

  // Sign a contract
  const handleSignContract = async (contractId) => {
    try {
      setSigning(true);
      
      // For example, using a dummy signature
      // In a real project, you would have a signature component
      const signature = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";
      
      const response = await fetchAPI(`/freelancers/${currentUser.id}/contracts/${contractId}/sign`, {
        method: 'PATCH',
        body: JSON.stringify({ signature })
      });
      
      if (response.success) {
        // Reload documents to update status
        await loadDocuments();
        alert("Contract signed successfully!");
      }
    } catch (err) {
      console.error("Error signing contract:", err);
      setError(err.message || "Error signing contract");
    } finally {
      setSigning(false);
    }
  };

  // Download contract PDF
  const handleDownloadPDF = async (contractId, contractTitle) => {
    try {
      const response = await fetchAPI(`/contracts/${contractId}/pdf`, {
        method: 'GET',
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(response);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Contract_${contractTitle}_${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading PDF:", err);
      alert("Error downloading PDF");
    }
  };

  // Filter contracts
  const filteredContracts = contracts.filter(contract => {
    const matchesStatus = statusFilter === "all" || contract.status === statusFilter;
    const matchesSearch = contract.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contract.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (contract.projectTitle && contract.projectTitle.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status) => {
    const statusConfig = {
      "signed": { 
        label: "Signed", 
        class: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", 
        icon: <CheckCircle size={14} /> 
      },
      "active": { 
        label: "Active", 
        class: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", 
        icon: <CheckCircle size={14} /> 
      },
      "pending": { 
        label: "Pending", 
        class: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400", 
        icon: <Clock size={14} /> 
      },
      "expired": { 
        label: "Expired", 
        class: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400", 
        icon: <XCircle size={14} /> 
      }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`px-3 py-1 text-xs font-medium rounded-full flex items-center gap-1 ${config.class}`}>
        {config.icon}
        {config.label}
      </span>
    );
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const toggleExpand = (id) => {
    if (expandedContract === id) {
      setExpandedContract(null);
    } else {
      setExpandedContract(id);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-500 dark:text-gray-400">Loading documents...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
          <button 
            onClick={loadDocuments}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Documents</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage all your contracts and documents
          </p>
        </div>
        
        <button 
          onClick={loadDocuments}
          disabled={loading}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 
                     hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400
                     text-white font-medium py-2 px-4 rounded-lg 
                     shadow-sm hover:shadow-md transition-all duration-300"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Statistics Cards */}
      {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Contracts</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            </div>
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
              <FileText size={20} className="text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Signed</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.signed}</p>
            </div>
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <CheckCircle size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Active</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.active}</p>
            </div>
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircle size={20} className="text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Pending</p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pending}</p>
            </div>
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <Clock size={20} className="text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Expired</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.expired}</p>
            </div>
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <XCircle size={20} className="text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>
      </div> */}

      {/* Filters and Search */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search contracts, clients or projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="all">All statuses</option>
              <option value="signed">Signed</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="expired">Expired</option>
            </select>
            
            <button className="px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center gap-2">
              <Filter size={16} />
              <span>More filters</span>
            </button>
          </div>
        </div>
      </div>

      {/* Contracts List */}
      <div className="space-y-4">
        {filteredContracts.map((contract) => (
          <div key={contract.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Contract Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                  <FileText size={20} className="text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {contract.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Client: {contract.client}</p>
                  {contract.projectTitle && (
                    <p className="text-xs text-gray-400 dark:text-gray-500">Project: {contract.projectTitle}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {getStatusBadge(contract.status)}
                <button 
                  onClick={() => toggleExpand(contract.id)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  {expandedContract === contract.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
              </div>
            </div>

            {/* Contract Details (expanded) */}
            {expandedContract === contract.id && (
              <div className="p-4 border-t border-gray-100 dark:border-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Description</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{contract.description}</p>
                    
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Contract Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Type:</span>
                        <span className="text-gray-900 dark:text-white">{contract.type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Amount:</span>
                        <span className="text-gray-900 dark:text-white font-semibold">{formatCurrency(contract.amount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Duration:</span>
                        <span className="text-gray-900 dark:text-white">{contract.duration}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Created:</span>
                        <span className="text-gray-900 dark:text-white">{formatDate(contract.dateCreated)}</span>
                      </div>
                      {contract.dateSigned && (
                        <div className="flex justify-between">
                          <span className="text-gray-500 dark:text-gray-400">Signed:</span>
                          <span className="text-gray-900 dark:text-white">{formatDate(contract.dateSigned)}</span>
                        </div>
                      )}
                      {contract.dateEnded && (
                        <div className="flex justify-between">
                          <span className="text-gray-500 dark:text-gray-400">Ended:</span>
                          <span className="text-gray-900 dark:text-white">{formatDate(contract.dateEnded)}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 dark:text-gray-400">Signature status:</span>
                        <div className="flex items-center gap-2 flex-wrap">
                          {contract.freelancerSigned && (
                            <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded-full">
                              ✓ Signed by me
                            </span>
                          )}
                          {contract.clientSigned && (
                            <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-1 rounded-full">
                              ✓ Signed by client
                            </span>
                          )}
                          {!contract.freelancerSigned && !contract.clientSigned && (
                            <span className="text-xs bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 px-2 py-1 rounded-full">
                              Not signed
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Associated Documents</h4>
                    <div className="space-y-3">
                      {contract.files && contract.files.length > 0 ? (
                        contract.files.map((file, index) => (
                          <div key={`${contract.id}-${index}`} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <FileText size={16} className="text-gray-400" />
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">{file.name}</p>
                                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                  <span>{file.size}</span>
                                  <span>•</span>
                                  <span className="capitalize">{file.type}</span>
                                  {file.signed && (
                                    <>
                                      <span>•</span>
                                      <span className="text-green-600 dark:text-green-400">✓ Signed</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            <button 
                              onClick={() => console.log("Download:", file.name)}
                              className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                            >
                              <Download size={16} />
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-gray-500 dark:text-gray-400 italic p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-center">
                          No associated documents
                        </div>
                      )}
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="mt-4 flex flex-col gap-2">
                      {contract.canSign && contract.status === "pending" && (
                        <button 
                          onClick={() => handleSignContract(contract.id)}
                          disabled={signing}
                          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                          {signing ? (
                            <>
                              <RefreshCw size={16} className="animate-spin" />
                              Signing in progress...
                            </>
                          ) : (
                            <>
                              <PenTool size={16} />
                              Sign Contract
                            </>
                          )}
                        </button>
                      )}
                      
                      {(contract.status === "signed" || contract.status === "active") && (
                        <button 
                          onClick={() => handleDownloadPDF(contract.id, contract.title)}
                          className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                          <Download size={16} />
                          Download PDF
                        </button>
                      )}
                      
                      {/* {contract.projectId && (
                        <button 
                          onClick={() => navigate(`/freelancer/projects/${contract.projectId}`)}
                          className="w-full py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors"
                        >
                          View Project
                        </button>
                      )} */}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredContracts.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
            <FileText size={32} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {searchTerm || statusFilter !== "all" ? "No documents found" : "No contracts available"}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {searchTerm || statusFilter !== "all" 
              ? "Try adjusting your search or filter criteria"
              : "You don't have any assigned contracts yet"
            }
          </p>
          {!searchTerm && statusFilter === "all" && contracts.length === 0 && (
            <button 
              onClick={loadDocuments}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          )}
        </div>
      )}
    </div>
  );
}