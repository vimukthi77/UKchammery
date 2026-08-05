import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { comparePassword, hashPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, message: 'Missing fields' },
        { status: 400 }
      );
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Verify current password
    const isMatch = await comparePassword(currentPassword, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, message: 'Incorrect current password' },
        { status: 400 }
      );
    }

    // Hash and save new password
    const newHash = await hashPassword(newPassword);
    user.passwordHash = newHash;
    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error: any) {
    console.error('Password change error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error updating password' },
      { status: 500 }
    );
  }
}
