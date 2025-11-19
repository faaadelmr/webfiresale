import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';
import { NextRequest } from 'next/server';

// Ensure uploads directory exists
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'avatars');

export async function saveAvatar(file: File): Promise<string | null> {
  try {
    // Create directory if it doesn't exist
    await fs.mkdir(UPLOAD_DIR, { recursive: true });

    // Generate unique filename
    const fileExtension = path.extname(file.name);
    const fileName = `${uuidv4()}${fileExtension}`;
    const filePath = path.join(UPLOAD_DIR, fileName);

    // Convert file to buffer and save
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filePath, buffer);

    // Return public URL
    return `/uploads/avatars/${fileName}`;
  } catch (error) {
    console.error('Error saving avatar:', error);
    return null;
  }
}

export async function deleteAvatar(avatarPath: string): Promise<boolean> {
  try {
    if (!avatarPath.startsWith('/uploads/avatars/')) {
      return false; // Don't delete files outside our uploads folder
    }

    const filePath = path.join(process.cwd(), 'public', avatarPath);
    await fs.unlink(filePath);
    return true;
  } catch (error) {
    console.error('Error deleting avatar:', error);
    return false;
  }
}