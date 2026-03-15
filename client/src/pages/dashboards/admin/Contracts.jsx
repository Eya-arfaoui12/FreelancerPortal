import { useState, useEffect } from "react";
import { Search, Filter, Eye, Download, Edit, Trash2, Plus, AlertTriangle, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from '../../../context/AuthContext';
import toast, { Toaster } from 'react-hot-toast';

export default function Contracts() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [contracts, setContracts] = useState([]);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, contract: null });
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();
  const { fetchAPI } = useAuth();

  // Function to format contract ID
  const formatContractId = (id) => {
    return `CT-${id.slice(-4)}`;
  };

  // Fetch contracts from backend
  useEffect(() => {
    const fetchContracts = async () => {
      try {
        const response = await fetchAPI('/contracts');
        setContracts(response);
      } catch (error) {
        console.error('Error fetching contracts:', error);
        toast.error('Failed to load contracts');
      }
    };
    fetchContracts();
  }, [fetchAPI]);

  // Download PDF
  const handleDownloadPDF = async (contractId, title, templatePdfTitle) => {
    const loadingToast = toast.loading('Downloading contract PDF...');
    try {
      const response = await fetchAPI(`/contracts/${contractId}/pdf`, {
        method: 'GET',
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${templatePdfTitle || title || `contract-${contractId}`}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Contract PDF downloaded successfully', {
        id: loadingToast,
      });
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Failed to download contract PDF', {
        id: loadingToast,
      });
    }
  };

  // Filter and sort contracts
  const filteredContracts = contracts
    .filter(contract => {
      const formattedId = formatContractId(contract.id);
      const matchesSearch = 
        formattedId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contract.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contract.freelancer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contract.project.title.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || contract.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.createdAt) - new Date(a.createdAt);
      } else if (sortBy === "oldest") {
        return new Date(a.createdAt) - new Date(b.createdAt);
      } else if (sortBy === "value-high") {
        const aValue = parseFloat(a.value) || 0;
        const bValue = parseFloat(b.value) || 0;
        return bValue - aValue;
      } else if (sortBy === "value-low") {
        const aValue = parseFloat(a.value) || 0;
        const bValue = parseFloat(b.value) || 0;
        return aValue - bValue;
      }
      return 0;
    });

  // Statistics
  const stats = {
    total: contracts.length,
    active: contracts.filter(c => c.status === "ACTIVE").length,
    completed: contracts.filter(c => c.status === "COMPLETED").length,
    canceled: contracts.filter(c => c.status === "TERMINATED").length,
    totalValue: contracts.reduce((sum, contract) => {
      const value = parseFloat(contract.value) || 0;
      return sum + value;
    }, 0),
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      ACTIVE: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      COMPLETED: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      TERMINATED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
      DRAFT: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
      EXPIRED: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    };
    
    const statusLabels = {
      ACTIVE: "Active",
      COMPLETED: "Completed",
      TERMINATED: "Terminated",
      DRAFT: "Draft",
      EXPIRED: "Expired",
    };
    
    return (
      <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${statusClasses[status]}`}>
        {statusLabels[status]}
      </span>
    );
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Open delete modal
  const openDeleteModal = (contract) => {
    setDeleteModal({ isOpen: true, contract });
  };

  // Close delete modal
  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, contract: null });
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (!deleteModal.contract) return;

    setIsDeleting(true);
    try {
      await fetchAPI(`/contracts/${deleteModal.contract.id}`, { method: 'DELETE' });
      setContracts(contracts.filter(contract => contract.id !== deleteModal.contract.id));
      closeDeleteModal();
      
      // Success notification with toast
      toast.success(
        <div className="flex items-center gap-2">
          <span className="font-medium">Contract deleted successfully</span>
        </div>,
        {
          duration: 4000,
          icon: '✅',
          style: {
            background: '#10B981',
            color: '#fff',
            padding: '16px',
            borderRadius: '10px',
          },
        }
      );
    } catch (error) {
      console.error('Error deleting contract:', error);
      toast.error(
        <div className="flex flex-col">
          <span className="font-medium">Failed to delete contract</span>
          <span className="text-sm opacity-90">{error.message || 'Please try again'}</span>
        </div>,
        {
          duration: 5000,
          style: {
            padding: '16px',
            borderRadius: '10px',
          },
        }
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // Delete Modal Component
  const DeleteConfirmationModal = () => {
    if (!deleteModal.isOpen || !deleteModal.contract) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300 scale-100">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
                <AlertTriangle size={24} className="text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Delete Contract
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  This action cannot be undone
                </p>
              </div>
              <button
                onClick={closeDeleteModal}
                disabled={isDeleting}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="space-y-4">
              {/* Warning message */}
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-800 dark:text-red-200">
                  You are about to permanently delete this contract. This will remove all associated data and cannot be recovered.
                </p>
              </div>

              {/* Contract details */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Contract ID:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatContractId(deleteModal.contract.id)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Freelancer:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {deleteModal.contract.freelancer.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Project:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white truncate ml-2">
                    {deleteModal.contract.project.title}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Value:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatCurrency(deleteModal.contract.rate)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
                  {getStatusBadge(deleteModal.contract.status)}
                </div>
              </div>

              {/* Confirmation text */}
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Are you sure you want to delete this contract?
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={closeDeleteModal}
              disabled={isDeleting}
              className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 
                       bg-white dark:bg-gray-700 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-600 
                       transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              disabled={isDeleting}
              className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium 
                       transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed 
                       flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
            >
              {isDeleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 size={16} />
                  Delete Contract
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Toast Container */}
      <Toaster
        position="top-right"
        reverseOrder={false}
        toastOptions={{
          // Default options
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          // Success style
          success: {
            duration: 4000,
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          // Error style
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
          // Loading style
          loading: {
            iconTheme: {
              primary: '#3B82F6',
              secondary: '#fff',
            },
          },
        }}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Contracts Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            View and manage all company contracts
          </p>
        </div>
        <button
          onClick={() => navigate("/admin/add-contract")}
          className="inline-flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 
                     hover:from-indigo-700 hover:to-purple-700 
                     text-white font-normal text-sm py-1.5 px-3.5 rounded-lg 
                     shadow-sm hover:shadow-md transition-all duration-300"
        >
          <Plus size={12} />
          New Contract
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Contracts</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Active</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.active}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Completed</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.completed}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Terminated</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.canceled}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Value</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(stats.totalValue)}</p>
        </div>
      </div>

      {/* Filters and search */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search by Contract ID (CT-XXXX), freelancer or project..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="DRAFT">Draft</option>
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
              <option value="TERMINATED">Terminated</option>
              <option value="EXPIRED">Expired</option>
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="value-high">Value (High to Low)</option>
              <option value="value-low">Value (Low to High)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Contracts table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Contract ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Freelancer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Project</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Period</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
              {filteredContracts.length > 0 ? (
                filteredContracts.map((contract) => (
                  <tr key={contract.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{formatContractId(contract.id)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img
                          src={contract.freelancer.avatar}
                          alt={contract.freelancer.name}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{contract.freelancer.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{contract.freelancer.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{contract.project.title}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm text-gray-900 dark:text-white">Start: {formatDate(contract.startDate)}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">End: {formatDate(contract.endDate)}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(contract.rate)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(contract.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => handleDownloadPDF(contract.id, contract.title, contract.template?.pdfTitle)}
                          className="p-1.5 text-gray-500 hover:text-green-500 dark:text-gray-400 dark:hover:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg"
                        >
                          <Download size={16} />
                        </button>
                        <button 
                          onClick={() => navigate(`/admin/contracts/edit/${contract.id}`)}
                          className="p-1.5 text-gray-500 hover:text-yellow-500 dark:text-gray-400 dark:hover:text-yellow-400 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => openDeleteModal(contract)}
                          className="p-1.5 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                      <Filter size={48} className="mb-2 opacity-50" />
                      <p className="text-lg font-medium">No contracts found</p>
                      <p className="text-sm">Try adjusting your search filters</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}