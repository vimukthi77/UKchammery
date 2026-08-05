import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Setting from '@/models/Setting';
import HistoryLog from '@/models/HistoryLog';

export async function GET() {
  try {
    await dbConnect();
    const settings = await Setting.findOne({ key: 'cutoff_times' });
    const cutoffTimes = settings?.value || { breakfast: '07:30', lunch: '10:00', dinner: '18:00' };
    return NextResponse.json({ success: true, cutoffTimes });
  } catch (error: any) {
    console.error('Settings fetch error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const adminId = request.headers.get('x-user-id') as string;
    const { breakfast, lunch, dinner } = await request.json();

    if (!breakfast || !lunch || !dinner) {
      return NextResponse.json({ success: false, message: 'Missing cut-off values' }, { status: 400 });
    }

    // Optional validation: check if times are format HH:MM
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(breakfast) || !timeRegex.test(lunch) || !timeRegex.test(dinner)) {
      return NextResponse.json({ success: false, message: 'Invalid time format. Use HH:MM.' }, { status: 400 });
    }

    const updatedSetting = await Setting.findOneAndUpdate(
      { key: 'cutoff_times' },
      { value: { breakfast, lunch, dinner } },
      { returnDocument: 'after', upsert: true }
    );

    // Record in History Log
    await HistoryLog.create({
      userId: adminId,
      action: 'Update Settings',
      details: `Updated cut-off times: Breakfast: ${breakfast}, Lunch: ${lunch}, Dinner: ${dinner}`
    });

    return NextResponse.json({
      success: true,
      message: 'Cut-off times updated successfully',
      cutoffTimes: updatedSetting.value
    });
  } catch (error: any) {
    console.error('Settings update error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
