import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ProtectedRoute, PublicRoute } from "./components/common/ProtectedRoute";
import { ProfileUpdateProvider } from "./pages/dashboards/freelancer/FreelancerMissions"; // Import ProfileUpdateProvider
import HomePage from "./pages/HomePage";
import SsoCallback from "./pages/AuthPages/SsoCallback";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import VerifyEmail from "./pages/AuthPages/VerifyEmail";
import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/UserProfiles";
import Videos from "./pages/UiElements/Videos";
import Images from "./pages/UiElements/Images";
import Alerts from "./pages/UiElements/Alerts";
import Badges from "./pages/UiElements/Badges";
import Avatars from "./pages/UiElements/Avatars";
import Buttons from "./pages/UiElements/Buttons";
import LineChart from "./pages/Charts/LineChart";
import BarChart from "./pages/Charts/BarChart";
import Calendar from "./pages/Calendar";
import BasicTables from "./pages/Tables/BasicTables";
import FormElements from "./pages/Forms/FormElements";
import Blank from "./pages/Blank";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";
import AdminOverview from "./pages/dashboards/admin/Overview";
import AdminFreelancers from "./pages/dashboards/admin/Freelancers";
import AdminProjects from "./pages/dashboards/admin/Projects";
import AddProject from "./pages/dashboards/admin/AddProject";
import Contracts from "./pages/dashboards/admin/Contracts";
import TemplateSelectionPage from "./pages/dashboards/admin/TemplateSelectionPage";
import ContractFormPage from "./pages/dashboards/admin/ContractFormPage";
import IAmatching from "./pages/dashboards/admin/IAmatching";
import AddFreelancer from "./pages/dashboards/admin/AddFreelancer";
import ViewFreelancerProfile from "./pages/dashboards/admin/ViewFreelancerProfile";
import EditFreelancerProfile from "./pages/dashboards/admin/EditFreelancerProfile";
import EditContractPage from "./pages/dashboards/admin/EditContractPage";
import FreelancerMissions from "./pages/dashboards/freelancer/FreelancerMissions";
import MissionDetails from "./pages/dashboards/freelancer/MissionDetails";
import FreelancerDocuments from "./pages/dashboards/freelancer/FreelancerDocuments";
import SignContract from "./pages/dashboards/freelancer/SignContract";
import Overview from "./pages/dashboards/freelancer/Overview";
import EditProject from "./pages/dashboards/admin/EditProject";
import Messaging from "./pages/common/Messaging";
import EditPersonalProfile from "./pages/common/EditPersonalProfile";
import AdminProfile from "./pages/dashboards/admin/AdminProfile";

export default function App() {
  console.log('Rendu de App.jsx');
  return (
    <ProfileUpdateProvider> {/* Wrap Routes with ProfileUpdateProvider */}
      <ScrollToTop />
      <Routes>
        <Route path='/' element={<HomePage />} />
        <Route 
          path="/signin" 
          element={
            <PublicRoute>
              <SignIn />
            </PublicRoute>
          } 
        />
        <Route 
          path="/signup" 
          element={
            <PublicRoute>
              <SignUp />
            </PublicRoute>
          } 
        />
        <Route 
          path="/verify-email" 
          element={
            <PublicRoute>
              <VerifyEmail />
            </PublicRoute>
          } 
        />
        <Route path="/sso-callback" element={<SsoCallback />} />
        <Route 
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index path="/homeDashboard" element={<Home />} />
          <Route path="/profile" element={<UserProfiles />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/blank" element={<Blank />} />
          <Route path="/form-elements" element={<FormElements />} />
          <Route path="/basic-tables" element={<BasicTables />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/avatars" element={<Avatars />} />
          <Route path="/badge" element={<Badges />} />
          <Route path="/buttons" element={<Buttons />} />
          <Route path="/images" element={<Images />} />
          <Route path="/videos" element={<Videos />} />
          <Route path="/line-chart" element={<LineChart />} />
          <Route path="/bar-chart" element={<BarChart />} />
          <Route 
            path="/admin/overview" 
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminOverview />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/freelancers" 
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminFreelancers />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/ia-matching" 
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <IAmatching />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/messaging" 
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <Messaging />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/projects" 
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminProjects />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/add-project" 
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <AddProject />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/projects/edit/:id" 
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <EditProject />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/contracts" 
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <Contracts />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/add-contract" 
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <TemplateSelectionPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/contracts/edit/:id" 
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <EditContractPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/add-freelancer" 
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <AddFreelancer />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/freelancers/edit/:id" 
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <EditFreelancerProfile />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/freelancers/:id" 
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <ViewFreelancerProfile />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/profile" 
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminProfile />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/freelancers/edit/:id" 
            element={
              <ProtectedRoute requiredRole="FREELANCER">
                <EditPersonalProfile />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/add-contract/form" 
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <ContractFormPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/freelancer/overview" 
            element={
              <ProtectedRoute requiredRole="FREELANCER">
                <Overview />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/freelancer/missions" 
            element={
              <ProtectedRoute requiredRole="FREELANCER">
                <FreelancerMissions />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/freelancer/mission/:id" 
            element={
              <ProtectedRoute requiredRole="FREELANCER">
                <MissionDetails />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/freelancer/messaging" 
            element={
              <ProtectedRoute requiredRole="FREELANCER">
                <Messaging />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/freelancer/documents" 
            element={
              <ProtectedRoute requiredRole="FREELANCER">
                <FreelancerDocuments />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/freelancer/documents/sign-contract/:id" 
            element={
              <ProtectedRoute requiredRole="FREELANCER">
                <SignContract />
              </ProtectedRoute>
            } 
          />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </ProfileUpdateProvider>
  );
}