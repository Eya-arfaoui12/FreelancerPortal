import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import ComponentCard from "../../../components/common/ComponentCard";
import PageMeta from "../../../components/common/PageMeta";
import FreelancersTable from "../../../components/features/admin_features/FreelancersTable";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";

export default function BasicTables() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <ComponentCard 
        title={
            <span className="text-xl font-semibold text-gray-800 dark:text-white tracking-tight">
            Freelancers List
            </span>
        }
        >

        {/* Bouton amélioré */}
        <div className="flex justify-end mb-4">
          <button
            onClick={() => navigate("/admin/add-freelancer")}
            className="inline-flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 
                       hover:from-indigo-700 hover:to-purple-700 
                       text-white font-normal text-sm py-1.5 px-3.5 rounded-lg 
                       shadow-sm hover:shadow-md transition-all duration-300"
          >
            <Plus size={12} />
            Add Freelancer
          </button>
        </div>

        <FreelancersTable />
      </ComponentCard>
    </div>
  );
}
