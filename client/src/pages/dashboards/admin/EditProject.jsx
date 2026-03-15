import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Label from "../../../components/form/Label";
import Input from "../../../components/form/input/InputField";
import TextArea from "../../../components/form/input/TextArea";
import SelectSkillsWithSearch from "../admin/SelectSkillsWithSearch";
import { 
  Brain, 
  Save, 
  ArrowLeft, 
  Users, 
  Star, 
  Clock, 
  DollarSign, 
  Award, 
  X,
  CheckCircle,
  AlertCircle,
  Upload,
  FileText,
  Trash2,
  Download,
  Eye
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";

export default function EditProject() {
  // States for project data
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [skills, setSkills] = useState([]);
  const [budget, setBudget] = useState("");
  const [duration, setDuration] = useState("");
  const [requirements, setRequirements] = useState("");
  const [deadline, setDeadline] = useState("");
  
  // States for file management
  const [existingFiles, setExistingFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState({});
  
  // States for matching
  const [isMatching, setIsMatching] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [matches, setMatches] = useState([]);
  const [showMatches, setShowMatches] = useState(false);
  const [selectedFreelancers, setSelectedFreelancers] = useState([]);
  const [matchingError, setMatchingError] = useState("");
  const [fetchError, setFetchError] = useState("");

  const navigate = useNavigate();
  const { id } = useParams(); // Get project ID from URL
  const { fetchAPI } = useAuth();

  // Translate backend errors
  const translateError = (error) => {
    const translations = {
      "Route non trouvée": "Route not found",
      "Projet non trouvé": "Project not found",
      // Add more translations as needed
    };
    return translations[error] || error;
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
      // Check file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        errors.push(`${file.name}: File too large (max 10MB)`);
        return;
      }

      // Check file type
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
      toast.error("File validation errors:\n" + errors.join("\n"));
      return;
    }

    // Limit to 5 files total (existing + new)
    const currentFileCount = existingFiles.length + selectedFiles.length;
    const remainingSlots = 5 - currentFileCount;
    const filesToAdd = validFiles.slice(0, remainingSlots);

    if (validFiles.length > remainingSlots) {
      toast.warn(`Only ${remainingSlots} more file(s) can be added (maximum 5 files total)`);
    }

    setSelectedFiles(prev => [...prev, ...filesToAdd]);
  };

  const handleRemoveNewFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleRemoveExistingFile = async (attachmentId, fileName) => {
    if (!confirm(`Delete "${fileName}"?`)) return;

    try {
      const response = await fetchAPI(`/projects/${id}/attachments/${attachmentId}`, {
        method: 'DELETE'
      });

      if (response.success) {
        setExistingFiles(prev => prev.filter(file => file.id !== attachmentId));
        toast.success(`File "${fileName}" deleted successfully`);
      } else {
        throw new Error(response.error || "Failed to delete file");
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error("Error deleting file: " + error.message);
    }
  };

  const handleDownloadFile = async (attachmentId, fileName) => {
    try {
      setDownloading(prev => ({ ...prev, [attachmentId]: true }));
      
      const response = await fetchAPI(`/projects/${id}/attachments/${attachmentId}`, {
        method: 'GET',
        responseType: 'blob'
      });

      // Create blob URL and download
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(`Downloaded ${fileName}`);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error(`Failed to download ${fileName}`);
    } finally {
      setDownloading(prev => ({ ...prev, [attachmentId]: false }));
    }
  };

  const uploadNewFiles = async () => {
    if (selectedFiles.length === 0) return { success: true, data: [] };

    try {
      setUploading(true);
      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append('files', file);
      });

      const response = await fetchAPI(`/projects/${id}/attachments`, {
        method: 'POST',
        body: formData,
      });

      if (response.success) {
        // Add new files to existing files list
        const newFiles = Array.isArray(response.data) ? response.data : [response.data];
        setExistingFiles(prev => [...prev, ...newFiles]);
        setSelectedFiles([]); // Clear selected files
        toast.success(`${newFiles.length} file(s) uploaded successfully`);
        return response;
      } else {
        throw new Error(response.error || "Failed to upload files");
      }
    } catch (error) {
      console.error('File upload error:', error);
      toast.error("File upload error: " + error.message);
      throw error;
    } finally {
      setUploading(false);
    }
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Fetch project data on mount
  useEffect(() => {
  const fetchProject = async () => {
    try {
      const response = await fetchAPI(`/projects/${id}`);
      if (response.success) {
        const project = response.data;
        setTitle(project.title || "");
        setDescription(project.description || "");
        
        // Transform skills from backend format to SelectSkillsWithSearch format
        const transformedSkills = project.skills 
          ? project.skills.map(skill => {
              // Find the skill in skillOptions
              const skillOption = skillOptions.find(
                opt => opt.value === skill || opt.label === skill
              );
              // Return the found option or create a new one
              return skillOption || { value: skill, label: skill };
            })
          : [];
        setSkills(transformedSkills);
        
        setBudget(project.budget ? project.budget.toString() : "");
        setDuration(project.duration ? project.duration.toString() : "");
        setRequirements(project.requirements ? project.requirements.join("\n") : "");
        setDeadline(project.deadline ? project.deadline.split("T")[0] : "");
        setExistingFiles(project.attachments || []);
      } else {
        setFetchError(translateError(response.error) || "Error loading project");
      }
    } catch (error) {
      setFetchError(translateError(error.message) || "Error loading project");
    }
  };

  fetchProject();
}, [id, fetchAPI]);

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
      console.log("Validation errors:", errors);
      toast.error(errors.join("; "), {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      return;
    }

    setIsMatching(true);
    setMatchingError("");
    
    try {
      console.log("Starting matching process...");
      
      // Transform skills to string array
      const skillsArray = Array.isArray(skills) ? skills.map(skill => {
        if (typeof skill === 'object' && skill !== null) {
          return skill.value || skill.name || skill.label || String(skill);
        }
        return String(skill);
      }).filter(skill => skill && skill !== '') : [];

      console.log("Transformed skills:", skillsArray);
      
      // Update project before matching
      const projectResponse = await fetchAPI(`/projects/${id}`, {
        method: 'PATCH',
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
        throw new Error(translateError(projectResponse.error) || "Error updating project");
      }

      // Upload new files if any
      if (selectedFiles.length > 0) {
        await uploadNewFiles();
      }

      console.log("Project updated with ID:", id);

      // Run AI matching
      console.log("Starting AI matching...");
      const matchResponse = await fetchAPI(`/match-project/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      // Check response format
      if (Array.isArray(matchResponse)) {
        console.log(`Matching completed: ${matchResponse.length} results`);
        setMatches(matchResponse);
        setShowMatches(true);
        
        if (matchResponse.length === 0) {
          console.log("No matching freelancers found");
          toast.warn("No matching freelancers found for this project. The project has been updated successfully.", {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });
        }
      } else if (matchResponse.success === false) {
        const errorMsg = translateError(matchResponse.message) || translateError(matchResponse.error) || "AI matching error";
        throw new Error(errorMsg);
      } else {
        console.warn("Unexpected response format:", matchResponse);
        setMatches([]);
        setShowMatches(true);
        console.log("Showing toast: Matching issue");
        toast.warn("Matching encountered an issue, but the project was updated successfully.", {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      }

    } catch (error) {
      console.error('Matching error:', error);
      setMatchingError(translateError(error.message));
      
      if (error.message.includes("Token") || error.message.includes("401")) {
        console.log("Showing toast: Session expired");
        toast.error("Session expired. Please log in again.", {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      } else if (error.message.includes("timeout") || error.message.includes("Timeout")) {
        console.log("Showing toast: Matching timeout");
        toast.warn("Matching service took too long to respond. The project has been updated.", {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      } else {
        console.log("Showing toast: Matching error", error.message);
        toast.error("Matching error: " + translateError(error.message), {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      }
    } finally {
      setIsMatching(false);
    }
  };

  // Function to assign selected freelancers
  const handleAssignFreelancers = async () => {
    if (selectedFreelancers.length === 0) {
      console.log("Showing toast: No freelancers selected");
      toast.error("Please select at least one freelancer.", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      return;
    }

    const confirmMessage = `Do you want to send proposals to ${selectedFreelancers.length} freelancer${selectedFreelancers.length > 1 ? 's' : ''}?`;
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      console.log(`Assigning ${selectedFreelancers.length} freelancers...`);
      
      // Create proposals for each selected freelancer
      const assignmentPromises = selectedFreelancers.map(async (freelancerId) => {
        try {
          const response = await fetchAPI('/proposals', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              projectId: id,
              freelancerId: freelancerId,
              status: 'PENDING',
              coverLetter: `Automated proposal generated by AI matching system for project: ${title}`,
              estimatedTime: duration ? parseInt(duration) : 7
            })
          });
          
          return { freelancerId, success: response.success, error: response.error };
        } catch (error) {
          return { freelancerId, success: false, error: translateError(error.message) };
        }
      });

      const results = await Promise.all(assignmentPromises);
      
      // Analyze results
      const successes = results.filter(r => r.success);
      const failures = results.filter(r => !r.success);
      
      if (failures.length === 0) {
        console.log("Showing toast: All freelancers assigned");
        toast.success(`✅ All ${successes.length} freelancer${successes.length > 1 ? 's' : ''} assigned successfully!`, {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        setTimeout(() => navigate("/admin/projects"), 5000);
      } else if (successes.length > 0) {
        console.log("Showing toast: Partial assignment success");
        toast.warn(`✅ ${successes.length}/${selectedFreelancers.length} freelancers assigned successfully. ❌ ${failures.length} failed.`, {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        console.error('Assignment failures:', failures);
        setTimeout(() => navigate("/admin/projects"), 5000);
      } else {
        console.log("Showing toast: No freelancers assigned");
        toast.error("❌ No freelancers could be assigned. Please try again.", {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        console.error('All assignments failed:', failures);
        return;
      }
      
    } catch (error) {
      console.error('Assignment error:', error);
      console.log("Showing toast: Assignment error", error.message);
      toast.error("Error assigning freelancers: " + translateError(error.message), {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }
  };

  // Function to toggle freelancer selection
  const handleToggleFreelancer = (freelancerId) => {
    setSelectedFreelancers(prev => {
      if (prev.includes(freelancerId)) {
        console.log("Showing toast: Freelancer deselected");
        toast.info("Freelancer deselected.", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        return prev.filter(id => id !== freelancerId);
      } else {
        console.log("Showing toast: Freelancer selected");
        toast.info("Freelancer selected.", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        return [...prev, freelancerId];
      }
    });
  };

  // Function to select/deselect all freelancers
  const handleToggleAllFreelancers = () => {
    if (selectedFreelancers.length === matches.length) {
      setSelectedFreelancers([]);
      console.log("Showing toast: All freelancers deselected");
      toast.info("All freelancers deselected.", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } else {
      setSelectedFreelancers(matches.map(m => m.freelancerId));
      console.log("Showing toast: All freelancers selected");
      toast.info("All freelancers selected.", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }
  };

  // Function to submit form (update project)
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const errors = validateProjectData();
    if (errors.length > 0) {
      console.log("Showing toast: Validation errors", errors);
      toast.error(errors.join("; "), {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      return;
    }

    setIsUpdating(true);

    try {
      // Transform skills to string array
      const skillsArray = Array.isArray(skills) ? skills.map(skill => {
        if (typeof skill === 'object' && skill !== null) {
          return skill.value || skill.name || skill.label || String(skill);
        }
        return String(skill);
      }).filter(skill => skill && skill !== '') : [];

      const response = await fetchAPI(`/projects/${id}`, {
        method: 'PATCH',
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
        // Upload new files if any
        if (selectedFiles.length > 0) {
          await uploadNewFiles();
        }

        // If freelancers are selected, assign them before redirecting
        if (selectedFreelancers.length > 0) {
          await handleAssignFreelancers();
        } else {
          console.log("Showing toast: Project updated successfully");
          toast.success("✅ Project updated successfully!", {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });
          setTimeout(() => navigate("/admin/projects"), 5000);
        }
      } else {
        throw new Error(translateError(response.error) || "Error updating project");
      }
    } catch (error) {
      console.error('Update error:', error);
      console.log("Showing toast: Update error", error.message);
      toast.error("Error updating project: " + translateError(error.message), {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      setIsUpdating(false);
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
      <div className="space-y-4">
        {/* Existing files */}
        {existingFiles.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Current Files ({existingFiles.length}/5)
            </p>
            {existingFiles.map((file, index) => (
              <div
                key={file.id || index}
                className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
              >
                <span className="text-2xl">{getFileIcon(file.type)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {file.size} • {formatDate(file.createdAt)}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleDownloadFile(file.id, file.name)}
                    disabled={downloading[file.id]}
                    className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 dark:hover:bg-blue-800/20 rounded"
                    title="Download file"
                  >
                    {downloading[file.id] ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    ) : (
                      <Download size={16} />
                    )}
                  </button>
                  <button
                    onClick={() => handleRemoveExistingFile(file.id, file.name)}
                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                    title="Delete file"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* New files to upload */}
        {selectedFiles.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              New Files to Upload ({selectedFiles.length})
            </p>
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
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
                  onClick={() => handleRemoveNewFile(index)}
                  className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                  title="Remove file"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Upload zone */}
        {(existingFiles.length + selectedFiles.length) < 5 && (
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
              Maximum {5 - existingFiles.length - selectedFiles.length} more file(s), 10MB each
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Supported: PDF, Word, Excel, Images, Text, ZIP
            </p>
          </div>
        )}

        {uploading && (
          <div className="flex items-center justify-center gap-2 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
            <span className="text-indigo-700 dark:text-indigo-300">Uploading files...</span>
          </div>
        )}
      </div>
    );
  };

  // Display error if project loading fails
  if (fetchError) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center gap-2">
          <AlertCircle size={20} />
          <div>
            <strong>Error:</strong>
            <div>{fetchError}</div>
          </div>
        </div>
        <button
          onClick={() => {
            console.log("Showing toast: Returning to projects list");
            toast.info("Returning to projects list.", {
              position: "top-right",
              autoClose: 3000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
            });
            setTimeout(() => navigate("/admin/projects"), 3000);
          }}
          className="mt-4 flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <ArrowLeft size={18} />
          Back to Projects
        </button>
      </div>
    );
  }

  return (
    <div className="relative max-w-6xl mx-auto p-6 bg-white rounded-2xl shadow-md dark:bg-gray-900">
      {/* Toast Container */}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />

      {/* Back button */}
      <button
        onClick={() => {
          console.log("Showing toast: Returning to projects list");
          toast.info("Returning to projects list.", {
            position: "top-right",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });
          setTimeout(() => navigate("/admin/projects"), 3000);
        }}
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
        ✏️ Edit Project
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
              placeholder="Example:&#10;• Minimum 3 years experience&#10;• Available during EST business hours&#10;• Portfolio required&#10;• English proficiency"
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
            <Label>Project Documents</Label>
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
            disabled={isMatching || isUpdating || !title.trim() || !description.trim()}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transform hover:scale-105"
          >
            {isMatching ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Running AI Matching...
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
            disabled={isUpdating || isMatching}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
          >
            {isUpdating || uploading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                {uploading ? "Uploading..." : "Saving..."}
              </>
            ) : (
              <>
                <Save size={20} />
                Save Changes
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
                  console.log("Showing toast: Matching results closed");
                  toast.info("Matching results closed.", {
                    position: "top-right",
                    autoClose: 3000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                  });
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