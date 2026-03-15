import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { assets } from '../assets/assets';
import {
  BoxCubeIcon,
  ChevronDownIcon,
  HorizontaLDots,
  PieChartIcon,
  PlugInIcon,
} from "../icons";
import { useSidebar } from "../context/SidebarContext";
import {
  ChartBarIcon,
  UsersIcon,
  FolderKanbanIcon,
  CpuIcon,
  MessageSquareIcon,
  FileTextIcon,
  SettingsIcon,
  LayoutDashboardIcon,
  CalendarDaysIcon,
  CreditCardIcon,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

// =========================
// Static data for Admin
// =========================
const adminNavItems = [
  { icon: <ChartBarIcon />, name: "Reports & Analytics", path: "/admin/overview" },
  { icon: <UsersIcon />, name: "Freelancers Management", path: "/admin/freelancers" },
  { icon: <FolderKanbanIcon />, name: "Projects/Missions", path: "/admin/projects" },
  // { icon: <CpuIcon />, name: "IA-Matching", path: "/admin/ia-matching" },
  { icon: <MessageSquareIcon />, name: "Messaging", path: "/admin/messaging" },
  { icon: <FileTextIcon />, name: "Contracts & Invoices", path: "/admin/contracts" },
  { icon: <SettingsIcon />, name: "Settings", path: "/settings" },
];

const adminOthersItems = [
  // {
  //   icon: <PieChartIcon />,
  //   name: "Charts",
  //   subItems: [
  //     { name: "Line Chart", path: "/line-chart", pro: false },
  //     { name: "Bar Chart", path: "/bar-chart", pro: false },
  //   ],
  // },
  // {
  //   icon: <PlugInIcon />,
  //   name: "Authentication",
  //   subItems: [
  //     { name: "Sign In", path: "/signin", pro: false },
  //     { name: "Sign Up", path: "/signup", pro: false },
  //   ],
  // },
];

// =========================
// Static data for Freelancer
// =========================
const freelancerNavItems = [
  { 
    icon: <LayoutDashboardIcon />, 
    name: "Dashboard", 
    path: "/freelancer/overview" 
  },
  { 
    icon: <CalendarDaysIcon />, 
    name: "My Missions/Projects", 
    path: "/freelancer/missions" 
  },
  { 
    icon: <FileTextIcon />, 
    name: "My Documents", 
    path: "/freelancer/documents" 
  },
  { icon: <MessageSquareIcon />, 
    name: "Messaging", 
    path: "/freelancer/messaging" 
  },
  // { 
  //   icon: <CreditCardIcon />, 
  //   name: "Payments", 
  //   path: "/payments" 
  // },
];

const freelancerOthersItems = [
  // {
  //   icon: <BoxCubeIcon />,
  //   name: "Resources",
  //   subItems: [
  //     { name: "Tutorials", path: "/tutorials", pro: false },
  //     { name: "Tools", path: "/tools", pro: false },
  //   ],
  // },
];

// =========================
// Component
// =========================
const AppSidebar = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const location = useLocation();
  const { currentUser } = useAuth();
  
  // Déterminer le rôle de l'utilisateur
  const userRole = currentUser?.role || 'FREELANCER';
  const navItems = userRole === "ADMIN" ? adminNavItems : freelancerNavItems;
  const othersItems = userRole === "ADMIN" ? adminOthersItems : freelancerOthersItems;

  const [openSubmenu, setOpenSubmenu] = useState(null);
  const [subMenuHeight, setSubMenuHeight] = useState({});
  const subMenuRefs = useRef({});

  const isActive = useCallback(
    (path) => location.pathname === path,
    [location.pathname]
  );

  useEffect(() => {
    let submenuMatched = false;
    ["main", "others"].forEach((menuType) => {
      const items = menuType === "main" ? navItems : othersItems;
      items.forEach((nav, index) => {
        nav.subItems?.forEach((subItem) => {
          if (isActive(subItem.path)) {
            setOpenSubmenu({ type: menuType, index });
            submenuMatched = true;
          }
        });
      });
    });
    if (!submenuMatched) setOpenSubmenu(null);
  }, [location, isActive, navItems, othersItems]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prev) => ({
          ...prev,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index, menuType) => {
    setOpenSubmenu((prev) =>
      prev?.type === menuType && prev?.index === index ? null : { type: menuType, index }
    );
  };

  const renderMenuItems = (items, menuType) => (
    <ul className="flex flex-col gap-4">
      {items.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`menu-item group ${
                openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? "menu-item-active"
                  : "menu-item-inactive"
              } ${!isExpanded && !isHovered ? "lg:justify-center" : "lg:justify-start"}`}
            >
              <span className={`menu-item-icon-size ${
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
                }`}>
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className="menu-item-text">{nav.name}</span>
              )}
              {(isExpanded || isHovered || isMobileOpen) && (
                <ChevronDownIcon
                  className={`ml-auto w-5 h-5 transition-transform ${
                    openSubmenu?.type === menuType && openSubmenu?.index === index
                      ? "rotate-180 text-brand-500"
                      : ""
                  }`}
                />
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                to={nav.path}
                className={`menu-item group ${
                  isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                }`}
              >
                <span className={`menu-item-icon-size ${
                    isActive(nav.path) ? "menu-item-icon-active" : "menu-item-icon-inactive"
                  }`}>
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text">{nav.name}</span>
                )}
              </Link>
            )
          )}
          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => (subMenuRefs.current[`${menuType}-${index}`] = el)}
              className="overflow-hidden transition-all"
              style={{
                height:
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? `${subMenuHeight[`${menuType}-${index}`]}px`
                    : "0px",
              }}
            >
              <ul className="mt-2 space-y-1 ml-9">
                {nav.subItems.map((subItem) => (
                  <li key={subItem.name}>
                    <Link
                      to={subItem.path}
                      className={`menu-dropdown-item ${
                        isActive(subItem.path)
                          ? "menu-dropdown-item-active"
                          : "menu-dropdown-item-inactive"
                      }`}
                    >
                      {subItem.name}
                      {(subItem.new || subItem.pro) && (
                        <span className="flex items-center gap-1 ml-auto">
                          {subItem.new && <span className="menu-dropdown-badge">new</span>}
                          {subItem.pro && <span className="menu-dropdown-badge">pro</span>}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 bg-white dark:bg-gray-900 h-screen transition-all border-r z-50
        ${isExpanded || isMobileOpen ? "w-[290px]" : isHovered ? "w-[290px]" : "w-[90px]"}
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Container cliquable pour le logo et le texte */}
      <Link 
        to="/" 
        className={`py-8 flex ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"} items-center space-x-3 group`}
      >
        {/* Logo Microsoft 3D */}
        <div className="relative">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg 
                        flex items-center justify-center shadow-lg transform group-hover:scale-110 
                        transition-all duration-300 rotate-3 group-hover:rotate-6
                        border-2 border-white/20 dark:border-gray-700/30">
            <span className="text-white font-bold text-xs">MNM</span>
          </div>
          {/* Effet 3D */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-lg 
                        transform -rotate-3 group-hover:-rotate-6 transition-all duration-300"></div>
          {/* Reflection shine */}
          <div className="absolute top-1 left-2 w-2 h-3 bg-white/30 rounded-full blur-sm 
                        transform group-hover:translate-x-1 transition-transform duration-300"></div>
        </div>
        
        {/* Texte Consulting avec changement de couleur selon le mode */}
        {(isExpanded || isHovered || isMobileOpen) && (
          <span className="font-bold text-xl text-gray-900 dark:text-white transition-colors duration-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">
            Consulting
          </span>
        )}
      </Link>
      
      <div className="flex flex-col overflow-y-auto no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2 className={`mb-4 text-xs uppercase flex text-gray-400 ${
                  !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
                }`}>
                {isExpanded || isHovered || isMobileOpen ? "Menu" : <HorizontaLDots className="size-6" />}
              </h2>
              {renderMenuItems(navItems, "main")}
            </div>
            <div>
              <h2 className={`mb-4 text-xs uppercase flex text-gray-400 ${
                  !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
                }`}>
                {isExpanded || isHovered || isMobileOpen ? "" : <HorizontaLDots />}
              </h2>
              {renderMenuItems(othersItems, "others")}
            </div>
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;