import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Notification from '@/models/Notification';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50);

    return NextResponse.json({ success: true, notifications });
  } catch (error: any) {
    console.error('Notifications fetch error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await dbConnect();
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { notificationId, markAll } = await request.json();

    if (markAll) {
      await Notification.updateMany({ userId, read: false }, { read: true });
      return NextResponse.json({ success: true, message: 'All notifications marked as read' });
    }

    if (!notificationId) {
      return NextResponse.json({ success: false, message: 'Missing notificationId' }, { status: 400 });
    }

    await Notification.updateOne({ _id: notificationId, userId }, { read: true });
    return NextResponse.json({ success: true, message: 'Notification marked as read' });
  } catch (error: any) {
    console.error('Notifications update error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
