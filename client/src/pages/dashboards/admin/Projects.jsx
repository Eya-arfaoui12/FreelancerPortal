import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import ComponentCard from "../../../components/common/ComponentCard";
import PageMeta from "../../../components/common/PageMeta";
import FreelancersTable from "../../../components/features/admin_features/FreelancersTable";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import ProjectsTable from "../../../components/features/admin_features/ProjectsTable";
import { useState } from "react";
import { useAuth } from "../../../context/AuthContext";

export default function BasicTables() {
  const navigate = useNavigate();
  const { fetchAPI } = useAuth();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0); // État pour déclencher le rafraîchissement

  // Fonction pour ouvrir le modal de confirmation
  const handleDeleteClick = (project) => {
    setProjectToDelete(project);
    setShowDeleteModal(true);
    setDeleteError("");
  };

  // Fonction pour confirmer la suppression
  const confirmDelete = async () => {
    if (!projectToDelete) return;
    
    try {
      setIsDeleting(true);
      
      const response = await fetchAPI(`/projects/${projectToDelete.id}`, {
        method: 'DELETE',
      });

      if (response.success) {
        // Fermer le modal et réinitialiser l'état
        setShowDeleteModal(false);
        setProjectToDelete(null);
        
        // Déclencher le rafraîchissement de la liste des projets
        setRefreshTrigger(prev => prev + 1);
        
        // Optionnel: Afficher un message de succès
        console.log("✅ Project deleted successfully!");
      } else {
        throw new Error(response.error || "Error deleting project");
      }
    } catch (error) {
      console.error("Error deleting project:", error);
      setDeleteError(error.message || "Error deleting project");
    } finally {
      setIsDeleting(false);
    }
  };

  // Fonction pour annuler la suppression
  const cancelDelete = () => {
    setShowDeleteModal(false);
    setProjectToDelete(null);
    setDeleteError("");
  };

  return (
    <div className="space-y-6">
      <ComponentCard 
        title={
            <span className="text-xl font-semibold text-gray-800 dark:text-white tracking-tight">
            Projects List
            </span>
        }
        >

        {/* Bouton amélioré */}
        <div className="flex justify-end mb-4">
          <button
            onClick={() => navigate("/admin/add-project")}
            className="inline-flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 
                       hover:from-indigo-700 hover:to-purple-700 
                       text-white font-normal text-sm py-1.5 px-3.5 rounded-lg 
                       shadow-sm hover:shadow-md transition-all duration-300"
          >
            <Plus size={12} />
            Add Project
          </button>
        </div>

        {/* Passez la fonction handleDeleteClick ET refreshTrigger au composant ProjectsTable */}
        <ProjectsTable onDeleteClick={handleDeleteClick} refreshTrigger={refreshTrigger} />
      </ComponentCard>

      {/* Modal de confirmation de suppression */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Confirm Deletion
              </h3>
            </div>
            
            {/* Message d'erreur */}
            {deleteError && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
                {deleteError}
              </div>
            )}
            
            <div className="mb-6">
              <p className="text-gray-600 dark:text-gray-300">
                Are you sure you want to delete the project{" "}
                <span className="font-semibold text-gray-900 dark:text-white">
                  "{projectToDelete?.title}"
                </span>
                ? This action cannot be undone.
              </p>
              
              {projectToDelete?.assignedFreelancers && projectToDelete.assignedFreelancers.length > 0 && (
                <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    ⚠️ This project has {projectToDelete.assignedFreelancers.length} assigned freelancer(s). 
                    Deleting it will remove all associated data.
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={cancelDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 
                         hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg font-medium 
                         disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white 
                         rounded-lg font-medium disabled:opacity-50 
                         disabled:cursor-not-allowed transition-colors 
                         flex items-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Deleting...
                  </>
                ) : (
                  "Delete Project"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}