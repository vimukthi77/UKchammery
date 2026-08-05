import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import HistoryLog from '@/models/HistoryLog';
import User from '@/models/User';

export async function GET() {
  try {
    await dbConnect();
    const logs = await HistoryLog.find({})
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 })
      .limit(200);

    return NextResponse.json({ success: true, logs });
  } catch (error: any) {
    console.error('History logs fetch error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
