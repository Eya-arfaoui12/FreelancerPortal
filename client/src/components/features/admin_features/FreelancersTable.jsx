import { 
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../ui/table";
import Badge from "../../ui/badge/Badge";
import { useNavigate } from "react-router-dom";
import { MoreVertical, Ban, Trash2, CheckCircle } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import ConfirmModal from "../../ui/modal/ConfirmModal"; // Import du nouveau modal

export default function FreelancersTable() {
  const navigate = useNavigate();
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [freelancers, setFreelancers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    freelancerId: null,
    freelancerName: ""
  });
  const dropdownRef = useRef(null);
  
  const { fetchAPI } = useAuth();

  const fetchFreelancers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await fetchAPI('/freelancers');
      setFreelancers(data);
    } catch (err) {
      console.error('Error fetching freelancers:', err);
      setError('Failed to load freelancers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFreelancers();
  }, []);

  const toggleDropdown = (id) => {
    setOpenDropdownId(openDropdownId === id ? null : id);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      const dropdown = document.getElementById(`dropdown-${openDropdownId}`);
      if (dropdown && !dropdown.contains(event.target)) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openDropdownId]);

  // Fonction pour ouvrir le modal de suppression
  const openDeleteModal = (freelancerId, freelancerName) => {
    setDeleteModal({
      isOpen: true,
      freelancerId,
      freelancerName
    });
    setOpenDropdownId(null); // Fermer le dropdown
  };

  // Fonction pour fermer le modal
  const closeDeleteModal = () => {
    setDeleteModal({
      isOpen: false,
      freelancerId: null,
      freelancerName: ""
    });
  };

  // Fonction pour bloquer/débloquer un freelancer
  const handleBlockFreelancer = async (freelancerId, currentStatus) => {
    try {
      setActionLoading(freelancerId);
      
      await fetchAPI(`/freelancers/${freelancerId}/block`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      
      // Mettre à jour l'état local
      setFreelancers(prev => prev.map(f => 
        f.id === freelancerId ? { ...f, isActive: !currentStatus } : f
      ));
      
      setOpenDropdownId(null);
    } catch (err) {
      console.error('Error blocking freelancer:', err);
      setError('Failed to update freelancer status');
    } finally {
      setActionLoading(null);
    }
  };

  // Fonction pour supprimer un freelancer
  const handleDeleteFreelancer = async () => {
    const { freelancerId } = deleteModal;
    
    try {
      setActionLoading(freelancerId);
      
      await fetchAPI(`/freelancers/${freelancerId}`, {
        method: 'DELETE',
      });
      
      // Supprimer de l'état local
      setFreelancers(prev => prev.filter(f => f.id !== freelancerId));
      
      // Fermer le modal
      closeDeleteModal();
    } catch (err) {
      console.error('Error deleting freelancer:', err);
      setError('Failed to delete freelancer: ' + (err.message || 'Unknown error'));
    } finally {
      setActionLoading(null);
    }
  };

  const generateAvatar = (firstName, lastName, avatar) => {
    if (avatar) {
      return (
        <img 
          src={avatar} 
          alt={`${firstName} ${lastName}`} 
          className="w-10 h-10 rounded-full object-cover" 
        />
      );
    }

    const initials = `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 
      'bg-red-500', 'bg-yellow-500', 'bg-indigo-500', 'bg-teal-500'
    ];
    const colorIndex = (firstName + lastName).length % colors.length;

    return (
      <div className={`flex items-center justify-center w-10 h-10 rounded-full ${colors[colorIndex]} text-white font-semibold text-sm`}>
        {initials}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-red-500 text-center">
          <p>{error}</p>
          <button
            onClick={fetchFreelancers}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (freelancers.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500 text-center">
          <p>No freelancers found</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell isHeader className="px-5 py-3 font-semibold text-gray-600 text-start text-xs dark:text-gray-400">ID</TableCell>
                <TableCell isHeader className="px-5 py-3 font-semibold text-gray-600 text-start text-xs dark:text-gray-400">Freelancer</TableCell>
                <TableCell isHeader className="px-5 py-3 font-semibold text-gray-600 text-start text-xs dark:text-gray-400">Email</TableCell>
                <TableCell isHeader className="px-5 py-3 font-semibold text-gray-600 text-start text-xs dark:text-gray-400">Rating</TableCell>
                <TableCell isHeader className="px-5 py-3 font-semibold text-gray-600 text-start text-xs dark:text-gray-400">Status</TableCell>
                <TableCell isHeader className="px-5 py-3 font-semibold text-gray-600 text-start text-xs dark:text-gray-400">Assigned</TableCell>
                <TableCell isHeader className="px-5 py-3 font-semibold text-gray-600 text-start text-xs dark:text-gray-400">Profile</TableCell>
                <TableCell isHeader className="px-5 py-3 font-semibold text-gray-600 text-start text-xs dark:text-gray-400">Actions</TableCell>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {freelancers.map((freelancer, index) => (
                <TableRow key={freelancer.id}>
                  <TableCell className="px-5 py-4 text-gray-700 text-sm dark:text-white/90">{index + 1}</TableCell>

                  <TableCell className="px-5 py-4 sm:px-6 text-start">
                    <div className="flex items-center gap-3">
                      {generateAvatar(freelancer.firstName, freelancer.lastName, freelancer.avatar)}
                      <div>
                        <span className="block font-medium text-gray-800 text-sm dark:text-white/90">
                          {freelancer.freelancer || `${freelancer.firstName} ${freelancer.lastName}`}
                        </span>
                        <span className="block text-gray-500 text-xs dark:text-gray-400">
                          Freelancer
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="px-4 py-3 text-gray-500 text-sm dark:text-gray-400">
                    {freelancer.email}
                  </TableCell>
                  
                  <TableCell className="px-4 py-3 text-gray-500 text-sm dark:text-gray-400">
                    ⭐ {freelancer.rating}
                  </TableCell>
                  
                  <TableCell className="px-5 py-4 text-start">
                    <Badge 
                      size="sm" 
                      color={freelancer.isActive === false ? "error" : "success"}
                    >
                      {freelancer.isActive === false ? "Blocked" : "Active"}
                    </Badge>
                  </TableCell>
                  
                  <TableCell className="px-5 py-4 text-start">
                    <Badge 
                      size="sm" 
                      color={freelancer.assigned === "Yes" ? "success" : "error"}
                    >
                      {freelancer.assigned}
                    </Badge>
                  </TableCell>

                  <TableCell className="px-5 py-4 text-start">
                    <button
                      onClick={() => navigate(`/admin/freelancers/${freelancer.id}`)}
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-medium py-1.5 px-4 rounded-lg shadow-md hover:shadow-lg transition-all"
                    >
                      View Profile
                    </button>
                  </TableCell>

                  <TableCell className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => toggleDropdown(freelancer.id)}
                      className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                      disabled={actionLoading === freelancer.id}
                    >
                      {actionLoading === freelancer.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                      ) : (
                        <MoreVertical className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                      )}
                    </button>

                    {openDropdownId === freelancer.id && (
                      <div
                        id={`dropdown-${freelancer.id}`}
                        className="absolute right-12 mt-2 w-40 origin-top-right rounded-lg bg-white dark:bg-gray-900 shadow-lg ring-1 ring-black/5 z-10"
                      >
                        <div className="py-1 text-sm text-gray-700 dark:text-gray-300">
                          <button 
                            onClick={() => handleBlockFreelancer(freelancer.id, freelancer.isActive)}
                            className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-800"
                          >
                            {freelancer.isActive === false ? (
                              <>
                                <CheckCircle size={16} className="mr-2 text-green-600" />
                                Unblock
                              </>
                            ) : (
                              <>
                                <Ban size={16} className="mr-2 text-orange-600" />
                                Block
                              </>
                            )}
                          </button>
                          <button 
                            onClick={() => openDeleteModal(freelancer.id, `${freelancer.firstName} ${freelancer.lastName}`)}
                            className="flex items-center w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 dark:hover:bg-gray-800"
                          >
                            <Trash2 size={16} className="mr-2" />
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Modal de confirmation de suppression */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteFreelancer}
        title="Delete Freelancer"
        description={
          <div className="space-y-2">
            <p className="text-gray-600 dark:text-gray-300">
              Are you sure you want to delete <span className="font-semibold text-gray-900 dark:text-white">{deleteModal.freelancerName}</span>?
            </p>
            <p className="text-red-600 dark:text-red-400 text-xs">
              ⚠️ This action cannot be undone. All associated data will be permanently removed.
            </p>
          </div>
        }
        confirmText={actionLoading === deleteModal.freelancerId ? "Deleting..." : "Delete"}
        cancelText="Cancel"
        variant="danger"
      />
    </>
  );
}