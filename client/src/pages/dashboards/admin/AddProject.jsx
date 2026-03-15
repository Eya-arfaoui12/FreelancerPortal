import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Label from "../../../components/form/Label";
import Input from "../../../components/form/input/InputField";
import TextArea from "../../../components/form/input/TextArea";
import SelectSkills from "../../../components/form/SelectSkills";
import { 
  Brain, 
  PlusCircle, 
  ArrowLeft, 
  Users, 
  Star, 
  Clock, 
  DollarSign, 
  Award, 
  X,
  CheckCircle,
  Mail,
  AlertCircle,
  Upload,
  FileText,
  Trash2,
  Info,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Send,
  UserCheck
} from "lucide-react";
import SelectSkillsWithSearch from "../admin/SelectSkillsWithSearch";
import { useAuth } from "../../../context/AuthContext";

export default function AddProject() {
  // States for project data
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [skills, setSkills] = useState([]);
  const [budget, setBudget] = useState("");
  const [duration, setDuration] = useState("");
  const [requirements, setRequirements] = useState("");
  const [deadline, setDeadline] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  
  // States for matching
  const [isMatching, setIsMatching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [matches, setMatches] = useState([]);
  const [showMatches, setShowMatches] = useState(false);
  const [createdProjectId, setCreatedProjectId] = useState(null);
  const [selectedFreelancers, setSelectedFreelancers] = useState([]);
  const [matchingError, setMatchingError] = useState("");
  
  // States for custom alerts
  const [alerts, setAlerts] = useState([]);
  
  // State for confirmation modal
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  
  const navigate = useNavigate();
  const { fetchAPI } = useAuth();

  // Fonction pour ajouter une alerte personnalisée
  const showAlert = (message, type = "info", duration = 5000) => {
    const id = Date.now() + Math.random();
    const newAlert = { id, message, type, duration };
    
    setAlerts(prev => [...prev, newAlert]);
    
    if (duration > 0) {
      setTimeout(() => {
        removeAlert(id);
      }, duration);
    }
    
    return id;
  };

  // Fonction pour supprimer une alerte
  const removeAlert = (id) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  };

  // Fonction pour les alertes de succès
  const showSuccess = (message, duration = 5000) => {
    return showAlert(message, "success", duration);
  };

  // Fonction pour les alertes d'erreur
  const showError = (message, duration = 7000) => {
    return showAlert(message, "error", duration);
  };

  // Fonction pour les alertes d'avertissement
  const showWarning = (message, duration = 6000) => {
    return showAlert(message, "warning", duration);
  };

  // Fonction pour les alertes d'information
  const showInfo = (message, duration = 5000) => {
    return showAlert(message, "info", duration);
  };

  // Composant d'alerte personnalisée
  const CustomAlert = ({ alert }) => {
    const { id, message, type } = alert;
    
    const alertConfig = {
      success: {
        icon: CheckCircle2,
        bgColor: "bg-green-50 border-green-200",
        textColor: "text-green-800",
        iconColor: "text-green-600",
        buttonColor: "text-green-600 hover:bg-green-100"
      },
      error: {
        icon: XCircle,
        bgColor: "bg-red-50 border-red-200",
        textColor: "text-red-800",
        iconColor: "text-red-600",
        buttonColor: "text-red-600 hover:bg-red-100"
      },
      warning: {
        icon: AlertTriangle,
        bgColor: "bg-yellow-50 border-yellow-200",
        textColor: "text-yellow-800",
        iconColor: "text-yellow-600",
        buttonColor: "text-yellow-600 hover:bg-yellow-100"
      },
      info: {
        icon: Info,
        bgColor: "bg-blue-50 border-blue-200",
        textColor: "text-blue-800",
        iconColor: "text-blue-600",
        buttonColor: "text-blue-600 hover:bg-blue-100"
      }
    };

    const config = alertConfig[type] || alertConfig.info;
    const IconComponent = config.icon;

    return (
      <div className={`flex items-start gap-3 p-4 rounded-lg border ${config.bgColor} shadow-lg animate-in slide-in-from-right-8 duration-300`}>
        <IconComponent size={20} className={`mt-0.5 flex-shrink-0 ${config.iconColor}`} />
        <div className={`flex-1 text-sm ${config.textColor}`}>{message}</div>
        <button
          onClick={() => removeAlert(id)}
          className={`p-1 rounded-full transition-colors ${config.buttonColor}`}
        >
          <X size={16} />
        </button>
      </div>
    );
  };

  // Container pour les alertes
  const AlertContainer = () => (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-md">
      {alerts.map(alert => (
        <CustomAlert key={alert.id} alert={alert} />
      ))}
    </div>
  );

  // Composant de modal de confirmation personnalisé
  const ConfirmationModal = () => {
    if (!showConfirmationModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300 scale-100">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                <Send size={24} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Send Proposals
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Confirm your selection
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <UserCheck size={20} className="text-blue-600 dark:text-blue-400" />
              <div>
                <p className="font-medium text-blue-900 dark:text-blue-100">
                  {selectedFreelancers.length} freelancer{selectedFreelancers.length > 1 ? 's' : ''} selected
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  They will receive project proposals
                </p>
              </div>
            </div>

            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Are you sure you want to send project proposals to the selected freelancers? 
              This action will notify them about your project and they'll be able to submit their applications.
            </p>

            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong>Project:</strong> {title || "Untitled Project"}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                <strong>Budget:</strong> {budget ? `$${budget}` : "Not specified"}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setShowConfirmationModal(false)}
              disabled={isAssigning}
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 
                       bg-white dark:bg-gray-700 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-600 
                       transition-colors duration-200 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmAssignment}
              disabled={isAssigning}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 
                       text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50 
                       flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
            >
              {isAssigning ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send size={18} />
                  Send Proposals
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Available skills options
  const skillOptions = [
  // Frontend Technologies
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "react", label: "React" },
  { value: "vue", label: "Vue.js" },
  { value: "angular", label: "Angular" },
  { value: "nextjs", label: "Next.js" },
  { value: "nuxtjs", label: "Nuxt.js" },
  { value: "svelte", label: "Svelte" },
  { value: "html", label: "HTML/CSS" },
  { value: "sass", label: "Sass/SCSS" },
  { value: "tailwind", label: "Tailwind CSS" },
  { value: "bootstrap", label: "Bootstrap" },
  { value: "jquery", label: "jQuery" },
  { value: "webpack", label: "Webpack" },
  { value: "vite", label: "Vite" },

  // Backend Technologies
  { value: "node", label: "Node.js" },
  { value: "express", label: "Express.js" },
  { value: "nestjs", label: "NestJS" },
  { value: "python", label: "Python" },
  { value: "django", label: "Django" },
  { value: "flask", label: "Flask" },
  { value: "fastapi", label: "FastAPI" },
  { value: "php", label: "PHP" },
  { value: "laravel", label: "Laravel" },
  { value: "symfony", label: "Symfony" },
  { value: "java", label: "Java" },
  { value: "spring", label: "Spring Boot" },
  { value: "ruby", label: "Ruby" },
  { value: "rails", label: "Ruby on Rails" },
  { value: "go", label: "Go/Golang" },
  { value: "rust", label: "Rust" },
  { value: "kotlin", label: "Kotlin" },
  { value: "scala", label: "Scala" },

  // Microsoft .NET Stack
  { value: "csharp", label: "C#" },
  { value: "dotnet", label: ".NET Core" },
  { value: "aspnet", label: "ASP.NET Core" },
  { value: "blazor", label: "Blazor" },
  { value: "maui", label: ".NET MAUI" },
  { value: "wpf", label: "WPF" },
  { value: "winforms", label: "WinForms" },
  { value: "entityframework", label: "Entity Framework" },
  { value: "xamarin", label: "Xamarin" },

  // Microsoft Azure Cloud
  { value: "azure", label: "Microsoft Azure" },
  { value: "azure-devops", label: "Azure DevOps" },
  { value: "azure-functions", label: "Azure Functions" },
  { value: "azure-storage", label: "Azure Storage" },
  { value: "azure-sql", label: "Azure SQL Database" },
  { value: "azure-cosmos", label: "Azure Cosmos DB" },
  { value: "azure-kubernetes", label: "Azure Kubernetes Service (AKS)" },
  { value: "azure-vm", label: "Azure Virtual Machines" },
  { value: "azure-app-service", label: "Azure App Service" },
  { value: "azure-logic-apps", label: "Azure Logic Apps" },
  { value: "azure-api-management", label: "Azure API Management" },
  { value: "azure-service-bus", label: "Azure Service Bus" },
  { value: "azure-event-grid", label: "Azure Event Grid" },
  { value: "azure-ad", label: "Azure Active Directory" },
  { value: "azure-sentinel", label: "Azure Sentinel" },
  { value: "azure-defender", label: "Azure Defender" },

  // Microsoft 365 & Productivity
  { value: "microsoft-365", label: "Microsoft 365" },
  { value: "sharepoint", label: "SharePoint" },
  { value: "sharepoint-online", label: "SharePoint Online" },
  { value: "power-apps", label: "Power Apps" },
  { value: "power-automate", label: "Power Automate" },
  { value: "power-bi", label: "Power BI" },
  { value: "power-pages", label: "Power Pages" },
  { value: "power-virtual-agents", label: "Power Virtual Agents" },
  { value: "microsoft-teams", label: "Microsoft Teams" },
  { value: "exchange-server", label: "Exchange Server" },
  { value: "onedrive", label: "OneDrive" },
  { value: "microsoft-graph", label: "Microsoft Graph API" },

  // Microsoft Data & Analytics
  { value: "sql-server", label: "SQL Server" },
  { value: "tsql", label: "T-SQL" },
  { value: "ssis", label: "SSIS" },
  { value: "ssrs", label: "SSRS" },
  { value: "ssas", label: "SSAS" },
  { value: "azure-synapse", label: "Azure Synapse Analytics" },
  { value: "azure-data-factory", label: "Azure Data Factory" },
  { value: "microsoft-fabric", label: "Microsoft Fabric" },
  { value: "dax", label: "DAX (Power BI)" },
  { value: "power-query", label: "Power Query" },

  // Microsoft Dynamics
  { value: "dynamics-365", label: "Dynamics 365" },
  { value: "dynamics-crm", label: "Dynamics CRM" },
  { value: "dynamics-finance", label: "Dynamics 365 Finance" },
  { value: "dynamics-bc", label: "Dynamics 365 Business Central" },
  { value: "dynamics-sales", label: "Dynamics 365 Sales" },

  // Microsoft AI & Machine Learning
  { value: "azure-ai", label: "Azure AI Services" },
  { value: "azure-openai", label: "Azure OpenAI" },
  { value: "azure-ml", label: "Azure Machine Learning" },
  { value: "cognitive-services", label: "Azure Cognitive Services" },
  { value: "azure-bot-service", label: "Azure Bot Service" },

  // Microsoft Security & Infrastructure
  { value: "intune", label: "Microsoft Intune" },
  { value: "sccm", label: "SCCM/MECM" },
  { value: "active-directory", label: "Active Directory" },
  { value: "windows-server", label: "Windows Server" },
  { value: "hyper-v", label: "Hyper-V" },
  { value: "powershell", label: "PowerShell" },

  // Databases
  { value: "sql", label: "SQL" },
  { value: "mysql", label: "MySQL" },
  { value: "postgresql", label: "PostgreSQL" },
  { value: "mongodb", label: "MongoDB" },
  { value: "redis", label: "Redis" },
  { value: "cassandra", label: "Cassandra" },
  { value: "elasticsearch", label: "Elasticsearch" },
  { value: "oracle", label: "Oracle Database" },
  { value: "mariadb", label: "MariaDB" },
  { value: "dynamodb", label: "DynamoDB" },
  { value: "neo4j", label: "Neo4j" },
  { value: "firebase", label: "Firebase" },

  // Mobile Development
  { value: "react-native", label: "React Native" },
  { value: "flutter", label: "Flutter" },
  { value: "swift", label: "Swift" },
  { value: "swiftui", label: "SwiftUI" },
  { value: "kotlin-android", label: "Kotlin (Android)" },
  { value: "jetpack-compose", label: "Jetpack Compose" },
  { value: "ionic", label: "Ionic" },
  { value: "capacitor", label: "Capacitor" },
  { value: "cordova", label: "Apache Cordova" },

  // Cloud Platforms
  { value: "aws", label: "AWS" },
  { value: "aws-lambda", label: "AWS Lambda" },
  { value: "aws-ec2", label: "AWS EC2" },
  { value: "aws-s3", label: "AWS S3" },
  { value: "gcp", label: "Google Cloud Platform" },
  { value: "firebase-cloud", label: "Firebase Cloud" },
  { value: "heroku", label: "Heroku" },
  { value: "digitalocean", label: "DigitalOcean" },
  { value: "vercel", label: "Vercel" },
  { value: "netlify", label: "Netlify" },

  // DevOps & CI/CD
  { value: "docker", label: "Docker" },
  { value: "kubernetes", label: "Kubernetes" },
  { value: "jenkins", label: "Jenkins" },
  { value: "gitlab-ci", label: "GitLab CI/CD" },
  { value: "github-actions", label: "GitHub Actions" },
  { value: "terraform", label: "Terraform" },
  { value: "ansible", label: "Ansible" },
  { value: "chef", label: "Chef" },
  { value: "puppet", label: "Puppet" },
  { value: "circleci", label: "CircleCI" },
  { value: "travis-ci", label: "Travis CI" },

  // Design & UI/UX
  { value: "figma", label: "Figma" },
  { value: "adobe-xd", label: "Adobe XD" },
  { value: "sketch", label: "Sketch" },
  { value: "photoshop", label: "Photoshop" },
  { value: "illustrator", label: "Illustrator" },
  { value: "indesign", label: "InDesign" },
  { value: "after-effects", label: "After Effects" },
  { value: "premiere-pro", label: "Premiere Pro" },
  { value: "blender", label: "Blender" },
  { value: "framer", label: "Framer" },
  { value: "webflow", label: "Webflow" },

  // Testing & QA
  { value: "jest", label: "Jest" },
  { value: "mocha", label: "Mocha" },
  { value: "cypress", label: "Cypress" },
  { value: "playwright", label: "Playwright" },
  { value: "selenium", label: "Selenium" },
  { value: "puppeteer", label: "Puppeteer" },
  { value: "junit", label: "JUnit" },
  { value: "pytest", label: "PyTest" },
  { value: "postman", label: "Postman" },

  // API & Integration
  { value: "rest-api", label: "REST API" },
  { value: "graphql", label: "GraphQL" },
  { value: "grpc", label: "gRPC" },
  { value: "soap", label: "SOAP" },
  { value: "websocket", label: "WebSocket" },
  { value: "oauth", label: "OAuth" },
  { value: "jwt", label: "JWT" },

  // Game Development
  { value: "unity", label: "Unity" },
  { value: "unreal-engine", label: "Unreal Engine" },
  { value: "godot", label: "Godot" },
  { value: "threejs", label: "Three.js" },
  { value: "webgl", label: "WebGL" },

  // Data Science & AI
  { value: "machine-learning", label: "Machine Learning" },
  { value: "deep-learning", label: "Deep Learning" },
  { value: "tensorflow", label: "TensorFlow" },
  { value: "pytorch", label: "PyTorch" },
  { value: "keras", label: "Keras" },
  { value: "scikit-learn", label: "Scikit-learn" },
  { value: "pandas", label: "Pandas" },
  { value: "numpy", label: "NumPy" },
  { value: "opencv", label: "OpenCV" },
  { value: "nlp", label: "Natural Language Processing" },
  { value: "computer-vision", label: "Computer Vision" },

  // Blockchain & Web3
  { value: "solidity", label: "Solidity" },
  { value: "ethereum", label: "Ethereum" },
  { value: "web3js", label: "Web3.js" },
  { value: "smart-contracts", label: "Smart Contracts" },
  { value: "nft", label: "NFT Development" },

  // CMS & E-commerce
  { value: "wordpress", label: "WordPress" },
  { value: "woocommerce", label: "WooCommerce" },
  { value: "shopify", label: "Shopify" },
  { value: "magento", label: "Magento" },
  { value: "drupal", label: "Drupal" },
  { value: "contentful", label: "Contentful" },
  { value: "strapi", label: "Strapi" },
  { value: "sanity", label: "Sanity" },

  // Version Control
  { value: "git", label: "Git" },
  { value: "github", label: "GitHub" },
  { value: "gitlab", label: "GitLab" },
  { value: "bitbucket", label: "Bitbucket" },
  { value: "svn", label: "SVN" },

  // Monitoring & Logging
  { value: "prometheus", label: "Prometheus" },
  { value: "grafana", label: "Grafana" },
  { value: "elk-stack", label: "ELK Stack" },
  { value: "splunk", label: "Splunk" },
  { value: "datadog", label: "Datadog" },
  { value: "new-relic", label: "New Relic" },

  // Message Queues & Streaming
  { value: "kafka", label: "Apache Kafka" },
  { value: "rabbitmq", label: "RabbitMQ" },
  { value: "redis-queue", label: "Redis Queue" },
  { value: "apache-flink", label: "Apache Flink" },
  { value: "apache-spark", label: "Apache Spark" },

  // Methodologies & Practices
  { value: "agile", label: "Agile" },
  { value: "scrum", label: "Scrum" },
  { value: "kanban", label: "Kanban" },
  { value: "tdd", label: "Test-Driven Development" },
  { value: "ci-cd", label: "CI/CD" },
  { value: "microservices", label: "Microservices" },
  { value: "serverless", label: "Serverless Architecture" },
  { value: "ddd", label: "Domain-Driven Design" },
];

  // File handling functions
  const handleFileSelect = (files) => {
    const newFiles = Array.from(files);
    const validFiles = [];
    const errors = [];

    newFiles.forEach(file => {
      if (file.size > 10 * 1024 * 1024) {
        errors.push(`${file.name}: File too large (max 10MB)`);
        return;
      }

      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'text/plain',
        'application/zip',
        'application/x-zip-compressed'
      ];

      if (!allowedTypes.includes(file.type)) {
        errors.push(`${file.name}: File type not allowed`);
        return;
      }

      validFiles.push(file);
    });

    if (errors.length > 0) {
      showError(`File validation errors:\n${errors.join("\n")}`);
    }

    const currentFileCount = selectedFiles.length;
    const remainingSlots = 5 - currentFileCount;
    const filesToAdd = validFiles.slice(0, remainingSlots);

    if (validFiles.length > remainingSlots) {
      showWarning(`Only ${remainingSlots} more file(s) can be added (maximum 5 files total)`);
    }

    setSelectedFiles(prev => [...prev, ...filesToAdd]);
    
    if (filesToAdd.length > 0) {
      showSuccess(`${filesToAdd.length} file(s) added successfully`);
    }
  };

  const handleRemoveFile = (index) => {
    setSelectedFiles(prev => {
      const removedFile = prev[index];
      const newFiles = prev.filter((_, i) => i !== index);
      showInfo(`File "${removedFile.name}" removed`);
      return newFiles;
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type) => {
    if (type.includes('image')) return '🖼️';
    if (type.includes('pdf')) return '📄';
    if (type.includes('word') || type.includes('document')) return '📝';
    if (type.includes('excel') || type.includes('sheet')) return '📊';
    if (type.includes('zip')) return '🗜️';
    return '📎';
  };

  // Upload files to project
  const uploadProjectFiles = async (projectId) => {
    if (selectedFiles.length === 0) {
      return { success: true, data: [] };
    }

    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append('files', file);
      });

      const response = await fetchAPI(`/projects/${projectId}/attachments`, {
        method: 'POST',
        body: formData,
      });

      return response;
    } catch (error) {
      console.error('File upload error:', error);
      throw error;
    }
  };

  // Project data validation
  const validateProjectData = () => {
    const errors = [];
    
    if (!title.trim()) {
      errors.push("Title is required");
    } else if (title.trim().length < 5) {
      errors.push("Title must be at least 5 characters long");
    }
    
    if (!description.trim()) {
      errors.push("Description is required");
    } else if (description.trim().length < 20) {
      errors.push("Description must be at least 20 characters long");
    }
    
    if (budget) {
      const budgetNum = parseFloat(budget);
      if (isNaN(budgetNum) || budgetNum <= 0) {
        errors.push("Budget must be a positive number");
      } else if (budgetNum < 50) {
        errors.push("Minimum budget is $50");
      }
    }
    
    if (duration) {
      const durationNum = parseInt(duration);
      if (isNaN(durationNum) || durationNum <= 0) {
        errors.push("Duration must be a positive integer");
      } else if (durationNum > 365) {
        errors.push("Duration cannot exceed 365 days");
      }
    }
    
    if (deadline) {
      const deadlineDate = new Date(deadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (isNaN(deadlineDate.getTime())) {
        errors.push("Invalid date format");
      } else if (deadlineDate <= today) {
        errors.push("Deadline must be in the future");
      }
    }
    
    return errors;
  };

  // Function to run AI matching
  const handleRunMatching = async () => {
    const errors = validateProjectData();
    if (errors.length > 0) {
      showError(`Validation errors:\n${errors.join("\n")}`);
      return;
    }

    setIsMatching(true);
    setMatchingError("");
    
    try {
      showInfo("Starting AI matching process...", 3000);

      const skillsArray = Array.isArray(skills) ? skills.map(skill => {
        if (typeof skill === 'object' && skill !== null) {
          return skill.value || skill.name || skill.label || String(skill);
        }
        return String(skill);
      }).filter(skill => skill && skill !== '') : [];

      const projectResponse = await fetchAPI('/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          budget: budget ? parseFloat(budget) : null,
          duration: duration ? parseInt(duration) : null,
          skills: skillsArray,
          requirements: requirements.split('\n').filter(req => req.trim()),
          deadline: deadline || null
        })
      });

      if (!projectResponse.success) {
        throw new Error(projectResponse.error || "Error creating project");
      }

      const projectId = projectResponse.data.id;
      setCreatedProjectId(projectId);

      const matchResponse = await fetchAPI(`/match-project/${projectId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (Array.isArray(matchResponse)) {
        setMatches(matchResponse);
        setShowMatches(true);
        
        if (selectedFiles.length > 0) {
          try {
            const uploadResponse = await uploadProjectFiles(projectId);
            if (uploadResponse.success) {
              showSuccess("Files uploaded successfully!");
            } else {
              showWarning("Project created and matched but some files failed to upload: " + uploadResponse.error);
            }
          } catch (uploadError) {
            showWarning("Project created and matched but file upload failed: " + uploadError.message);
          }
        }
        
        if (matchResponse.length === 0) {
          showInfo("No matching freelancers found for this project. The project has been created successfully.");
        } else {
          showSuccess(`Found ${matchResponse.length} matching freelancer${matchResponse.length > 1 ? 's' : ''}!`);
        }
      } else if (matchResponse.success === false) {
        const errorMsg = matchResponse.message || matchResponse.error || "AI matching error";
        throw new Error(errorMsg);
      } else {
        setMatches([]);
        setShowMatches(true);
        showWarning("Matching encountered an issue, but the project was created successfully.");
      }

    } catch (error) {
      console.error('Matching error:', error);
      setMatchingError(error.message);
      
      if (error.message.includes("Token") || error.message.includes("401")) {
        showError("Session expired. Please log in again.");
      } else if (error.message.includes("timeout") || error.message.includes("Timeout")) {
        showWarning("Matching service took too long to respond. The project has been created, you can try matching later.");
      } else {
        showError("Matching error: " + error.message);
      }
    } finally {
      setIsMatching(false);
    }
  };

  // Function to show confirmation modal
  const handleAssignFreelancers = () => {
    if (selectedFreelancers.length === 0) {
      showWarning("Please select at least one freelancer");
      return;
    }

    if (!createdProjectId) {
      showError("Error: Project ID not found");
      return;
    }

    setShowConfirmationModal(true);
  };

  // Function to confirm assignment after modal confirmation
  const handleConfirmAssignment = async () => {
    setIsAssigning(true);

    try {
      showInfo(`Sending proposals to ${selectedFreelancers.length} freelancer${selectedFreelancers.length > 1 ? 's' : ''}...`);

      const assignmentPromises = selectedFreelancers.map(async (freelancerId) => {
        try {
          const response = await fetchAPI('/proposals', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              projectId: createdProjectId,
              freelancerId: freelancerId,
              status: 'PENDING',
              coverLetter: `Automated proposal generated by AI matching system for project: ${title}`,
              estimatedTime: duration ? parseInt(duration) : 7
            })
          });
          
          return { freelancerId, success: response.success, error: response.error };
        } catch (error) {
          return { freelancerId, success: false, error: error.message };
        }
      });

      const results = await Promise.all(assignmentPromises);
      
      const successes = results.filter(r => r.success);
      const failures = results.filter(r => !r.success);
      
      if (failures.length === 0) {
        showSuccess(`All ${successes.length} freelancer${successes.length > 1 ? 's' : ''} assigned successfully!`);
      } else if (successes.length > 0) {
        showWarning(`${successes.length}/${selectedFreelancers.length} freelancers assigned successfully. ${failures.length} failed.`);
        console.error('Assignment failures:', failures);
      } else {
        showError("No freelancers could be assigned. Please try again.");
        console.error('All assignments failed:', failures);
        return;
      }
      
      // Close modal and redirect
      setShowConfirmationModal(false);
      
      // Redirection après un délai pour voir le message de succès
      setTimeout(() => {
        navigate("/admin/projects");
      }, 2000);

    } catch (error) {
      console.error('Assignment error:', error);
      showError("Error assigning freelancers: " + error.message);
      setShowConfirmationModal(false);
    } finally {
      setIsAssigning(false);
    }
  };

  // Function to toggle freelancer selection
  const handleToggleFreelancer = (freelancerId) => {
    setSelectedFreelancers(prev => {
      if (prev.includes(freelancerId)) {
        showInfo("Freelancer deselected");
        return prev.filter(id => id !== freelancerId);
      } else {
        showSuccess("Freelancer selected");
        return [...prev, freelancerId];
      }
    });
  };

  // Function to select/deselect all freelancers
  const handleToggleAllFreelancers = () => {
    if (selectedFreelancers.length === matches.length) {
      setSelectedFreelancers([]);
      showInfo("All freelancers deselected");
    } else {
      setSelectedFreelancers(matches.map(m => m.freelancerId));
      showSuccess(`All ${matches.length} freelancers selected`);
    }
  };

  // Function to submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const errors = validateProjectData();
    if (errors.length > 0) {
      showError(`Validation errors:\n${errors.join("\n")}`);
      return;
    }

    setIsCreating(true);

    try {
      const skillsArray = Array.isArray(skills) ? skills.map(skill => {
        if (typeof skill === 'object' && skill !== null) {
          return skill.value || skill.name || skill.label || String(skill);
        }
        return String(skill);
      }).filter(skill => skill && skill !== '') : [];

      const response = await fetchAPI('/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          budget: budget ? parseFloat(budget) : null,
          duration: duration ? parseInt(duration) : null,
          skills: skillsArray,
          requirements: requirements.split('\n').filter(req => req.trim()),
          deadline: deadline || null
        })
      });

      if (response.success) {
        const projectId = response.data.id;
        setCreatedProjectId(projectId);

        if (selectedFiles.length > 0) {
          try {
            const uploadResponse = await uploadProjectFiles(projectId);
            if (!uploadResponse.success) {
              showWarning("Project created but some files failed to upload: " + uploadResponse.error);
            } else {
              showSuccess("Files uploaded successfully!");
            }
          } catch (uploadError) {
            showWarning("Project created but file upload failed: " + uploadError.message);
          }
        }

        if (selectedFreelancers.length > 0 && createdProjectId) {
          handleAssignFreelancers();
        } else {
          showSuccess("Project created successfully! Redirecting...");
          setTimeout(() => {
            navigate("/admin/projects");
          }, 1500);
        }
      } else {
        throw new Error(response.error || "Error creating project");
      }
    } catch (error) {
      console.error('Creation error:', error);
      showError("Error creating project: " + error.message);
    } finally {
      setIsCreating(false);
    }
  };

  // Component to display score bar
  const ScoreBar = ({ score, label, icon: Icon }) => (
    <div className="flex items-center gap-2 mb-2">
      <Icon size={14} className="text-gray-500" />
      <span className="text-sm font-medium w-20">{label}</span>
      <div className="flex-1 bg-gray-200 rounded-full h-2">
        <div 
          className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${Math.max(0, Math.min(100, (score || 0) * 100))}%` }}
        />
      </div>
      <span className="text-xs font-mono w-8">{((score || 0) * 100).toFixed(0)}%</span>
    </div>
  );

  // Component to display freelancer card
  const FreelancerCard = ({ freelancer, index, isSelected, onToggle }) => (
    <div className={`bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md border-2 transition-all duration-200 ${
      isSelected ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
    }`}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
            <Users size={20} className="text-indigo-600" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white">
              {freelancer.fullName || `Freelancer ${index + 1}`}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {freelancer.title || "Developer"}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-indigo-600">
            {((freelancer.score || 0) * 100).toFixed(0)}%
          </div>
          <span className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-full">
            #{index + 1}
          </span>
        </div>
      </div>

      {/* Detailed scores */}
      {freelancer.breakdown && (
        <div className="mb-3">
          <ScoreBar 
            score={freelancer.breakdown.skills || 0} 
            label="Skills" 
            icon={Award} 
          />
          <ScoreBar 
            score={freelancer.breakdown.semantic || 0} 
            label="Semantic" 
            icon={Brain} 
          />
          <ScoreBar 
            score={freelancer.breakdown.budget || 0} 
            label="Budget" 
            icon={DollarSign} 
          />
          <ScoreBar 
            score={freelancer.breakdown.rating || 0} 
            label="Rating" 
            icon={Star} 
          />
          <ScoreBar 
            score={freelancer.breakdown.experience || 0} 
            label="Experience" 
            icon={Clock} 
          />
        </div>
      )}

      {/* Information and actions */}
      <div className="flex justify-between items-center">
        <div className="text-sm">
          <span className="text-gray-600 dark:text-gray-300">
            ${freelancer.hourlyRate || 0}/h
          </span>
          {freelancer.rating && freelancer.rating > 0 && (
            <span className="ml-3 flex items-center">
              <Star size={12} className="text-yellow-500 mr-1 fill-current" />
              {freelancer.rating.toFixed(1)}/5
            </span>
          )}
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={() => onToggle(freelancer.freelancerId)}
            className={`px-3 py-2 rounded text-sm transition-all duration-200 ${
              isSelected 
                ? 'bg-green-500 text-white shadow-md hover:bg-green-600' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {isSelected ? (
              <div className="flex items-center gap-1">
                <CheckCircle size={16} />
                Selected
              </div>
            ) : 'Select'}
          </button>
        </div>
      </div>
    </div>
  );

  // File dropzone component
  const FileDropzone = () => {
    const handleDragOver = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDragEnter = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDragLeave = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFileSelect(files);
      }
    };

    const handleFileInput = (e) => {
      const files = Array.from(e.target.files);
      if (files.length > 0) {
        handleFileSelect(files);
      }
    };

    return (
      <div>
        <div
          className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-indigo-400 transition-colors duration-200"
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Upload size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            Drag and drop files here, or{' '}
            <label className="text-indigo-600 cursor-pointer hover:text-indigo-700">
              browse
              <input
                type="file"
                multiple
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.txt,.zip"
                onChange={handleFileInput}
              />
            </label>
          </p>
          <p className="text-sm text-gray-500">
            Maximum 5 files, 10MB each. Supported: PDF, Word, Excel, Images, Text, ZIP
          </p>
        </div>

        {/* Selected files list */}
        {selectedFiles.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Selected Files ({selectedFiles.length}/5)
            </p>
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <span className="text-2xl">{getFileIcon(file.type)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatFileSize(file.size)}
                  </p>
                </div>
                <button
                  onClick={() => handleRemoveFile(index)}
                  className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                  title="Remove file"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="relative max-w-6xl mx-auto p-6 bg-white rounded-2xl shadow-md dark:bg-gray-900">
      {/* Container pour les alertes */}
      <AlertContainer />

      {/* Modal de confirmation */}
      <ConfirmationModal />

      {/* Back button */}
      <button
        onClick={() => navigate("/admin/projects")}
        className="absolute top-4 left-4 flex items-center justify-center w-9 h-9
                   rounded-full border border-gray-300 dark:border-gray-700
                   bg-white dark:bg-gray-800
                   text-gray-600 dark:text-gray-300
                   hover:bg-indigo-600 hover:text-white hover:border-indigo-600
                   shadow-sm hover:shadow-md
                   transition-all duration-300 transform hover:scale-110 hover:-translate-x-1"
        title="Back to projects list"
      >
        <ArrowLeft size={18} />
      </button>

      {/* Title */}
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800 dark:text-white">
        ➕ New Project
      </h1>

      {/* Matching error message */}
      {matchingError && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center gap-2">
          <AlertCircle size={20} />
          <div>
            <strong>Matching Error:</strong>
            <div>{matchingError}</div>
          </div>
          <button 
            onClick={() => setMatchingError("")}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Project title */}
          <div className="md:col-span-2">
            <Label>Project Title *</Label>
            <Input
              type="text"
              placeholder="Ex: React Native Application Development"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={100}
            />
            {title && title.length < 5 && (
              <p className="text-sm text-amber-600 mt-1">Title must be at least 5 characters</p>
            )}
          </div>

          {/* Project description */}
          <div className="md:col-span-2">
            <Label>Detailed Description *</Label>
            <TextArea
              rows={5}
              placeholder="Describe your project in detail: objectives, expected features, preferred technologies..."
              value={description}
              onChange={setDescription}
              required
              maxLength={2000}
            />
            <div className="flex justify-between text-sm text-gray-500 mt-1">
              <span>{description.length < 20 ? "At least 20 characters required" : "Valid description"}</span>
              <span>{description.length}/2000</span>
            </div>
          </div>

          {/* Required skills */}
          <div className="md:col-span-2">
  <Label>Required Skills</Label>
  <SelectSkillsWithSearch
    options={skillOptions}
    placeholder="Type to search skills (min. 2 characters)..."
    isMulti
    onChange={(values) => setSkills(values)}
    value={skills}
    minSearchChars={2}
  />
  <p className="text-sm text-gray-500 mt-1">
    Start typing to search skills. Select from suggestions.
  </p>
</div>

          {/* Budget and Duration */}
          <div>
            <Label>Budget ($)</Label>
            <Input
              type="number"
              placeholder="Total project budget"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              min="0"
              step="0.01"
            />
            <p className="text-sm text-gray-500 mt-1">Total amount in US dollars</p>
          </div>

          <div>
            <Label>Duration (days)</Label>
            <Input
              type="number"
              placeholder="Estimated duration in days"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              min="1"
              max="365"
            />
            <p className="text-sm text-gray-500 mt-1">Estimated time to complete the project</p>
          </div>

          {/* Specific requirements */}
          <div className="md:col-span-2">
            <Label>Specific Requirements (one per line)</Label>
            <TextArea
              rows={3}
              placeholder="Example:&#10;• Minimum 3 years experience&#10;• Available during EST business hours&#10;• Portfolio required&#10;• French proficiency"
              value={requirements}
              onChange={setRequirements}
              maxLength={1000}
            />
            <p className="text-sm text-gray-500 mt-1">
              List specific requirements (experience, availability, certifications...)
            </p>
          </div>

          {/* Deadline */}
          <div>
            <Label>Deadline</Label>
            <Input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              min={new Date(Date.now() + 86400000).toISOString().split('T')[0]} // Tomorrow minimum
            />
            <p className="text-sm text-gray-500 mt-1">Desired delivery date</p>
          </div>

          {/* Documents */}
          <div className="md:col-span-2">
            <Label>Project Documents (optional)</Label>
            <FileDropzone />
            <p className="text-sm text-gray-500 mt-1">
              Contracts, specifications, mockups, wireframes... (PDF, images, documents)
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={handleRunMatching}
            disabled={isMatching || isCreating || !title.trim() || !description.trim()}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transform hover:scale-105"
          >
            {isMatching ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                AI Analysis in progress...
              </>
            ) : (
              <>
                <Brain size={20} />
                Smart Match
              </>
            )}
          </button>

          <button
            type="submit"
            disabled={isCreating || isMatching}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
          >
            {isCreating ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Creating...
              </>
            ) : (
              <>
                <PlusCircle size={20} />
                Create Project
              </>
            )}
          </button>
        </div>
      </form>

      {/* AI Matching Results */}
      {showMatches && (
        <div className="mt-8 p-6 bg-gradient-to-r from-gray-50 to-indigo-50 dark:from-gray-800 dark:to-indigo-900/20 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <Users size={24} className="text-indigo-600" />
                AI Recommended Freelancers
              </h3>
              {matches.length > 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  {matches.length} freelancer{matches.length > 1 ? 's' : ''} found and sorted by relevance
                </p>
              )}
            </div>
            
            <div className="flex gap-2">
              {matches.length > 0 && (
                <button
                  onClick={handleToggleAllFreelancers}
                  className="px-3 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm transition-colors"
                >
                  {selectedFreelancers.length === matches.length ? 'Deselect All' : 'Select All'}
                </button>
              )}
              
              {selectedFreelancers.length > 0 && (
                <button
                  onClick={handleAssignFreelancers}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2 font-medium"
                >
                  <CheckCircle size={16} />
                  Assign ({selectedFreelancers.length})
                </button>
              )}
              
              <button
                onClick={() => {
                  setShowMatches(false);
                  setSelectedFreelancers([]);
                  setMatches([]);
                }}
                className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                title="Close results"
              >
                <X size={20} />
              </button>
            </div>
          </div>
          
          {matches.length === 0 ? (
            <div className="text-center py-12">
              <Brain size={48} className="mx-auto text-gray-400 mb-4" />
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No matching freelancers found
              </h4>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                There are currently no available freelancers that match this project's criteria.
              </p>
              <div className="text-sm text-gray-400 space-y-1">
                <p>• Check if required skills are too specific</p>
                <p>• Try broadening the selection criteria</p>
                <p>• New freelancers might be available later</p>
              </div>
            </div>
          ) : (
            <>
              {selectedFreelancers.length > 0 && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-700 text-sm flex items-center gap-2">
                    <CheckCircle size={16} />
                    <strong>{selectedFreelancers.length}</strong> freelancer{selectedFreelancers.length > 1 ? 's' : ''} selected
                    {selectedFreelancers.length > 1 && " - They will all receive a proposal"}
                  </p>
                </div>
              )}
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {matches.map((freelancer, index) => (
                  <FreelancerCard 
                    key={freelancer.freelancerId} 
                    freelancer={freelancer} 
                    index={index}
                    isSelected={selectedFreelancers.includes(freelancer.freelancerId)}
                    onToggle={handleToggleFreelancer}
                  />
                ))}
              </div>
              
              {/* Instructions and tips */}
              {matches.length > 0 && selectedFreelancers.length === 0 && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle size={20} className="text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900 mb-2">How to proceed?</h4>
                      <ul className="text-blue-700 text-sm space-y-1">
                        <li>• Examine matching scores for each freelancer</li>
                        <li>• Select one or more relevant freelancers</li>
                        <li>• Click "Assign" to send them proposals</li>
                        <li>• They will receive a notification and can apply to your project</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}