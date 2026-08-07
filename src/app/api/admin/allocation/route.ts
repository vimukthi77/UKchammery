import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import MonthlySummary from '@/models/MonthlySummary';
import HistoryLog from '@/models/HistoryLog';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');

    if (!month) {
      return NextResponse.json({ success: false, message: 'Missing month parameter' }, { status: 400 });
    }

    const summary = await MonthlySummary.findOne({ month });
    const allocatedAmount = summary ? (summary.allocatedAmount || 0) : 0;

    return NextResponse.json({ success: true, allocatedAmount });
  } catch (error: any) {
    console.error('Allocation fetch error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const adminId = request.headers.get('x-user-id') as string;
    const { month, amount } = await request.json();

    if (!month) {
      return NextResponse.json({ success: false, message: 'Missing month parameter' }, { status: 400 });
    }
    if (amount === undefined || amount === null || isNaN(amount) || amount < 0) {
      return NextResponse.json({ success: false, message: 'Invalid allocation amount' }, { status: 400 });
    }

    // Check if month is already finalized
    const existingSummary = await MonthlySummary.findOne({ month });
    if (existingSummary?.finalized) {
      return NextResponse.json({ success: false, message: `Month ${month} is already finalized. Cannot edit allocation.` }, { status: 400 });
    }

    const updatedSummary = await MonthlySummary.findOneAndUpdate(
      { month },
      { $set: { allocatedAmount: amount } },
      { upsert: true, returnDocument: 'after' }
    );

    // Record in History Log
    await HistoryLog.create({
      userId: adminId,
      action: 'Update Allocation',
      details: `Updated allocation for ${month} to Rs. ${amount}`
    });

    return NextResponse.json({
      success: true,
      message: 'Monthly allocation updated successfully',
      allocatedAmount: updatedSummary.allocatedAmount
    });
  } catch (error: any) {
    console.error('Allocation update error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
