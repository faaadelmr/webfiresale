import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { saveAvatar, deleteAvatar } from '@/lib/avatarUtils';

// Validation helper functions
function validateProfileData(body: any) {
  const errors: string[] = [];

  // Validate firstName (max 50 characters, only letters, spaces, hyphens, and apostrophes)
  if (body.firstName && typeof body.firstName === 'string') {
    if (body.firstName.length > 50) {
      errors.push('First name must be 50 characters or less');
    }
    if (!/^[A-Za-z\s\-']+$/.test(body.firstName.trim())) {
      errors.push('First name contains invalid characters');
    }
  }

  // Validate lastName (max 50 characters, only letters, spaces, hyphens, and apostrophes)
  if (body.lastName && typeof body.lastName === 'string') {
    if (body.lastName.length > 50) {
      errors.push('Last name must be 50 characters or less');
    }
    if (!/^[A-Za-z\s\-']+$/.test(body.lastName.trim())) {
      errors.push('Last name contains invalid characters');
    }
  }

  // Validate phone (if present, max 20 characters, numbers, spaces, hyphens, parentheses, plus sign)
  if (body.phone && typeof body.phone === 'string') {
    if (body.phone.length > 20) {
      errors.push('Phone number must be 20 characters or less');
    }
    if (!/^[0-9+\-\s()]+$/.test(body.phone)) {
      errors.push('Phone number contains invalid characters');
    }
  }

  // Validate date of birth (if present, check if it's a valid date and in the past)
  if (body.dateOfBirth) {
    const date = new Date(body.dateOfBirth);
    if (isNaN(date.getTime())) {
      errors.push('Invalid date of birth');
    } else if (date > new Date()) {
      errors.push('Date of birth cannot be in the future');
    }
  }

  // Validate gender (if present, must be one of allowed values)
  if (body.gender && typeof body.gender === 'string') {
    const validGenders = ['male', 'female'];
    if (!validGenders.includes(body.gender.toLowerCase())) {
      errors.push('Gender must be one of: male, female');
    }
  }

  // Validate preferences (should be a valid JSON object if provided)
  if (body.preferences) {
    try {
      // If it's a string, try to parse it
      if (typeof body.preferences === 'string') {
        JSON.parse(body.preferences);
      }
    } catch (e) {
      errors.push('Preferences must be a valid JSON object');
    }
  }

  return errors;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Get the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        name: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        dateOfBirth: true,
        avatar: true,
        gender: true,
        role: true,
        isVerified: true,
        preferences: true,
        addresses: {
          where: { isDefault: true },
          take: 1
        }
      }
    });

    if (!user) {
      return new Response('User not found', { status: 404 });
    }

    return new Response(JSON.stringify({
      id: user.id,
      name: user.name,
      email: user.email,
      profile: {
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString() : null,
        avatar: user.avatar,
        gender: user.gender,
        role: user.role,
        isVerified: user.isVerified,
        preferences: user.preferences
      },
      defaultAddress: user.addresses[0] || null
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return new Response('Internal server error', { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Check content type to determine how to read the body
    const contentType = request.headers.get('content-type');

    let body;
    let avatarUrl = null;

    if (contentType?.includes('multipart/form-data')) {
      // Handle form data (file upload)
      const formData = await request.formData();
      body = {
        firstName: formData.get('firstName') as string,
        lastName: formData.get('lastName') as string,
        phone: formData.get('phone') as string,
        dateOfBirth: formData.get('dateOfBirth') as string,
        gender: formData.get('gender') as string,
        preferences: formData.get('preferences') as string | undefined,
        avatarUrl: formData.get('avatarUrl') as string,
      };

      // Handle avatar file if present
      const avatarFile = formData.get('avatar') as File | null;
      if (avatarFile) {
        // Validate file size (max 5MB)
        if (avatarFile.size > 5 * 1024 * 1024) {
          return new Response('File size exceeds 5MB limit', { status: 400 });
        }

        // Validate file type
        if (!avatarFile.type.startsWith('image/')) {
          return new Response('Invalid file type. Only image files are allowed.', { status: 400 });
        }

        avatarUrl = await saveAvatar(avatarFile);
        if (!avatarUrl) {
          return new Response('Error saving avatar', { status: 500 });
        }
      } else if (body.avatarUrl) {
        // If no new file uploaded but avatarUrl is provided, use the existing one
        avatarUrl = body.avatarUrl;
      }
    } else {
      // Handle JSON data (for backward compatibility)
      body = await request.json();
      avatarUrl = body.avatar;
    }

    // Validate the profile data
    const validationErrors = validateProfileData(body);
    if (validationErrors.length > 0) {
      return new Response(`Validation errors: ${validationErrors.join(', ')}`, { status: 400 });
    }

    // Debug: Log email being used to find user
    console.log('Attempting to find user with email:', session.user.email);

    // Debug: Check if session user has email
    if (!session?.user?.email) {
      console.log('Session user email is missing');
      return new Response('Unauthorized - email missing from session', { status: 401 });
    }

    // Get the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, avatar: true }
    });

    if (!user) {
      console.log('User not found in database with email:', session.user.email);
      return new Response('User not found', { status: 404 });
    } else {
      console.log('User found in database:', user.id);
    }

    // If updating avatar and user had an old avatar, delete the old file
    if (avatarUrl && user.avatar && user.avatar.startsWith('/uploads/avatars/')) {
      await deleteAvatar(user.avatar);
    }

    // Safely convert date string to Date object
    let dateOfBirth: Date | null = null;
    if (body.dateOfBirth) {
      const parsedDate = new Date(body.dateOfBirth);
      if (!isNaN(parsedDate.getTime())) {  // Check if date is valid
        dateOfBirth = parsedDate;
      }
    }

    // Safely handle preferences field (JSON type)
    let preferencesValue: any = undefined;
    if (body.preferences) {
      try {
        // If it's already an object, use it as-is; if it's a string, parse it
        preferencesValue = typeof body.preferences === 'string'
          ? JSON.parse(body.preferences)
          : body.preferences;
      } catch (e) {
        console.error('Error parsing preferences:', e);
        preferencesValue = body.preferences; // Use as-is if parsing fails
      }
    }

    // Prepare update data, being careful with potential undefined values
    const updateData: any = {
      firstName: body.firstName || null,
      lastName: body.lastName || null,
      phone: body.phone || null,
      dateOfBirth,
      gender: body.gender || null,
    };

    // Only add avatar to update if we have a new one
    if (avatarUrl !== undefined) {
      updateData.avatar = avatarUrl;
    }

    // Only add preferences if provided
    if (body.preferences !== undefined) {
      updateData.preferences = preferencesValue;
    }

    // Update the user directly with profile fields
    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: updateData
    });

    // Return only the profile-related fields for compatibility
    const userProfile = {
      firstName: updatedUser.firstName || null,
      lastName: updatedUser.lastName || null,
      phone: updatedUser.phone || null,
      dateOfBirth: updatedUser.dateOfBirth ? new Date(updatedUser.dateOfBirth).toISOString() : null,
      avatar: updatedUser.avatar || null,
      preferences: updatedUser.preferences || null,
      createdAt: updatedUser.createdAt ? new Date(updatedUser.createdAt).toISOString() : null, // Format properly
      updatedAt: new Date().toISOString() // Format properly
    };

    return new Response(JSON.stringify(userProfile), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error updating profile:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      meta: error.meta
    });
    return new Response(`Internal server error: ${error.message || 'Unknown error'}`, { status: 500 });
  }
}