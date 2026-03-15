import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Save, ArrowLeft, Upload, User, Mail, Phone, MapPin, Briefcase, Award, Globe, Linkedin, Github, Sparkles, Eye, EyeOff } from "lucide-react";
import toast, { Toaster } from 'react-hot-toast';
import SelectSkillsWithSearch from "../admin/SelectSkillsWithSearch";
import { useAuth } from "../../../context/AuthContext";
import { uploadToCloudinary } from "../../../utils/upload";

export default function AddFreelancer() {
  const navigate = useNavigate();
  const { fetchAPI } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    location: "",
    jobTitle: "",
    hourlyRate: "",
    experience: "",
    skills: [],
    portfolio: "",
    linkedin: "",
    github: "",
    availability: "available",
    isVerified: false,
    isActive: true,
    profilePicture: null,
    education: [""],
    certifications: [""]
  });

  const [avatarPreview, setAvatarPreview] = useState(null);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validation des mots de passe
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      setLoading(false);
      return;
    }

    try {
      let avatarUrl = null;

      // Upload de l'image si elle existe
      if (formData.profilePicture) {
        setUploading(true);
        const uploadPromise = uploadToCloudinary(formData.profilePicture);
        
        toast.promise(
          uploadPromise,
          {
            loading: 'Uploading profile picture...',
            success: 'Profile picture uploaded!',
            error: 'Failed to upload image',
          }
        );
        
        avatarUrl = await uploadPromise;
        setUploading(false);
      }

      // Préparer les données pour l'envoi
      const submitData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        location: formData.location,
        jobTitle: formData.jobTitle,
        hourlyRate: parseFloat(formData.hourlyRate) || 0,
        experience: parseInt(formData.experience) || 0,
        skills: formData.skills.map(skill => skill.value),
        portfolio: formData.portfolio,
        linkedin: formData.linkedin,
        github: formData.github,
        availability: formData.availability,
        isVerified: formData.isVerified,
        isActive: formData.isActive,
        profilePicture: avatarUrl,
        education: formData.education.filter(edu => edu.trim() !== ""),
        certifications: formData.certifications.filter(cert => cert.trim() !== "")
      };

      // Appel à l'API
      const response = await fetchAPI('/freelancers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData)
      });

      if (response.error) {
        throw new Error(response.error);
      }

      toast.success("Freelancer created successfully!", {
        duration: 3000,
        style: {
          background: '#10B981',
          color: '#fff',
          fontWeight: '500',
        },
        iconTheme: {
          primary: '#fff',
          secondary: '#10B981',
        },
      });

      setTimeout(() => {
        navigate("/admin/freelancers");
      }, 1500);

    } catch (err) {
      console.error("Error during creation:", err);
      toast.error(err.message || "An error occurred while creating the freelancer", {
        duration: 4000,
        style: {
          background: '#EF4444',
          color: '#fff',
        },
      });
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSkillsChange = (selectedOptions) => {
    setFormData(prev => ({
      ...prev,
      skills: selectedOptions || []
    }));
  };

  const handleProfilePictureUpload = (file) => {
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must not exceed 5MB");
        return;
      }

      setFormData(prev => ({
        ...prev,
        profilePicture: file
      }));

      const previewUrl = URL.createObjectURL(file);
      setAvatarPreview(previewUrl);
    }
  };

  const handleEducationChange = (index, value) => {
    setFormData(prev => {
      const newEducation = [...prev.education];
      newEducation[index] = value;
      return { ...prev, education: newEducation };
    });
  };

  const addEducationField = () => {
    setFormData(prev => ({
      ...prev,
      education: [...prev.education, ""]
    }));
  };

  const removeEducationField = (index) => {
    setFormData(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }));
  };

  const handleCertificationChange = (index, value) => {
    setFormData(prev => {
      const newCertifications = [...prev.certifications];
      newCertifications[index] = value;
      return { ...prev, certifications: newCertifications };
    });
  };

  const addCertificationField = () => {
    setFormData(prev => ({
      ...prev,
      certifications: [...prev.certifications, ""]
    }));
  };

  const removeCertificationField = (index) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index)
    }));
  };

  React.useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={8}
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            style: {
              background: '#10B981',
            },
          },
          error: {
            duration: 4000,
            style: {
              background: '#EF4444',
            },
          },
        }}
      />

      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/admin/freelancers')}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow"
          >
            <ArrowLeft size={20} />
            <span>Back to Freelancers</span>
          </button>

          <div className="flex gap-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Add New Freelancer
            </h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Colonne gauche - Photo de profil */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 sticky top-6">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <User size={18} />
                  <span>Profile Photo</span>
                </h2>

                <div className="text-center">
                  <div className="relative mx-auto w-28 h-28 rounded-full bg-gray-200 dark:bg-gray-700 mb-3 overflow-hidden">
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Profile preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User size={40} className="text-gray-400" />
                      </div>
                    )}

                    <label className="absolute bottom-0 right-10 bg-blue-600 text-white p-1.5 rounded-full cursor-pointer hover:bg-blue-700 transition-all shadow-sm hover:shadow-md">
                      <Upload size={14} />
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => handleProfilePictureUpload(e.target.files[0])}
                        disabled={loading || uploading}
                      />
                    </label>
                  </div>

                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                    Upload a professional photo. Max 5MB.
                  </p>

                  <div className="space-y-2">
                    <ToggleSwitch
                      label="Verified Account"
                      name="isVerified"
                      checked={formData.isVerified}
                      onChange={handleInputChange}
                    />

                    <ToggleSwitch
                      label="Active Status"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Colonne centrale - Informations personnelles */}
            <div className="lg:col-span-2 space-y-5">
              {/* Informations personnelles */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Personal Information
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      First Name *
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="John"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Doe"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="john.doe@example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-10"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        {showPassword ? <Eye size={16} /> : <EyeOff size={16} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Confirm Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-10"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="+1 234 567 8900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Location
                    </label>
                    <div className="relative">
                      <MapPin size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="City, Country"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Informations professionnelles */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Briefcase size={18} />
                  <span>Professional Information</span>
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Job Title *
                    </label>
                    <input
                      type="text"
                      name="jobTitle"
                      value={formData.jobTitle}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Senior Developer"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Hourly Rate ($) *
                    </label>
                    <input
                      type="number"
                      name="hourlyRate"
                      value={formData.hourlyRate}
                      onChange={handleInputChange}
                      required
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="45.00"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Experience (years)
                    </label>
                    <input
                      type="number"
                      name="experience"
                      value={formData.experience}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="5"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Availability *
                    </label>
                    <select
                      name="availability"
                      value={formData.availability}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="available">Available</option>
                      <option value="busy">Busy</option>
                      <option value="unavailable">Unavailable</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Skills *
                    </label>
                    <SelectSkillsWithSearch
                      options={skillOptions}
                      placeholder="Type to search skills (min. 2 characters)..."
                      isMulti
                      onChange={handleSkillsChange}
                      value={formData.skills}
                      minSearchChars={2}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                      Start typing to search skills. Select from suggestions.
                    </p>
                  </div>
                </div>
              </div>

              {/* Éducation */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Award size={18} />
                  <span>Education</span>
                </h2>

                <div className="space-y-3">
                  {formData.education.map((edu, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={edu}
                        onChange={(e) => handleEducationChange(index, e.target.value)}
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="e.g. Master's in Computer Science, University of Paris, 2020"
                      />
                      {formData.education.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeEducationField(index)}
                          className="p-2 text-red-500 hover:text-red-700 transition-colors"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addEducationField}
                    className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1"
                  >
                    + Add another education
                  </button>
                </div>
              </div>

              {/* Certifications */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Sparkles size={18} />
                  <span>Certifications</span>
                </h2>

                <div className="space-y-3">
                  {formData.certifications.map((cert, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={cert}
                        onChange={(e) => handleCertificationChange(index, e.target.value)}
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="e.g. AWS Certified Developer, Google Cloud Professional"
                      />
                      {formData.certifications.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeCertificationField(index)}
                          className="p-2 text-red-500 hover:text-red-700 transition-colors"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addCertificationField}
                    className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1"
                  >
                    + Add another certification
                  </button>
                </div>
              </div>

              {/* Liens sociaux */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Social Links
                </h2>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Portfolio URL
                    </label>
                    <div className="relative">
                      <Globe size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="url"
                        name="portfolio"
                        value={formData.portfolio}
                        onChange={handleInputChange}
                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="https://portfolio.example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      LinkedIn Profile
                    </label>
                    <div className="relative">
                      <Linkedin size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="url"
                        name="linkedin"
                        value={formData.linkedin}
                        onChange={handleInputChange}
                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="https://linkedin.com/in/username"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      GitHub Profile
                    </label>
                    <div className="relative">
                      <Github size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="url"
                        name="github"
                        value={formData.github}
                        onChange={handleInputChange}
                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="https://github.com/username"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex justify-end gap-3 pt-6">
            <button
              type="button"
              onClick={() => navigate("/admin/freelancers")}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 text-sm font-medium"
              disabled={loading || uploading}
            >
              <span>Cancel</span>
            </button>

            <button
              type="submit"
              disabled={loading || uploading}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 font-normal disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading || uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>{uploading ? "Uploading..." : "Creating..."}</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>Add Freelancer</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ToggleSwitch({ label, name, checked, onChange }) {
  return (
    <label className="flex items-center justify-between cursor-pointer group">
      <span className="text-xs font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
        {label}
      </span>
      <div className="relative">
        <input
          type="checkbox"
          name={name}
          checked={checked}
          onChange={onChange}
          className="sr-only"
        />
        <div className={`w-10 h-5 rounded-full transition-all duration-200 ${checked ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}>
          <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-all duration-200 ${checked ? 'transform translate-x-5' : ''} shadow-sm`} />
        </div>
      </div>
    </label>
  );
}