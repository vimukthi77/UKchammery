import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import HistoryLog from '@/models/HistoryLog';
import MealRequest from '@/models/MealRequest';
import Payment from '@/models/Payment';
import { hashPassword } from '@/lib/auth';
import { getLocalTodayStr, getMonthStr } from '@/lib/dateUtils';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (userId) {
      const todayStr = getLocalTodayStr();
      const currentMonth = getMonthStr(todayStr);
      const startOfMonth = `${currentMonth}-01`;
      const endOfMonth = `${currentMonth}-31`;
      
      const meals = await MealRequest.find({
        userId,
        date: { $gte: startOfMonth, $lte: endOfMonth }
      }).sort({ date: -1 });
      
      return NextResponse.json({ success: true, meals });
    }
    
    const users = await User.find({}).select('-passwordHash').sort({ createdAt: -1 });
    return NextResponse.json({ success: true, users });
  } catch (error: any) {
    console.error('Admin users fetch error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const adminId = request.headers.get('x-user-id') as string;
    const { name, email, password, role, balance, location } = await request.json();

    if (!name || !email || !password || !role) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json({ success: false, message: 'Email already registered' }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);
    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role,
      balance: balance || 0,
      location: location || 'none',
      status: 'active'
    });

    // Record in History Log
    await HistoryLog.create({
      userId: adminId,
      action: 'Create User',
      details: `Created user ${name} (${email}) with role ${role}`
    });

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      user: {
        userId: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        balance: newUser.balance,
        location: newUser.location
      }
    });
  } catch (error: any) {
    console.error('Admin user creation error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await dbConnect();
    const adminId = request.headers.get('x-user-id') as string;
    const body = await request.json();
    
    // Check if updating past meal records
    if (body.action === 'update_meals') {
      const { userId, date, breakfast, lunch, dinner } = body;
      if (!userId || !date) {
        return NextResponse.json({ success: false, message: 'Missing userId or date' }, { status: 400 });
      }
      
      const meal = await MealRequest.findOneAndUpdate(
        { userId, date },
        { breakfast: !!breakfast, lunch: !!lunch, dinner: !!dinner },
        { upsert: true, returnDocument: 'after' }
      );
      
      // Trigger pre-save points calculations
      await meal.save();
      
      await HistoryLog.create({
        userId: adminId,
        action: 'Admin Update Meal Request',
        details: `Admin updated meals for user ${userId} on date ${date}: Breakfast=${breakfast}, Lunch=${lunch}, Dinner=${dinner}`
      });
      
      return NextResponse.json({ success: true, message: 'Meal request updated successfully', meal });
    }

    const { userId, name, email, role, status, balance, password, location } = body;

    if (!userId) {
      return NextResponse.json({ success: false, message: 'Missing userId' }, { status: 400 });
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    // Update details
    if (name) user.name = name;
    if (email && email.toLowerCase() !== user.email) {
      const emailExists = await User.findOne({ email: email.toLowerCase() });
      if (emailExists) {
        return NextResponse.json({ success: false, message: 'Email already in use' }, { status: 400 });
      }
      user.email = email.toLowerCase();
    }
    if (role) user.role = role;
    if (status) user.status = status;
    if (balance !== undefined) user.balance = balance;
    if (password) {
      user.passwordHash = await hashPassword(password);
    }
    if (location !== undefined) user.location = location;

    await user.save();

    // Record in History Log
    await HistoryLog.create({
      userId: adminId,
      action: 'Update User',
      details: `Updated user details for ${user.name} (${user.email}). Status: ${user.status}, Balance: ${user.balance}`
    });

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      user: {
        userId: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        balance: user.balance,
        status: user.status,
        location: user.location
      }
    });
  } catch (error: any) {
    console.error('Admin user update error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await dbConnect();
    const adminId = request.headers.get('x-user-id') as string;
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ success: false, message: 'Missing userId' }, { status: 400 });
    }

    const userToDelete = await User.findById(userId);
    if (!userToDelete) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    if (userId === adminId) {
      return NextResponse.json({ success: false, message: 'Cannot delete your own administrator account' }, { status: 400 });
    }

    await User.findByIdAndDelete(userId);
    await MealRequest.deleteMany({ userId });
    await Payment.deleteMany({ userId });

    await HistoryLog.create({
      userId: adminId,
      action: 'Delete User',
      details: `Deleted user ${userToDelete.name} (${userToDelete.email})`
    });

    return NextResponse.json({ success: true, message: 'User deleted successfully' });
  } catch (error: any) {
    console.error('Admin user delete error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}
