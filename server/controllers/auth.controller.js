import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// Fonction pour générer le token JWT
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }
  );
};

// GET /auth/me - Récupérer les données utilisateur actuelles
export const getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.id; // L'utilisateur connecté via le token JWT

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        freelancerProfile: {
          select: {
            title: true,
            hourlyRate: true,
            experience: true,
            skills: true,
            portfolioUrl: true,
            linkedinUrl: true,
            githubUrl: true,
            availability: true,
            languages: true,
            education: true,
            certifications: true,
            rating: true,
            reviewCount: true,
            projectsCompleted: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Formater la réponse pour correspondre à la structure de currentUser
    const formattedUser = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone || null,
      location: user.location || null,
      avatar: user.avatar || null,
      role: user.role,
      isVerified: user.isVerified,
      isActive: user.isActive,
      createdAt: user.createdAt,
      jobTitle: user.freelancerProfile?.title || 'Freelancer',
      hourlyRate: user.freelancerProfile?.hourlyRate || 0,
      experience: user.freelancerProfile?.experience || 0,
      skills: user.freelancerProfile?.skills || [],
      portfolio: user.freelancerProfile?.portfolioUrl || '',
      linkedin: user.freelancerProfile?.linkedinUrl || '',
      github: user.freelancerProfile?.githubUrl || '',
      availability: user.freelancerProfile?.availability || 'AVAILABLE',
      languages: user.freelancerProfile?.languages || [],
      education: user.freelancerProfile?.education || [],
      certifications: user.freelancerProfile?.certifications || [],
      rating: user.freelancerProfile?.rating || 0,
      reviewCount: user.freelancerProfile?.reviewCount || 0,
      projectsCompleted: user.freelancerProfile?.projectsCompleted || 0,
    };

    res.status(200).json({
      success: true,
      user: formattedUser,
    });
  } catch (error) {
    console.error('Error fetching current user:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Register
export const register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone, location, role, avatar, jobTitle } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, first name and last name are required',
      });
    }

    const validRoles = ['FREELANCER', 'ADMIN'];
    const userRole = validRoles.includes(role) ? role : 'FREELANCER';

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: userRole,
        phone: phone || null,
        location: location || null,
        avatar: avatar || null,
        isActive: true,
        isVerified: false,
      },
    });

    if (userRole === 'FREELANCER') {
      await prisma.freelancerProfile.create({
        data: {
          userId: newUser.id,
          title: jobTitle || 'Freelancer',
          hourlyRate: 0,
          experience: 0,
          skills: [],
          languages: ['French'],
          education: [],
          certifications: [],
          rating: 0,
          reviewCount: 0,
          projectsCompleted: 0,
        },
      });
    }

    res.status(201).json({
      success: true,
      message: 'User created successfully!',
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
        avatar: newUser.avatar,
      },
    });
  } catch (err) {
    console.error('Registration error:', err);

    if (err.code === 'P2002') {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists!',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Something went wrong during registration!',
    });
  }
};

// Login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        freelancerProfile: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact support.',
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const token = generateToken(user.id);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    const userResponse = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      avatar: user.avatar,
      phone: user.phone,
      location: user.location,
      isVerified: user.isVerified,
      isActive: user.isActive,
      createdAt: user.createdAt,
      jobTitle: user.freelancerProfile?.title || 'Freelancer',
      hourlyRate: user.freelancerProfile?.hourlyRate || 0,
      experience: user.freelancerProfile?.experience || 0,
      skills: user.freelancerProfile?.skills || [],
      portfolio: user.freelancerProfile?.portfolioUrl || '',
      linkedin: user.freelancerProfile?.linkedinUrl || '',
      github: user.freelancerProfile?.githubUrl || '',
      availability: user.freelancerProfile?.availability || 'AVAILABLE',
      languages: user.freelancerProfile?.languages || [],
      education: user.freelancerProfile?.education || [],
      certifications: user.freelancerProfile?.certifications || [],
      rating: user.freelancerProfile?.rating || 0,
      reviewCount: user.freelancerProfile?.reviewCount || 0,
      projectsCompleted: user.freelancerProfile?.projectsCompleted || 0,
    };

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: userResponse,
        token: token,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({
      success: false,
      message: 'Something went wrong during login!',
    });
  }
};

// Logout
export const logout = async (req, res) => {
  try {
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });

    res.status(200).json({
      success: true,
      message: 'Logout successful',
    });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({
      success: false,
      message: 'Something went wrong during logout!',
    });
  }
};

// Exportation de la fonction generateToken
export { generateToken };