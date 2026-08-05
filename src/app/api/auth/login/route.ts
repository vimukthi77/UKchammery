import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Setting from '@/models/Setting';
import { comparePassword, hashPassword, signToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Please provide both email and password' },
        { status: 400 }
      );
    }

    // Auto-seed default accounts if User collection is empty
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('User collection is empty. Auto-seeding default accounts...');
      
      const adminPass = await hashPassword('admin123');
      const cookPass = await hashPassword('cook123');
      const staffPass = await hashPassword('staff123');

      await User.create([
        {
          name: 'System Admin',
          email: 'admin@ukchammery.com',
          passwordHash: adminPass,
          role: 'admin',
          status: 'active',
          balance: 0,
        },
        {
          name: 'Kitchen Chef',
          email: 'cook@ukchammery.com',
          passwordHash: cookPass,
          role: 'cook',
          status: 'active',
          balance: 0,
        },
        {
          name: 'Office Staff John',
          email: 'staff@ukchammery.com',
          passwordHash: staffPass,
          role: 'user',
          status: 'active',
          balance: 12000, // starting balance Rs. 12000 as per prompt examples
        }
      ]);

      // Seed default cut-off times if Settings empty
      const cutoffKey = 'cutoff_times';
      const existingSettings = await Setting.findOne({ key: cutoffKey });
      if (!existingSettings) {
        await Setting.create({
          key: cutoffKey,
          value: {
            breakfast: '07:30',
            lunch: '10:00',
            dinner: '18:00',
          },
        });
      }
      
      console.log('Seeding completed successfully!');
    }

    // Attempt login
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    if (user.status === 'inactive') {
      return NextResponse.json(
        { success: false, message: 'Your account is inactive. Contact Admin.' },
        { status: 403 }
      );
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Sign JWT token
    const tokenPayload = {
      userId: user._id.toString() as string,
      email: user.email,
      role: user.role,
      name: user.name,
    };
    const token = await signToken(tokenPayload);

    // Create Response and set cookie
    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        userId: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        balance: user.balance,
      },
    });

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Server error' },
      { status: 500 }
    );
  }
}
